import mongoose from 'mongoose';
import { z } from 'zod';
import { productAttributeSchema } from './prod-attribute.schema';
import {
  PRODUCT_STATES,
  PRODUCT_WHO_MADE,
  PRODUCT_CATEGORIES
} from '@/config/enums/product';

const REG_SLUG = /^[a-z0-9]+(?:(?:-|_)+[a-z0-9]+)*$/;

export const productImageSchema = z.object({
  id: z.union([z.instanceof(mongoose.Types.ObjectId), z.string()]).optional(),
  url: z.string(),
  rank: z.number().max(10).default(1),
});

export const productSchema = z.object({
  id: z.union(
    [
      z.instanceof(mongoose.Types.ObjectId),
      z.string(),
    ]
  ),
  shop_id: z.union(
    [
      z.instanceof(mongoose.Types.ObjectId),
      z.string(),
    ]
  ),
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
    .max(50000),
  quantity: z
    .number()
    .min(1)
    .max(999),
  slug: z
    .string()
    .regex(new RegExp(REG_SLUG), 'invalid slug')
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
  images: z.array(productImageSchema),
  rating_average: z
    .number()
    .min(0, 'Rating must be more than 0')
    .max(5, 'Rating must be equal or less than 5.0')
    .default(0)
    .optional(),
});
