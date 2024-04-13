import { StatusCodes } from 'http-status-codes';
import mongoose, { ClientSession, ProjectionType } from 'mongoose';
import { log } from '@/config';
import { PRODUCT_VARIANT_TYPES } from '@/config/enums/product';
import {
  CreateProductBody,
  UpdateProductBody,
  IProductImage,
  IProductModel,
  IProductVariant,
  IProduct,
  IProductInventory, IProductVariantOpt, CreateProductVariantBody
} from '@/interfaces/models/product';
import { Product, ProductInventory } from '@/models';
import { ProductVariant } from '@/models/product-variant.model';
import { awsS3Service } from '@/services/aws-s3.service';
import { inventoryService } from '@/services/inventory.service';
import { ApiError } from '@/utils';

const getProductById = async (id: IProduct['id']) => {
  return Product.findById(id);
};

const getDetailProductByShop = async (
  id: IProduct['id'],
  shop: IProduct['shop'],
  projection: ProjectionType<IProduct> = {}
) => {
  return Product.findOne({
    _id: new mongoose.Types.ObjectId(id),
    shop: new mongoose.Types.ObjectId(shop),
  }, projection);
};

const getProductVariantById = async (id: IProductVariant['id']) => {
  return ProductVariant.findById(id);
};

const generateProductVariantNone = async (
  product: IProduct,
  body: Pick<IProductInventory, 'price' | 'stock' | 'sku'>,
  session: ClientSession
) => {
  return inventoryService.insertInventory(
    {
      shop: product.shop,
      product: product.id,
      ...body,
    }, session
  );
};

const generateSingleVariantProducts = async (
  product: IProduct,
  variants: CreateProductBody['new_variants'],
  session: ClientSession
) => {
  const productVariantIds: IProduct['variants'] = [];
  if (!variants) throw new ApiError(StatusCodes.BAD_REQUEST);

  await Promise.all(
    variants.map(async (variant) => {
      if (!variant.price || !variant.variant_name) throw new ApiError(StatusCodes.BAD_REQUEST);
      const inventoryCreated = await inventoryService.insertInventory({
        shop: product.shop,
        product: product.id,
        variant: variant.variant_name,
        stock: variant.stock || 0,
        price: variant.price,
        sku: variant.sku,
      }, session);

      const productVariantCreated = await createProductVariant({
        product: product.id,
        inventory: inventoryCreated._id,
        variant_name: variant.variant_name,
      }, session);
      productVariantIds.push(productVariantCreated.id);
    })
  );
  return productVariantIds;
};

const generateCombineVariantProducts = async (
  product: IProduct,
  variants: CreateProductBody['new_variants'],
  session: ClientSession
) => {
  const productVariantIds: IProduct['variants'] = [];
  if (!variants || !variants[0]?.variant_options) throw new ApiError(StatusCodes.BAD_REQUEST);

  const variantsCache = new Map<IProductVariant['variant_name'], IProductVariantOpt['variant']>();

  // init sub variants
  await Promise.all(
    variants[0].variant_options.map(async (subVariant) => {
      if (subVariant.variant) {
        variantsCache.set(subVariant.variant_name, subVariant.variant);
      }
      else {
        const variantCreated = await createProductVariant(
          {
            product: product.id,
            variant_name: subVariant.variant_name,
          },
          session
        );
        variantsCache.set(subVariant.variant_name, variantCreated._id);
      }
    })
  );

  // init inventories variants
  await Promise.all(
    variants.map(async (variant) => {

      if (!variant.variant_name || !variant.variant_options) throw new ApiError(StatusCodes.BAD_REQUEST);

      const variantOptions: Pick<IProductVariantOpt, 'inventory' | 'variant'>[] = [];

      await Promise.all(
        variant.variant_options.map(async (subVariant) => {
          const inventoryCreated = await inventoryService.insertInventory(
            {
              shop: product.shop,
              product: product.id,
              variant: variant.variant_name + '-' + subVariant.variant_name,
              price: subVariant.price,
              stock: subVariant.stock,
              sku: subVariant.sku,
            },
            session
          );

          const variantId = variantsCache.get(subVariant.variant_name);
          if (!variantId) throw new ApiError(StatusCodes.INTERNAL_SERVER_ERROR);

          variantOptions.push({
            inventory: inventoryCreated.id,
            variant: variantId,
          });
        })
      );

      const productVariantCreated = await createProductVariant(
        {
          product: product.id,
          variant_name: variant.variant_name,
          variant_options: variantOptions,
        },
        session
      );
      productVariantIds.push(productVariantCreated.id);
    })
  );
  return productVariantIds;
};

const updateCombineVariantProducts = async (
  product: IProduct,
  variants: CreateProductBody['new_variants'],
  session: ClientSession
) => {
  const productVariantIds: IProduct['variants'] = [];
  if (!variants || !variants[0]?.variant_options) throw new ApiError(StatusCodes.BAD_REQUEST);

  const variantsNewCache = new Map<IProductVariant['variant_name'], IProductVariantOpt['variant']>();

  // init sub variants
  await Promise.all(
    variants[0].variant_options.map(async (subVariant) => {
      if (!subVariant.variant) {
        const variantCreated = await createProductVariant(
          {
            product: product.id,
            variant_name: subVariant.variant_name,
          },
          session
        );
        variantsNewCache.set(subVariant.variant_name, variantCreated._id);
      }
    })
  );

  // init inventories variants
  await Promise.all(
    variants.map(async (variant) => {

      if (!variant.variant_name || !variant.variant_options) throw new ApiError(StatusCodes.BAD_REQUEST);

      const variantOptions: Pick<IProductVariantOpt, 'inventory' | 'variant'>[] = [];

      await Promise.all(
        variant.variant_options.map(async (subVariant) => {
          const inventoryCreated = await inventoryService.insertInventory(
            {
              shop: product.shop,
              product: product.id,
              variant: variant.variant_name + '-' + subVariant.variant_name,
              price: subVariant.price,
              stock: subVariant.stock,
              sku: subVariant.sku,
            },
            session
          );

          const variantId = subVariant.variant ?
            subVariant.variant :
            variantsNewCache.get(subVariant.variant_name);
          if (!variantId) throw new ApiError(StatusCodes.INTERNAL_SERVER_ERROR);

          variantOptions.push({
            inventory: inventoryCreated.id,
            variant: variantId,
          });
        })
      );

      const productVariantUpdated = await ProductVariant.findOneAndUpdate(
        {
          product: product.id,
          variant_name: variant.variant_name,
        },
        {
          $addToSet: {
            variant_options: variantOptions,
          },
        },
        { session, upsert: true, new: true }
      );
      productVariantIds.push(productVariantUpdated.id);
    })
  );
  return productVariantIds;
};

/**
 * update product by applying the following steps in sequence:
 *
 * -. Update variant product
 *    if variant_type in updateBody diff variant_type in db -> delete previous data variant ( inventory, variant ) then update new variants
 *
 *    if variant_type in updateBody same DB
 *        none variant: update inventory
 *        combine, single variant: CRUD inventories, variants
 *
 * -. Update, delete, or add images
 *    following request image object:
 *      delete: object require only prop id
 *      add: props + exclude id
 *      update: require id, relative_url + props
 */
const updateProduct = async (
  productId: IProduct['id'],
  updateBody: UpdateProductBody,
  session: ClientSession
) => {

  const product = await getProductById(productId);
  if (!product) throw new ApiError(StatusCodes.NOT_FOUND, 'Product not found');

  if (updateBody?.variant_type) {

    //  remove previous data variant and create new
    if (updateBody.variant_type !== product.variant_type) {

      if (product.variant_type === PRODUCT_VARIANT_TYPES.NONE) {
        await ProductInventory.deleteOne({
          _id: product.inventory,
        }, session);
        updateBody.inventory = undefined;
      }

      if (product.variant_type === PRODUCT_VARIANT_TYPES.SINGLE && product?.variants) {

        const inventoryIds: IProductVariant['inventory'][] = [];
        const variantsIds: IProductVariant['id'][] = [];

        await product
          .populate<{ variants: IProductVariant[] }>('variants')
          .then((doc) => {
            doc.variants.forEach(variant => {
              variantsIds.push(variant.id);
              inventoryIds.push(variant.inventory);
            });
            return;
          });

        await ProductInventory.deleteMany({
          _id: { $in: inventoryIds },
        }, session);

        await ProductVariant.deleteMany({
          _id: { $in: variantsIds },
        }, session);
      }

      if (product.variant_type === PRODUCT_VARIANT_TYPES.COMBINE && product?.variants) {
        const inventoryIds: IProductVariant['inventory'][] = [];
        const variantsIds: IProductVariant['id'][] = [];

        await product.populate<{ variants: IProductVariant[] }>({
          path: 'variants',
          populate: [
            { path: 'variant_options' },
          ],
        }).then((doc) => {
          doc.variants.forEach(variant => {
            variantsIds.push(variant.id);
            variant.variant_options && variant.variant_options.forEach(variantOption => {
              variantsIds.push(variantOption.variant);
              inventoryIds.push(variantOption.inventory);
            });
          });
          return;
        });

        await ProductInventory.deleteMany({
          _id: { $in: inventoryIds },
        }, session);

        await ProductVariant.deleteMany({
          _id: { $in: variantsIds },
        }, session);
      }

      switch (updateBody.variant_type) {
        case PRODUCT_VARIANT_TYPES.NONE: {
          if (!updateBody.price) throw new ApiError(StatusCodes.BAD_REQUEST);
          const inventoryCreated = await generateProductVariantNone(product, {
            price: updateBody.price,
            stock: updateBody.stock || 0,
            sku: updateBody.sku,
          }, session);
          updateBody.inventory = inventoryCreated.id;
          updateBody.variant_group_name = '';
          updateBody.variant_sub_group_name = '';
          updateBody.variants = [];
        }
          break;
        case PRODUCT_VARIANT_TYPES.SINGLE:
          updateBody.variants = await generateSingleVariantProducts(
            product, updateBody.new_single_variants, session
          );
          updateBody.variant_sub_group_name = '';
          break;
        case PRODUCT_VARIANT_TYPES.COMBINE:
          updateBody.variants = await generateCombineVariantProducts(
            product, updateBody.new_combine_variants, session
          );
          break;
      }
    }

    // update or add new
    if (updateBody.variant_type === product.variant_type) {

      if (product.variant_type === PRODUCT_VARIANT_TYPES.NONE) {
        await product.populate<{ inventory: IProductInventory }>('inventory')
          .then(async (doc) => {
            await ProductInventory.updateOne(
              { _id: product.inventory },
              {
                price: updateBody?.price ?? doc.inventory.price,
                stock: updateBody?.stock ?? doc.inventory.stock,
                sku: updateBody?.sku ?? doc.inventory.sku,
              },
              session
            );
            return;
          });
      }

      if (product.variant_type === PRODUCT_VARIANT_TYPES.SINGLE) {

        if (updateBody?.update_variants && updateBody.update_variants.length > 0) {
          await Promise.all(
            updateBody.update_variants.map(async (variant) => {
              const productVariant = await ProductVariant.findById(variant.id);
              if (!productVariant) {
                throw new ApiError(StatusCodes.NOT_FOUND);
              }
              if (
                Object.keys(variant).length === 1 &&
                Object.prototype.hasOwnProperty.call(variant, 'id')
              ) {
                await ProductInventory.deleteOne({ _id: productVariant.inventory }, { session });
                await productVariant.remove({ session });
              }
              await productVariant.update({
                variant_name: variant.variant_name,
              }, { session });
            })
          );
          updateBody.variants = product.variants;
        }

        if (updateBody?.variant_inventories && updateBody.variant_inventories.length > 0) {
          await Promise.all(
            updateBody.variant_inventories.map(async (variant) => {
              const { id, ...update } = variant;
              await ProductInventory.findOneAndUpdate(
                { _id: new mongoose.Types.ObjectId(id) },
                { ...update },
                { session }
              );
            })
          );
          updateBody.variants = product.variants;
        }

        if (updateBody?.new_single_variants && updateBody.new_single_variants.length > 0) {
          const variantIds = await generateSingleVariantProducts(
            product, updateBody.new_single_variants, session
          );
          if (!product.variants) throw new ApiError(StatusCodes.INTERNAL_SERVER_ERROR);
          updateBody.variants = [...product.variants, ...variantIds];
        }
      }

      if (product.variant_type === PRODUCT_VARIANT_TYPES.COMBINE) {

        if (updateBody?.variant_inventories && updateBody.variant_inventories.length > 0) {
          await Promise.all(
            updateBody.variant_inventories.map(async (variant) => {
              const { id, ...update } = variant;
              await ProductInventory.findOneAndUpdate(
                { _id: new mongoose.Types.ObjectId(id) },
                { ...update },
                { session }
              );
            })
          );
        }

        if (updateBody?.update_variants && updateBody.update_variants.length > 0) {
          await Promise.all(
            updateBody.update_variants.map(async variant => {

              if (
                Object.keys(variant).length === 1 &&
                Object.prototype.hasOwnProperty.call(variant, 'id')
              ) {
                const productVariant = await ProductVariant.findById(variant.id);
                if (!productVariant || !productVariant?.variant_options) {
                  throw new ApiError(StatusCodes.NOT_FOUND);
                }

                // case variant parent
                if (productVariant.variant_options.length > 0) {
                  const inventoryIds = productVariant.variant_options.map(variantOpt => variantOpt.inventory);
                  await ProductInventory.deleteMany(
                    { _id: { $in: inventoryIds } },
                    { session }
                  );

                  // case variant child
                }
                else {

                  const inventoryIdsDelete: IProductVariant['inventory'][] = [];

                  await product.populate<{ variants: IProductVariant[] }>('variants')
                    .then((doc) => {
                      doc.variants.forEach(variantProductDB => {
                        variantProductDB.variant_options &&
                        variantProductDB.variant_options.forEach(variantOpt => {
                          if (variantOpt.variant.toString() === variant.id) {
                            inventoryIdsDelete.push(variantOpt.inventory);
                          }
                        });
                      });
                      return;
                    });


                  await ProductInventory.deleteMany(
                    { _id: { $in: inventoryIdsDelete } },
                    { session }
                  );

                  await ProductVariant.updateMany(
                    { product: product.id },
                    {
                      $pull: {
                        variant_options: { variant: productVariant.id },
                      },
                    }
                  );
                }

                await productVariant.remove();
                return;
              }

              await ProductVariant.findOneAndUpdate(
                { _id: new mongoose.Types.ObjectId(variant.id) },
                { variant_name: variant.variant_name },
                { session }
              );
            })
          );
          updateBody.variants = product.variants;
        }

        if (updateBody?.new_combine_variants && updateBody.new_combine_variants.length > 0) {
          const variantIds = await updateCombineVariantProducts(
            product, updateBody.new_combine_variants, session
          );
          if (!product.variants) throw new ApiError(StatusCodes.INTERNAL_SERVER_ERROR);

          const variantsDB = product.variants.map(variant => variant.toString());
          const newVariants = variantIds.map(variant => variant.toString());
          updateBody.variants = [...new Set([...variantsDB, ...newVariants])];
        }
      }
    }
  }

  if (updateBody?.images) {
    if (updateBody.images.length > 0) {
      const image_ids_for_delete: IProductImage['id'][] = [];
      const relative_urls_for_delete: IProductImage['relative_url'][] = [];
      const new_relative_urls: IProductImage['relative_url'][] = [];
      let isHaveAnyRelativeUrl = false;
      const updateBodyImages = new Map();

      for (const img of updateBody.images) {
        if (img?.id) {
          updateBodyImages.set(img.id, img);
        }
        if (img?.relative_url) {
          // validate object s3 is exist
          await awsS3Service.getObject(img.relative_url);
          isHaveAnyRelativeUrl = true;
        }
      }

      product.images.forEach((imageDB) => {
        const imageUpdate = updateBodyImages.get(imageDB.id);

        if (imageUpdate) {

          if (Object.keys(imageUpdate).length === 1) {
            log.info(`case delete img: delete by key ${imageDB.relative_url}`);
            image_ids_for_delete.push(imageDB.id);
            relative_urls_for_delete.push(imageDB.relative_url);
            return;
          }

          if (imageUpdate?.relative_url && imageUpdate.relative_url !== imageDB.relative_url) {
            log.info(`case update img: delete old img by key ${imageDB.relative_url}`);
            image_ids_for_delete.push(imageDB.id);
            relative_urls_for_delete.push(imageDB.relative_url);
            new_relative_urls.push(imageUpdate.relative_url);
          }
        }
      });

      // validate delete quantity image not exceed images in db
      if (image_ids_for_delete.length >= product.images.length && !isHaveAnyRelativeUrl) {
        // clear images
        if (new_relative_urls.length > 0) {
          await awsS3Service.deleteMultiObject(new_relative_urls);
        }
        throw new ApiError(StatusCodes.BAD_REQUEST, 'product must at least 1 image');
      }

      if (relative_urls_for_delete.length > 0) {
        await awsS3Service.deleteMultiObject(relative_urls_for_delete);
      }
      updateBody.images = [...product.images, ...updateBody.images];
      updateBody.images = updateBody.images.filter((img) => {
        return img.id && !image_ids_for_delete.includes(img.id);
      });
      updateBody.images = updateBody.images.map((img, index) => ({
        ...img, rank: index + 1,
      }));
    }
    else {
      updateBody.images = product.images;
    }
  }

  Object.assign(product, updateBody);
  await product.save({ session });
  return product;
};

const createProduct = async (body: CreateProductBody, session: ClientSession) => {
  const product = await Product.create([body], { session });
  return product[0];
};

const createProductVariant = async (
  body: CreateProductVariantBody,
  session: ClientSession
) => {
  const productVariant = await ProductVariant.create([body], { session });
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
  return Product.paginate(filter, options);
};

const deleteProductById = async (productId: IProduct['id'], session: ClientSession) => {
  const product = await getProductById(productId);
  if (!product) throw new ApiError(StatusCodes.NOT_FOUND, 'Product not found');
  return product.remove({ session });
};

export const productService = {
  getDetailProductByShop,
  createProduct,
  getProductById,
  queryProducts,
  deleteProductById,
  updateProduct,
  getProductVariantById,
  createProductVariant,
  generateSingleVariantProducts,
  generateCombineVariantProducts,
  generateProductVariantNone,
};
