import { z } from 'zod';
import { productSchema } from '@/schemas';
import { mixBaseQueryOptionsSchema } from '@/schemas/sub/queryOptions.schema';

export const productValidation = {
  getProducts: z.object({
    query: mixBaseQueryOptionsSchema(
      productSchema.merge(z.object({ title: z.string() }))
    ),
  }),
  getProductsByCategory: z.object({
    query: mixBaseQueryOptionsSchema(
      productSchema.pick({ category: true, shop: true })
    ),
  }),
  getDetailProduct: z.object({
    params: productSchema.pick({ id: true }),
  }),
};
