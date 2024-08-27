import { z } from 'zod';
import { booleanStringSchema } from '@/schemas/utils/boolean-string.schema';
import { baseQueryGetListSchema } from '@/schemas/utils/common-query-params.schema';
import { objectIdHttpSchema } from '@/schemas/utils/objectId.schema';
import { productSchema } from '@/schemas';

export const productValidation = {
  getProducts: z.object({
    query: z.object({
      category_id: objectIdHttpSchema,
      title: z.string(),
      who_made: productSchema.shape.who_made,
      s: z.string(),
      is_digital: booleanStringSchema,
      order: z.union([
        z.literal('newest'),
        z.literal('price_desc'),
        z.literal('price_asc'),
      ]),
    })
      .merge(baseQueryGetListSchema.extend({
        select: z.string().optional(),
      }))
      .strict()
      .partial(),
  }),
  getDetailProduct: z.object({
    params: z.object({
      product_id: productSchema.shape.id,
    }).strict(),
  }),
};
