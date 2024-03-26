import { z } from 'zod';
import { productInventorySchema } from './product-inventory.schema';
import {
  PRODUCT_STATES,
  PRODUCT_WHO_MADE,
  PRODUCT_REGEX_SLUG,
  PRODUCT_REGEX_NOT_URL,
  PRODUCT_CONFIG,
  PRODUCT_VARIANT_TYPES
} from '@/config/enums/product';
import { objectIdSchema } from '@/schemas/sub/objectId.schema';

export const productImageSchema = z.object({
  id: objectIdSchema,
  relative_url: z
    .string()
    .startsWith('shop', 'must start with shop')
    .regex(PRODUCT_REGEX_NOT_URL, 'must not absolute url'),
  rank: z
    .number()
    .min(PRODUCT_CONFIG.MIN_IMAGES)
    .max(PRODUCT_CONFIG.MAX_IMAGES)
    .default(1),
});

export const productVariantOptSchema = z.object({
  id: objectIdSchema,
  variant: objectIdSchema,
  inventory: objectIdSchema,
});

export const productVariantSchema = z.object({
  id: objectIdSchema,
  product: objectIdSchema,
  inventory: objectIdSchema.optional(),
  variant_name: z
    .string()
    .min(1)
    .max(PRODUCT_CONFIG.MAX_CHAR_VARIANT_NAME),
  image_relative_url: z
    .string()
    .startsWith('shop', 'must start with shop')
    .regex(PRODUCT_REGEX_NOT_URL, 'must not absolute url')
    .optional()
  ,
  variant_options: z.array(productVariantOptSchema).optional(),
});

export const productAttributeSchema = z.object({
  attribute: objectIdSchema,
  selected: z.string(),
});

export const productSchema = z.object({
  id: objectIdSchema,
  shop: objectIdSchema,
  inventory: objectIdSchema,
  category: objectIdSchema,
  attributes: z.array(productAttributeSchema),
  title: z
    .string()
    .min(PRODUCT_CONFIG.MIN_CHAR_TITLE)
    .max(PRODUCT_CONFIG.MAX_CHAR_TITLE),
  description: z
    .string()
    .min(PRODUCT_CONFIG.MIN_CHAR_DESCRIPTION)
    .max(PRODUCT_CONFIG.MAX_CHAR_DESCRIPTION),
  slug: z
    .string()
    .regex(PRODUCT_REGEX_SLUG, 'invalid slug')
    .optional(),
  tags: z.array(
    z.string()
      .min(PRODUCT_CONFIG.MIN_CHAR_TAG)
      .max(PRODUCT_CONFIG.MAX_CHAR_TAG)
  )
    .max(PRODUCT_CONFIG.MAX_TAGS).optional(),
  state: z
    .nativeEnum(PRODUCT_STATES)
    .default(PRODUCT_STATES.ACTIVE),
  is_digital: z
    .boolean()
    .default(false),
  who_made: z.nativeEnum(PRODUCT_WHO_MADE),
  views: z
    .number()
    .optional(),
  non_taxable: z
    .boolean()
    .default(false),
  images: z
    .array(productImageSchema)
    .min(PRODUCT_CONFIG.MIN_IMAGES)
    .max(PRODUCT_CONFIG.MAX_IMAGES),
  rating_average: z
    .number()
    .min(0, 'Rating must be more than 0')
    .max(5, 'Rating must be equal or less than 5.0')
    .default(0)
    .optional(),
  variant_type: z
    .nativeEnum(PRODUCT_VARIANT_TYPES)
    .default(PRODUCT_VARIANT_TYPES.NONE),
  variant_group_name: z
    .string()
    .min(1)
    .max(PRODUCT_CONFIG.MAX_CHAR_VARIANT_GROUP_NAME)
    .optional(),
  variant_sub_group_name: z
    .string()
    .min(1)
    .max(PRODUCT_CONFIG.MAX_CHAR_VARIANT_GROUP_NAME)
    .optional()
  ,
  variants: z
    .array(productVariantOptSchema.shape.id)
    .default([])
    .optional()
  ,
});

export const productStateUserCanModify = z.union([
  z.literal(PRODUCT_STATES.ACTIVE),
  z.literal(PRODUCT_STATES.INACTIVE),
  z.literal(PRODUCT_STATES.DRAFT),
]).default(PRODUCT_STATES.ACTIVE);

export const createProductBodySchema = productSchema
  .omit({
    id: true,
    views: true,
    rating_average: true,
    inventory: true,
    variants: true,
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

export const variantOptionsUpdateSchema = productInventorySchema
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
