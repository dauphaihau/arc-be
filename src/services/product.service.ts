// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheckk
import { StatusCodes } from 'http-status-codes';
import { ClientSession } from 'mongoose';
import { ILineItemOrder } from '@/interfaces/models/order';
import { ProductVariant } from '@/models/product-variant.model';
import {
  CreateProductPayload,
  UpdateProductPayload,
  IProductAttribute,
  IProductImage,
  IProduct,
  IProductModel,
  IVariantCreateProduct, IProductVariant
} from '@/interfaces/models/product';
// import { inventoryService } from '@/services/inventory.service';
import { Product } from '@/models';
import { ApiError } from '@/utils';
import { getValidKeysAttrByCategory } from '@/schema';
import { log, env } from '@/config';
import { awsS3Service } from '@/services/aws-s3.service';
import { inventoryService } from '@/services/inventory.service';

const validateAttributes = (category: IProduct['category'], attributes: IProductAttribute) => {
  const keysValid = getValidKeysAttrByCategory(category);
  const keyInvalid: string[] = [];
  Object.keys(attributes).forEach((key) => {
    if (!keysValid.includes(key)) {
      keyInvalid.push(key);
    }
  });
  if (keyInvalid.length) {
    throw new ApiError(StatusCodes.BAD_REQUEST, `keys of attributes invalid: ${keyInvalid.join(', ')}`);
  }
};

const getProductById = async (id: IProduct['id']) => {
  return Product.findById(id);
};

const getProductVariantById = async (id: IProductVariant['id']) => {
  return ProductVariant.findById(id);
};

/**
 * update product by applying the following steps in sequence:
 *
 * 1. Validate attribute
 *
 * 2. Validate images, and update, add, delete images
 *    following request image object:
 *      delete: object require only prop id
 *      add: props + exclude id
 *      update: require id, relative_url + props
 */
const updateProduct = async (
  productId: IProduct['id'],
  updateBody: UpdateProductPayload,
  session: ClientSession
) => {
  const product = await getProductById(productId);
  if (!product) throw new ApiError(StatusCodes.NOT_FOUND, 'Product not found');

  if (updateBody?.attributes) {
    validateAttributes(updateBody.category, updateBody.attributes);
  }

  if (updateBody?.images && updateBody.images.length > 0) {
    const delete_image_ids: IProductImage['id'][] = [];
    const delete_relative_urls: IProductImage['relative_url'][] = [];
    const new_relative_urls: IProductImage['relative_url'][] = [];
    const updateBodyImages = new Map();

    for (const img of updateBody.images) {
      if (img?.id) {
        updateBodyImages.set(img.id, img);
      }
      if (img.relative_url) {
        // validate object s3 is exist
        await awsS3Service.getObject(img.relative_url);
      }
    }

    product.images.forEach((imageDB) => {
      const imageUpdate = updateBodyImages.get(imageDB.id);

      if (!imageUpdate) {
        log.info('case add img');
        updateBody.images.push(imageDB);
      } else {

        if (Object.keys(imageUpdate).length === 1) {
          log.info(`case delete img: delete by key ${imageDB.relative_url}`);
          delete_image_ids.push(imageDB.id);
          delete_relative_urls.push(imageDB.relative_url);
          return;
        }

        if (imageUpdate?.relative_url && imageUpdate.relative_url !== imageDB.relative_url) {
          log.info(`case update img: delete old img by key ${imageDB.relative_url}`);
          delete_image_ids.push(imageDB.id);
          delete_relative_urls.push(imageDB.relative_url);
          new_relative_urls.push(imageUpdate.relative_url);
        }
      }
    });

    // validate delete quantity image not exceed images in db
    if (delete_image_ids.length >= product.images.length) {
      // clear images
      if (new_relative_urls.length > 0) {
        await awsS3Service.deleteMultiObject(new_relative_urls);
      }
      throw new ApiError(StatusCodes.BAD_REQUEST, 'product must at least 1 image');
    }

    if (delete_relative_urls.length > 0) {
      await awsS3Service.deleteMultiObject(delete_relative_urls);
    }

    updateBody.images = updateBody.images.filter((img) => {
      return !delete_image_ids.includes(img.id);
    });
  }

  Object.assign(product, updateBody);
  await product.save({ session });
  return product;
};

const createProduct = async (payload: CreateProductPayload, session: ClientSession) => {
  validateAttributes(payload.category, payload.attributes);
  const product = await Product.create([payload], { session });
  return product[0];
};

const createProductVariant = async (
  payload: IVariantCreateProduct,
  // payload: CreateProductVariantPayload,
  session: ClientSession
) => {
  const productVariant = await ProductVariant.create([payload], { session });
  return productVariant[0];
};

/**
 * Query for products
 * @param filter - Mongo filter
 * @param options - Query options
 * @param [options.sortBy] - Sort option in the format: sortField:(desc|asc)
 * @param [options.limit] - Maximum number of results per page (default = 10)
 * @param [options.page] - Current page (default = 1)
 * @returns {Promise<QueryResult>}
 */
const queryProducts: IProductModel['paginate'] = async (filter, options) => {
  const products = await Product.paginate(filter, options);
  return products;
};

const deleteProductById = async (productId: IProduct['id'], session: ClientSession) => {
  const product = await getProductById(productId);
  if (!product) throw new ApiError(StatusCodes.NOT_FOUND, 'Product not found');
  return product.remove({ session });
};

const checkAndGetShopProducts = async (
  shop: IProduct['shop'],
  products: ILineItemOrder['products']
) => {
  return Promise.all(
    products.map(async (prod) => {
      const inventoryInDB = await inventoryService.getInventoryById(prod.inventory);
      if (!inventoryInDB) {
        throw new ApiError(StatusCodes.NOT_FOUND, `inventory ${prod.inventory} not found`);
      }
      const productInDB = await getProductById(inventoryInDB.product);
      if (!productInDB) {
        throw new ApiError(StatusCodes.NOT_FOUND, `product ${inventoryInDB.product} not found`);
      }
      log.debug('invent-in-db %o', inventoryInDB);
      // const productInDB = await getProductById(prod.id);
      await inventoryInDB?.populate('product');
      if (inventoryInDB.stock < prod.quantity) {
        throw new ApiError(
          StatusCodes.BAD_REQUEST, `quantity inventory ${inventoryInDB.id} is exceed stock`
        );
      }
      if (inventoryInDB.shop.toString() !== shop) {
        throw new ApiError(
          StatusCodes.BAD_REQUEST, `product ${inventoryInDB.id} not match with ${shop}`
        );
      }
      return {
        id: prod.inventory,
        shop,
        image_url: env.aws_s3.host_bucket + '/' + productInDB?.images[0].relative_url,
        title: productInDB?.title,
        price: inventoryInDB.stock,
        // title: inventoryInDB.product.title,
        // price: inventoryInDB.price,
        quantity: prod.quantity,

        // id: prod.id,
        // shop_id,
        // title: productInDB.title,
        // image_url: env.aws_s3.host_bucket + '/' + productInDB.images[0].relative_url,
        // price: productInDB.price,
        // quantity: prod.quantity,
      };
    })
  );
};

// const minusQuantityProduct = async (
//   productId: IProduct['id'],
//   quantity: IProduct['quantity'],
//   session: ClientSession
// ) => {
//   return Product.updateOne(
//     { _id: productId },
//     {
//       $inc: {
//         product_quantity: -quantity,
//       },
//     },
//     { session }
//   );
// };

export const productService = {
  createProduct,
  getProductById,
  queryProducts,
  deleteProductById,
  updateProduct,
  checkAndGetShopProducts,
  // minusQuantityProduct,
  getProductVariantById,
  createProductVariant,
};
