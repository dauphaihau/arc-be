import { z } from 'zod';
import { productSchema, marketGetProductsSortBySchema } from '@/schemas';
import { mixBaseQueryGetListSchema } from '@/schemas/utils/query-options.schema';

export const productValidation = {
  getProducts: z.object({
    query: mixBaseQueryGetListSchema(
      productSchema.pick({ category: true, shop: true })
        .merge(
          z.object({
            title: z.string(),
            s: z.string(),
            is_digital: z.union([z.literal('true'), z.literal('false')]),
            order: marketGetProductsSortBySchema,
          })
        )
    ),
  }),
  getDetailProduct: z.object({
    params: z.object({
      product_id: productSchema.shape.id,
    }).strict(),
  }),
};
