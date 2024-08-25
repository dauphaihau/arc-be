import { z } from 'zod';
import { PRODUCT_CONFIG } from '@/config/enums/product';
import {
  productSchema,
  productImageSchema,
  productStateUserCanModify
} from '@/schemas';

export const baseCreateProductSchema = productSchema
  .pick({
    shop: true,
    category: true,
    variant_type: true,
    title: true,
    description: true,
    slug: true,
    tags: true,
    who_made: true,
    non_taxable: true,
    is_digital: true,
    // images: true,
    attributes: true,
  }).merge(z.object({
    images: z
      .array(productImageSchema
        .omit({ id: true })
        .strict()
      )
      .max(PRODUCT_CONFIG.MAX_IMAGES),
    state: productStateUserCanModify,
    variant_group_name: productSchema.shape.variant_group_name.optional(),
    variant_sub_group_name: productSchema.shape.variant_sub_group_name.optional(),
  }));

export const baseUpdateProductSchema = productSchema
  .pick({
    // id: true,
    variant_type: true,
    title: true,
    description: true,
    slug: true,
    tags: true,
    who_made: true,
    non_taxable: true,
    is_digital: true,
    images: true,
    attributes: true,
  }).merge(z.object({
    images: z
      .array(productImageSchema
        .omit({ id: true })
        .strict()
      )
      .max(PRODUCT_CONFIG.MAX_IMAGES),
    state: productStateUserCanModify,
    variant_group_name: productSchema.shape.variant_group_name.optional(),
    variant_sub_group_name: productSchema.shape.variant_sub_group_name.optional(),
  }))
  .partial();
