import { z } from 'zod';
import { PRODUCT_CONFIG } from '@/config/enums/product';
import { productSchema, productImageSchema } from '@/schema';
import { productStateUserCanModify } from '@/schema/product.schema';
import { mixBaseQueryOptionsSchema } from '@/schema/sub/queryOptions.schema';

export const productValidation = {
  createProduct: z.object({
    params: productSchema.pick({ shop: true }),
    body: productSchema
      .omit({
        id: true,
        shop: true,
        category: true,
        views: true,
        rating_average: true,
      })
      // override prop images
      .merge(
        z.object({
          images: z
            .array(productImageSchema
              .omit({ id: true })
              .strict()
            )
            .max(PRODUCT_CONFIG.MAX_IMAGES),
          state: productStateUserCanModify,
        })
      )
      .strict(),
  }),
  getProducts: z.object({
    params: productSchema.pick({ shop: true }),
    query: mixBaseQueryOptionsSchema(
      productSchema.pick({
        title: true,
        price: true,
        category: true,
      })
    ),
  }),
  getProduct: z.object({
    params: productSchema.pick({ shop: true, id: true }),
  }),
  deleteProduct: z.object({
    params: productSchema
      .pick({ shop: true, id: true })
      .strict(),
  }),
  updateProduct: z.object({
    params: productSchema.pick({ shop: true, id: true }),
    body: productSchema
      .omit({
        id: true,
        shop: true,
        category: true,
        views: true,
        rating_average: true,
      })
      // override prop images
      .merge(
        z.object({
          images: z
            .array(productImageSchema.partial().strict())
            .max(PRODUCT_CONFIG.MAX_IMAGES),
          state: productStateUserCanModify,
        })
      )
      .strict()
      .partial(),
  }),
};
