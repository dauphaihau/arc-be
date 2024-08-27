// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import { StatusCodes } from 'http-status-codes';
import { ClientSession } from 'mongoose';
import {
  IProductVariant,
  IProductDoc,
  IProductVariantOpt,
  IProduct
} from '@/interfaces/models/product';
import {
  CombineVariant,
  CreateProductVariantBody,
  SingleVariant
} from '@/interfaces/request/product';
import { ProductVariant } from '@/models/product-variant.model';
import { productInventoryService } from '@/services/product-inventory.service';
import { ApiError } from '@/utils';
import { RequestUpdateProduct } from '@/interfaces/request/shop-product';

const generateSingleVariantProducts = async (
  product: IProductDoc,
  variantOptions: SingleVariant['variant_options'],
  session: ClientSession
) => {
  const productVariantIds: IProductDoc['variants'] = [];
  if (!variantOptions) throw new ApiError(StatusCodes.BAD_REQUEST);

  await Promise.all(
    variantOptions.map(async (variant) => {
      if (!variant.price || !variant.variant_name) throw new ApiError(StatusCodes.BAD_REQUEST);
      const inventoryCreated = await productInventoryService.insertInventory({
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
  product: IProductDoc,
  variants: CombineVariant['variant_options'],
  session: ClientSession
) => {
  const productVariantIds: IProductDoc['variants'] = [];
  if (!variants || !variants[0]?.variant_options) throw new ApiError(StatusCodes.BAD_REQUEST);

  const variantsMap = new Map<IProductVariant['variant_name'], IProductVariant['id']>();

  // init sub variants
  await Promise.all(
    variants[0].variant_options.map(async (subVariant) => {
      // if (subVariant.variant) {
      //   variantsMap.set(subVariant.variant_name, subVariant.variant);
      // }
      // else {
      //   const variantCreated = await createProductVariant(
      //     {
      //       product: product.id,
      //       variant_name: subVariant.variant_name,
      //     },
      //     session
      //   );
      //   variantsMap.set(subVariant.variant_name, variantCreated._id);
      // }

      const variantCreated = await createProductVariant({
        product: product.id,
        variant_name: subVariant.variant_name,
      }, session);
      variantsMap.set(subVariant.variant_name, variantCreated._id);
    })
  );

  // init inventories variants
  await Promise.all(
    variants.map(async (variant) => {

      if (!variant.variant_name || !variant.variant_options) throw new ApiError(StatusCodes.BAD_REQUEST);

      const variantOptions: Pick<IProductVariantOpt, 'inventory' | 'variant'>[] = [];

      await Promise.all(
        variant.variant_options.map(async (subVariant) => {
          const inventoryCreated = await productInventoryService.insertInventory(
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

          const variantId = variantsMap.get(subVariant.variant_name);
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
  product: IProductDoc,
  // variants: CreateProductBody['new_variants'],
  variants: RequestUpdateProduct['body']['new_combine_variants'],
  session: ClientSession
) => {
  const productVariantIds: IProductVariant['id'][] = [];
  if (!variants || !variants[0]?.variant_options) throw new ApiError(StatusCodes.BAD_REQUEST);

  const variantsMap = new Map<IProductVariant['variant_name'], IProductVariant['id']>();

  // init sub variants
  await Promise.all(
    variants[0].variant_options.map(async (subVariant) => {
      if (!subVariant.variant_id) {
        const variantCreated = await createProductVariant(
          {
            product: product.id,
            variant_name: subVariant.variant_name,
          },
          session
        );
        variantsMap.set(subVariant.variant_name, variantCreated._id);
      }
    })
  );

  // init inventories variants
  await Promise.all(
    variants.map(async (variant) => {
      // if (!variant.variant_name || !variant.variant_options) throw new ApiError(StatusCodes.BAD_REQUEST);
      const variantOptions: Pick<IProductVariantOpt, 'inventory' | 'variant'>[] = [];

      await Promise.all(
        variant.variant_options.map(async (subVariant) => {
          const inventoryCreated = await productInventoryService.insertInventory(
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

          const variantId = subVariant.variant_id ?
            subVariant.variant_id :
            variantsMap.get(subVariant.variant_name);

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

const createProductVariant = async (
  body: CreateProductVariantBody,
  session: ClientSession
) => {
  const productVariant = await ProductVariant.create([body], { session });
  return productVariant[0];
};

export const productVariantService = {
  generateSingleVariantProducts,
  generateCombineVariantProducts,
  updateCombineVariantProducts,
  // generateProductVariantNone,
};
