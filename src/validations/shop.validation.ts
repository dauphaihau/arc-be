import { z } from 'zod';
import { mixBaseQueryOptionsSchema } from '@/schemas/sub/queryOptions.schema';
import {
  shopSchema,
  productSchema,
  productImageSchema
} from '@/schemas';
import { productStateUserCanModify } from '@/schemas/product.schema';
import { PRODUCT_CONFIG } from '@/config/enums/product';

export const shopValidation = {
  getShops: z.object({
    query: mixBaseQueryOptionsSchema(
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
  createProductByShop: z.object({
    params: productSchema.pick({ shop: true }),
    body: productSchema
      .omit({
        id: true,
        shop: true,
        views: true,
        rating_average: true,
        inventory: true,
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
          variants: z.array(z.any()),
        })
      )
    //     .merge(
    //       productInventorySchema.pick({
    //         price: true,
    //         stock: true,
    //         sku: true,
    //       })
    // )
      .strict(),
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
