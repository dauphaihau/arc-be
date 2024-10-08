import { z } from 'zod';
import {
  PRODUCT_STATES,
  PRODUCT_WHO_MADE,
  PRODUCT_REGEX_SLUG,
  PRODUCT_REGEX_NOT_URL,
  PRODUCT_CONFIG,
  PRODUCT_VARIANT_TYPES
} from '@/config/enums/product';
import { objectIdSchema } from '@/schemas/utils/objectId.schema';

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
  inventory: objectIdSchema.or(z.literal(null)),
  shipping: objectIdSchema,
  category: objectIdSchema,
  attributes: z.array(productAttributeSchema).default([]),
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
  variant_type: z.nativeEnum(PRODUCT_VARIANT_TYPES),
  variant_group_name: z
    .string()
    .min(1)
    .max(PRODUCT_CONFIG.MAX_CHAR_VARIANT_GROUP_NAME),
  variant_sub_group_name: z
    .string()
    .min(1)
    .max(PRODUCT_CONFIG.MAX_CHAR_VARIANT_GROUP_NAME)
  ,
  variants: z
    .array(productVariantOptSchema.shape.id)
    .default([])
  ,
});

export const productStateUserCanModify = z.union([
  z.literal(PRODUCT_STATES.ACTIVE),
  z.literal(PRODUCT_STATES.INACTIVE),
  z.literal(PRODUCT_STATES.DRAFT),
]).default(PRODUCT_STATES.ACTIVE);
