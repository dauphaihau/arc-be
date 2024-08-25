import { StatusCodes } from 'http-status-codes';
import mongoose, { ClientSession, ProjectionType } from 'mongoose';
import { awsS3Service } from './aws-s3.service';
import { PRODUCT_VARIANT_TYPES } from '@/config/enums/product';
import { productInventoryService } from '@/services/product-inventory.service';
import { productVariantService } from '@/services/product-variant.service';
import {
  BaseCreateProduct
} from '@/interfaces/services/product';
import {
  IProductDoc,
  IProductImage,
  IProduct, IProductVariant
} from '@/interfaces/models/product';
import { Product, ProductInventory } from '@/models';
import { ProductVariant } from '@/models/product-variant.model';
import { ApiError, pick } from '@/utils';
import { log } from '@/config';
import { RequestUpdateProduct } from '@/interfaces/request/shop-product';

const getProductById = async (id: IProductDoc['id']) => {
  return Product.findById(id);
};

const getDetailProductByShop = async (
  id: IProductDoc['id'],
  shop: IProductDoc['shop'],
  projection: ProjectionType<IProductDoc> = {}
) => {
  return Product.findOne({
    _id: new mongoose.Types.ObjectId(id),
    shop: new mongoose.Types.ObjectId(shop),
  }, projection);
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
  updateBody: RequestUpdateProduct['body'],
  session: ClientSession
) => {
  const product = await getProductById(productId);
  if (!product) throw new ApiError(StatusCodes.NOT_FOUND, 'Product not found');

  if (updateBody?.images) {
    if (updateBody.images.length > 0) {
      const image_ids_for_delete: IProductImage['id'][] = [];
      const relative_urls_for_delete: IProductImage['relative_url'][] = [];
      const new_relative_urls: IProductImage['relative_url'][] = [];
      let isHaveAnyRelativeUrl = false;
      const updateBodyImagesMap = new Map();

      for (const img of updateBody.images) {
        if (img?.id) {
          updateBodyImagesMap.set(img.id, img);
        }
        if (img?.relative_url) {
          // validate is object s3 exist
          await awsS3Service.getObject(img.relative_url);
          isHaveAnyRelativeUrl = true;
        }
      }

      product.images.forEach((imageDB) => {
        const imageUpdate = updateBodyImagesMap.get(imageDB.id);

        if (imageUpdate) {

          if (Object.keys(imageUpdate).length === 1 && Object.hasOwn(imageUpdate, 'id')) {
            log.info(`case delete img: delete by key ${imageDB.relative_url}`);
            image_ids_for_delete.push(imageDB.id);
            relative_urls_for_delete.push(imageDB.relative_url);
          }
          else if (imageUpdate?.relative_url && imageUpdate.relative_url !== imageDB.relative_url) {
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

      updateBody.images = [...product.images as NonNullable<RequestUpdateProduct['body']['images']>, ...updateBody.images];

      if (image_ids_for_delete.length > 0) {
        updateBody.images = updateBody.images.filter((img) => {
          return img.id && !image_ids_for_delete.includes(img.id);
        });
      }

      updateBody.images = updateBody.images.map((img, index) => ({
        ...img, rank: index + 1,
      }));
      // console.log('update-body-images', updateBody.images);
    }
    // else {
    //   updateBody.images = product.images;
    // }
  }

  if (updateBody?.variant_type) {

    //  remove previous data variant and create new
    if (updateBody.variant_type !== product.variant_type) {

      if (product.variant_type === PRODUCT_VARIANT_TYPES.NONE) {
        await ProductInventory.deleteOne({
          _id: product.inventory,
        }, session);
        // updateBody.inventory = undefined;
        product.inventory = null;
      }

      if (product.variant_type === PRODUCT_VARIANT_TYPES.SINGLE && product.variants.length > 0) {

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

      if (product.variant_type === PRODUCT_VARIANT_TYPES.COMBINE && product.variants.length > 0) {
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
          const inventoryCreated = await productInventoryService.insertInventory({
            product: product.id,
            shop: product.shop,
            price: updateBody.price,
            stock: updateBody.stock || 0,
            sku: updateBody.sku,
          }, session);
          product.inventory = inventoryCreated.id;
          product.variant_group_name = '';
          product.variant_sub_group_name = '';
          product.variants = [];
        }
          break;
        // case PRODUCT_VARIANT_TYPES.SINGLE:
        //   product.variants = await productVariantService.generateSingleVariantProducts(
        //     product, updateBody.new_single_variants, session
        //   );
        //   updateBody.variant_sub_group_name = '';
        //   break;
        case PRODUCT_VARIANT_TYPES.COMBINE:
          product.variants = await productVariantService.generateCombineVariantProducts(
            product, updateBody.new_combine_variants, session
          );
          break;
      }
    }

    // update or add new
    if (updateBody.variant_type === product.variant_type) {

      if (updateBody.variant_type === PRODUCT_VARIANT_TYPES.NONE) {
        await ProductInventory.updateOne(
          { _id: product.inventory },
          { ...pick(updateBody, ['price', 'stock', 'sku']) },
          session
        );
      }

      if (updateBody.variant_type === PRODUCT_VARIANT_TYPES.SINGLE) {

        // if (updateBody?.delete_variants_ids && updateBody.delete_variants_ids.length > 0) {
        //   if (updateBody?.delete_variants_ids.length >= product.variants.length) {
        //     throw new ApiError(StatusCodes.BAD_REQUEST, 'Can not delete all variants');
        //   }
        //   const variants = await ProductVariant.find({
        //     _id: {
        //       $in: updateBody.delete_variants_ids.map(id => new mongoose.Types.ObjectId(id)),
        //     },
        //   });
        //   await ProductInventory.deleteMany({
        //     _id: { $in: variants.map(variant => variant.inventory) },
        //   }, { session });
        //
        //   await ProductVariant.deleteMany({
        //     _id: { $in: variants.map(variant => variant.id) },
        //   }, { session });
        //
        //   product.variants = product.variants.filter(variantId => {
        //     return !updateBody.delete_variants_ids.includes(variantId.toString());
        //   });
        // }

        if (updateBody?.update_variants && updateBody.update_variants.length > 0) {
          await Promise.all(
            updateBody.update_variants.map(async (variant) => {
              const productVariant = await ProductVariant.findById(variant.id);
              if (!productVariant) throw new ApiError(StatusCodes.NOT_FOUND);

              const inventoryData = pick(variant, ['price', 'stock', 'sku']);
              if (Object.keys(inventoryData).length > 0) {
                await ProductInventory.findOneAndUpdate(
                  { _id: new mongoose.Types.ObjectId(productVariant.inventory) },
                  { ...inventoryData },
                  { session }
                );
              }

              // case delete variant
              // if (
              //   Object.keys(variant).length === 1 &&
              //   Object.prototype.hasOwnProperty.call(variant, 'id')
              // ) {
              //   variantIdsDelete.push(productVariant.id);
              //   await ProductInventory.deleteOne({ _id: productVariant.inventory }, { session });
              //   await productVariant.remove({ session });
              // }

              // case update variant_name
              else if (variant.variant_name) {
                await productVariant.update({
                  variant_name: variant.variant_name,
                }, { session });
              }
            })
          );
        }

        if (updateBody?.new_single_variants && updateBody.new_single_variants.length > 0) {
          const variantIds = await productVariantService.generateSingleVariantProducts(
            product, updateBody.new_single_variants, session
          );
          if (!product.variants) throw new ApiError(StatusCodes.INTERNAL_SERVER_ERROR);
          product.variants = [...product.variants, ...variantIds];
        }
      }

      if (updateBody.variant_type === PRODUCT_VARIANT_TYPES.COMBINE) {

        if (updateBody?.variant_inventories && updateBody.variant_inventories.length > 0) {
          await Promise.all(
            updateBody.variant_inventories.map(async (variant) => {
              const { inventory_id, ...update } = variant;
              await ProductInventory.findOneAndUpdate(
                { _id: new mongoose.Types.ObjectId(inventory_id) },
                { ...update },
                { session }
              );
            })
          );
        }

        // if (updateBody?.delete_variants_ids && updateBody.delete_variants_ids.length > 0) {
        //   await Promise.all(
        //     updateBody.update_variants.map(async variant => {
        //       // case delete
        //       if (
        //         Object.keys(variant).length === 1 &&
        //         Object.prototype.hasOwnProperty.call(variant, 'id')
        //       ) {
        //         const productVariant = await ProductVariant.findById(variant.id);
        //         if (!productVariant || !productVariant?.variant_options) {
        //           throw new ApiError(StatusCodes.NOT_FOUND);
        //         }
        //
        //         // case variant parent
        //         if (productVariant.variant_options.length > 0) {
        //           const inventoryIds = productVariant.variant_options.map(variantOpt => variantOpt.inventory);
        //           await ProductInventory.deleteMany(
        //             { _id: { $in: inventoryIds } },
        //             { session }
        //           );
        //         }
        //         // case variant child
        //         else {
        //
        //           const inventoryIdsDelete: IProductVariant['inventory'][] = [];
        //
        //           await product.populate<{ variants: IProductVariant[] }>('variants')
        //             .then((doc) => {
        //               doc.variants.forEach(variantProductDB => {
        //                 variantProductDB.variant_options &&
        //               variantProductDB.variant_options.forEach(variantOpt => {
        //                 if (variantOpt.variant.toString() === variant.id) {
        //                   inventoryIdsDelete.push(variantOpt.inventory);
        //                 }
        //               });
        //               });
        //               return;
        //             });
        //
        //
        //           await ProductInventory.deleteMany(
        //             { _id: { $in: inventoryIdsDelete } },
        //             { session }
        //           );
        //
        //           await ProductVariant.updateMany(
        //             { product: product.id },
        //             {
        //               $pull: {
        //                 variant_options: { variant: productVariant.id },
        //               },
        //             }
        //           );
        //         }
        //
        //         await productVariant.remove();
        //         return;
        //       }
        //
        //       // case update
        //       await ProductVariant.findOneAndUpdate(
        //         { _id: new mongoose.Types.ObjectId(variant.id) },
        //         { variant_name: variant.variant_name },
        //         { session }
        //       );
        //     })
        //   );
        //   // updateBody.variants = product.variants;
        // }

        if (updateBody?.update_variants && updateBody.update_variants.length > 0) {
          await Promise.all(
            updateBody.update_variants.map(async variant => {
              // case delete
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
                }
                // case variant child
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

              // case update
              await ProductVariant.findOneAndUpdate(
                { _id: new mongoose.Types.ObjectId(variant.id) },
                { variant_name: variant.variant_name },
                { session }
              );
            })
          );
          // updateBody.variants = product.variants;
        }

        if (updateBody?.new_combine_variants && updateBody.new_combine_variants.length > 0) {
          const variantIds = await productVariantService.updateCombineVariantProducts(
            product, updateBody.new_combine_variants, session
          );
          if (!product.variants) throw new ApiError(StatusCodes.INTERNAL_SERVER_ERROR);
          // const variantsDB = product.variants.map(variant => variant.toString());
          // const newVariants = variantIds.map(variant => variant.toString());
          // updateBody.variants = [...new Set([...variantsDB, ...newVariants])];
          product.variants = [...product.variants, ...variantIds];
        }
      }
    }
  }

  if (updateBody?.attributes) {
    product.attributes = updateBody.attributes.map(attr => ({
      attribute: new mongoose.Types.ObjectId(attr.attribute_id),
      selected: attr.selected,
    }));
    delete updateBody.attributes;
  }

  if (updateBody?.category_id) {
    product.category = updateBody.category_id;
  }

  Object.assign(product, updateBody);
  await product.save({ session });
  return product;
};

const createProduct = async (body: BaseCreateProduct, session: ClientSession) => {
  const product = await Product.create([body], { session });
  return product[0];
};

// const getList: IProductModel['paginate'] = async (filter, options) => {
//   return Product.paginate(filter, options);
// };

const deleteProductById = async (productId: IProduct['id'], session: ClientSession) => {
  const product = await getProductById(productId);
  if (!product) throw new ApiError(StatusCodes.NOT_FOUND, 'Product not found');
  return product.remove({ session });
};

export const productService = {
  getDetailProductByShop,
  createProduct,
  getProductById,
  // getList,
  deleteProductById,
  updateProduct,
};
