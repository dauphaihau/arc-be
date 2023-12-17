import { z } from 'zod';
import { mixBaseQueryListSchema } from '@/schema/sub/queryList.schema';
import { productSchema, productImageSchema } from '@/schema';
import { PRODUCT_MAX_IMAGES } from '@/config/enums/product';

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
      // override prop images
      .merge(
        z.object({
          images: z
            .array(productImageSchema
              .omit({ id: true })
              .strict()
            )
            .max(PRODUCT_MAX_IMAGES),
        })
      )
      .strict(),
  }),
  getProducts: z.object({
    params: productSchema.pick({ shop_id: true }),
    query: mixBaseQueryListSchema(
      productSchema.pick({
        title: true,
        price: true,
        category: true,
      })
    ),
  }),
  getProduct: z.object({
    params: productSchema.pick({ shop_id: true, id: true }),
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
      // override prop images
      .merge(
        z.object({
          images: z
            .array(productImageSchema.partial().strict())
            .max(PRODUCT_MAX_IMAGES),
        })
      )
      .strict()
      .partial(),
  }),
};
