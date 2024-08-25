import { z } from 'zod';
import { objectIdHttpSchema } from '@/schemas/utils/objectId.schema';
import {
  createProductBodySchema,
  updateProductBodySchema
} from '@/schemas/request/shop-product';
import { productSchema, shopSchema } from '@/schemas';
import { mixBaseQueryGetListSchema } from '@/schemas/utils/paginate.schema';
import { baseQueryGetListSchema } from '@/schemas/utils/common-query-params.schema';

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
    params: z.object({ shop_id: objectIdHttpSchema }).strict(),
    body: createProductBodySchema,
  }),
  getProducts: z.object({
    params: z.object({ shop_id: objectIdHttpSchema }).strict(),
    query: productSchema
      .pick({ title: true })
      .merge(baseQueryGetListSchema)
      .partial()
      .strict(),
  }),
  getDetailProduct: z.object({
    params: z.object({
      shop_id: objectIdHttpSchema,
      product_id: objectIdHttpSchema,
    }).strict(),
  }),
  deleteProduct: z.object({
    params: z.object({
      shop_id: objectIdHttpSchema,
      product_id: objectIdHttpSchema,
    }).strict(),
  }),
  updateProduct: z.object({
    params: z.object({
      shop_id: objectIdHttpSchema,
      product_id: objectIdHttpSchema,
    }).strict(),
    body: updateProductBodySchema,
  }),
};
