import { StatusCodes } from 'http-status-codes';
import { ClientSession } from 'mongoose';
import { ILineItemOrder } from '@/interfaces/models/order';
import {
  CreateProductPayload,
  UpdateProductPayload, IProductAttribute, IProductImage, IProduct, IProductModel
} from '@/interfaces/models/product';
import { Product } from '@/models';
import { ApiError } from '@/utils';
import { getValidKeysAttrByCategory } from '@/schema';
import { log, env } from '@/config';
import { awsS3Service } from '@/services/aws-s3.service';

const validateAttributes = (attributes: IProductAttribute) => {
  const keysValid = getValidKeysAttrByCategory(attributes.category);
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
    validateAttributes(updateBody.attributes);
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
  validateAttributes(payload.attributes);
  const product = await Product.create([payload], { session });
  return product[0];
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
  shop_id: IProduct['shop_id'],
  products: ILineItemOrder['products']
) => {
  return Promise.all(
    products.map(async (prod) => {
      const productInDB = await getProductById(prod.id);
      if (!productInDB) {
        throw new ApiError(StatusCodes.NOT_FOUND, `product ${prod.id} not found`);
      }
      if (productInDB.quantity < prod.quantity) {
        throw new ApiError(
          StatusCodes.BAD_REQUEST, `quantity product ${prod.id} is exceed stock`
        );
      }
      if (productInDB.shop_id.toString() !== shop_id) {
        throw new ApiError(
          StatusCodes.BAD_REQUEST, `product ${productInDB.id} not match with ${shop_id}`
        );
      }
      return {
        id: prod.id,
        shop_id,
        title: productInDB.title,
        price: productInDB.price,
        image_url: env.aws_s3.host_bucket + '/' + productInDB.images[0].relative_url,
        quantity: prod.quantity,
      };
    })
  );
};

const minusQuantityProduct = async (
  productId: IProduct['id'],
  quantity: IProduct['quantity'],
  session: ClientSession
) => {
  return Product.updateOne(
    { _id: productId },
    {
      $inc: {
        product_quantity: -quantity,
      },
    },
    { session }
  );
};

export const productService = {
  createProduct,
  getProductById,
  queryProducts,
  deleteProductById,
  updateProduct,
  checkAndGetShopProducts,
  minusQuantityProduct,
};
