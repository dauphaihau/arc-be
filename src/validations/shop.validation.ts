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
  createShop: z.object({
    body: shopSchema
      .pick({ shop_name: true })
      .strict(),
  }),

  // Product
  createProductByShop: z.object({
    params: productSchema.pick({ shop: true }),
    body: createProductBodySchema.omit({ shop: true }),
    // .superRefine((val, ctx) => {
    //   if (val.variant_type === PRODUCT_VARIANT_TYPES.NONE && !val?.price) {
    //     ctx.addIssue({
    //       code: z.ZodIssueCode.custom,
    //       message: 'require price',
    //     });
    //   }
    //   if (val.variant_type === PRODUCT_VARIANT_TYPES.COMBINE && !val?.sub_variant_names) {
    //     ctx.addIssue({
    //       code: z.ZodIssueCode.custom,
    //       message: 'require sub_variant_names',
    //     });
    //   }
    // }),
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
