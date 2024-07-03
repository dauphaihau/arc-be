import { z } from 'zod';
import {
  shopSchema,
  productSchema,
  createProductBodySchema, updateProductSchema
} from '@/schemas';
import { mixBaseQueryOptionsSchema } from '@/schemas/sub/queryOptions.schema';

export const shopValidation = {
  getShops: z.object({
    query: mixBaseQueryOptionsSchema(
      shopSchema
        .pick({ shop_name: true })
        .strict()
    ),
  }),
  create: z.object({
    body: shopSchema
      .pick({ shop_name: true })
      .strict(),
  }),

  // Product
  createProductByShop: z.object({
    params: productSchema.pick({ shop: true }),
    body: createProductBodySchema.omit({ shop: true }),
  }),

  getProductsByShop: z.object({
    params: productSchema.pick({ shop: true }),
    query: mixBaseQueryOptionsSchema(
      productSchema.pick({
        title: true,
        price: true,
        category: true,
      })
    ),
  }),
  getDetailProductByShop: z.object({
    params: productSchema.pick({ shop: true, id: true }),
  }),
  deleteProductByShop: z.object({
    params: productSchema
      .pick({ shop: true, id: true })
      .strict(),
  }),
  updateProductByShop: z.object({
    params: productSchema.pick({ shop: true, id: true }),
    body: updateProductSchema,
  }),
};
