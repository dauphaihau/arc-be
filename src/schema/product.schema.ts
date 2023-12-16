import { z } from 'zod';
import { productAttributeSchema } from './sub/prod-attribute.schema';
import {
  PRODUCT_STATES,
  PRODUCT_WHO_MADE,
  PRODUCT_CATEGORIES, MAX_PRODUCT_IMAGES, MAX_PRODUCT_PRICE
} from '@/config/enums/product';
import { objectIdSchema } from '@/schema/sub/objectId.schema';

export const REG_SLUG = /^[a-z0-9]+(?:(?:-|_)+[a-z0-9]+)*$/;
export const REG_NOT_URL = /^(?!http.*$).*/;

export const productImageSchema = z.object({
  id: objectIdSchema,
  relative_url: z
    .string()
    .startsWith('shop', 'must start with shop')
    .regex(REG_NOT_URL, 'must not absolute url'),
  rank: z
    .number()
    .min(1)
    .max(10)
    .default(1),
});

export const productSchema = z.object({
  id: objectIdSchema,
  shop_id: objectIdSchema,
  title: z
    .string()
    .min(2)
    .max(110),
  description: z
    .string()
    .min(2)
    .max(100000),
  price: z
    .number()
    .min(1)
    .max(MAX_PRODUCT_PRICE),
  quantity: z
    .number()
    .min(1)
    .max(999),
  slug: z
    .string()
    .regex(REG_SLUG, 'invalid slug')
    .optional(),
  tags: z.array(
    z.string()
      .min(2)
      .max(21)
  )
    .max(11).optional(),
  state: z
    .nativeEnum(PRODUCT_STATES)
    .default(PRODUCT_STATES.DRAFT),
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
  category: z.nativeEnum(PRODUCT_CATEGORIES),
  attributes: productAttributeSchema,
  images: z
    .array(productImageSchema)
    .min(1)
    .max(MAX_PRODUCT_IMAGES),
  rating_average: z
    .number()
    .min(0, 'Rating must be more than 0')
    .max(5, 'Rating must be equal or less than 5.0')
    .default(0)
    .optional(),
});
