import { z } from 'zod';
import {
  createProductBodySchema,
  updateProductSchema
} from '@/schemas/request/shop-product';
import {
  shopSchema,
  productSchema
} from '@/schemas';
import { mixBaseQueryGetListSchema } from '@/schemas/utils/query-options.schema';

export const shopValidation = {
  getShops: z.object({
    query: mixBaseQueryGetListSchema(
      shopSchema
        .pick({ shop_name: true })
        .strict()
    ),
  }),
  createShop: z.object({
    body: shopSchema
      .pick({ shop_name: true })
      .strict(),
  }),

  // Product
  createProduct: z.object({
    params: z.object({ shop_id: productSchema.shape.shop }).strict(),
    body: createProductBodySchema.omit({ shop: true }),
  }),

  getProducts: z.object({
    params: z.object({ shop_id: productSchema.shape.shop }).strict(),
    query: mixBaseQueryGetListSchema(
      productSchema.pick({
        title: true,
        price: true,
        category: true,
      })
    ),
  }),
  getDetailProduct: z.object({
    params: z.object({
      shop_id: productSchema.shape.shop,
      product_id: productSchema.shape.id,
    }).strict(),
  }),
  deleteProduct: z.object({
    params: z.object({
      shop_id: productSchema.shape.shop,
      product_id: productSchema.shape.id,
    }).strict(),
  }),
  updateProduct: z.object({
    params: z.object({
      shop_id: productSchema.shape.shop,
      product_id: productSchema.shape.id,
    }).strict(),
    body: updateProductSchema,
  }),
};
