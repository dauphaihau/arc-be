import { z } from 'zod';
import { PRODUCT_CONFIG } from '@/config/enums/product';
import {
  productInventorySchema,
  productSchema,
  productImageSchema,
  productStateUserCanModify,
  productVariantSchema,
  productVariantOptSchema
} from '@/schemas';
import { productShippingSchema } from '@/schemas/product-shipping.schema';

export const createProductBodySchema = productSchema
  .omit({
    id: true,
    views: true,
    rating_average: true,
    inventory: true,
    variants: true,
    shipping: true,
  })
  .merge(
    z.object({
      images: z
        .array(productImageSchema
          .omit({ id: true })
          .strict()
        )
        .max(PRODUCT_CONFIG.MAX_IMAGES),
      state: productStateUserCanModify,
      shipping:
      productShippingSchema.pick({
        country: true,
        zip: true,
        process_time: true,
        standard_shipping: true,
      }).optional(),
      new_variants: z.array(
        productVariantSchema
          .pick({ variant_name: true })
          .merge(z.object({
            variant_options: z.array(
              productInventorySchema
                .pick({ sku: true, price: true, stock: true })
                .merge(productVariantOptSchema.partial())
                .merge(productVariantSchema.pick({ variant_name: true }))
            ),
          }))
          .merge(productInventorySchema.pick({ sku: true, price: true, stock: true })).partial()
      ).optional(),
    })
  )
  .merge(
    productInventorySchema.pick({
      price: true,
      stock: true,
      sku: true,
    }).partial()
  )
  .strict();

const variantOptionsUpdateSchema = productInventorySchema
  .pick({ price: true, sku: true, stock: true }).merge(
    productVariantSchema.pick({ variant_name: true }).merge(
      productVariantOptSchema.pick({ variant: true })
    )
  );

export const updateProductSchema = productSchema
  .omit({
    shop: true,
    rating_average: true,
    views: true,
  }).merge(
    z.object({
      state: productStateUserCanModify,
      images: z
        .array(productImageSchema.partial())
        .min(PRODUCT_CONFIG.MIN_IMAGES)
        .max(PRODUCT_CONFIG.MAX_IMAGES),
      update_variants: z
        .array(
          productVariantSchema
            .pick({ id: true, variant_name: true })
            .partial({ variant_name: true })
            .strict()
        )
        .optional(),
      variant_inventories: z
        .array(
          productInventorySchema
            .pick({
              id: true, price: true, sku: true, stock: true,
            })
            .strict()
        )
        .optional(),
      new_single_variants: z
        .array(
          productInventorySchema.pick({ price: true, sku: true, stock: true }).merge(
            productVariantSchema.pick({ variant_name: true })
          )
        ),
      new_combine_variants: z.array(
        productVariantSchema
          .pick({ variant_name: true })
          .merge(
            z.object({
              variant_options: z.array(
                variantOptionsUpdateSchema.partial({ variant: true })
                // .refine((value) => !value?.variant && !value?.variant_name, 'required at least variant or variant_name field')
              ),
            })
          ))
        .optional(),
    })
  ).merge(
    productInventorySchema.pick({ price: true, sku: true, stock: true })
  ).partial();
