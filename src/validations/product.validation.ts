import { z } from 'zod';
import { productSchema } from '@/schema';

export const productValidation = {
  createProduct: z.object({
    params: productSchema.pick({ shop_id: true }),
    body: productSchema
      .omit({
        id: true,
        shop_id: true,
        category: true,
        views: true,
        rating_average: true,
      })
      .strict(),
  }),
  getProducts: z.object({
    params: productSchema.pick({ shop_id: true }),
    query: z.strictObject({
      limit: z.string(),
      page: z.string(),
      sortBy: z.string(),
      name: z.string(),
      price: z.string(),
      category: z.string(),
    }).partial(),
  }),
  deleteProduct: z.object({
    params: productSchema
      .pick({ shop_id: true, id: true })
      .strict(),
  }),
  updateProduct: z.object({
    params: productSchema.pick({ shop_id: true, id: true }),
    body: productSchema
      .omit({
        id: true,
        shop_id: true,
        category: true,
        views: true,
        rating_average: true,
      })
      .strict()
      .partial(),
  }),
};
