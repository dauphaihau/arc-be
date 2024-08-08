import { z } from 'zod';
import {
  addProductCartBodySchema, updateCartBodySchema
} from '@/schemas/request/cart';
import { productCartSchema } from '@/schemas';

export const cartValidation = {
  addProduct: z.object({
    body: addProductCartBodySchema.strict(),
  }),
  updateProduct: z.object({
    body: updateCartBodySchema
      .strict()
      .superRefine((val, ctx) => {
        if (Object.hasOwn(val, 'inventory_id')) {
          if (
            !Object.hasOwn(val, 'is_select_order') &&
            !Object.hasOwn(val, 'quantity')
          ) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              message: 'require at least is_select_order or quantity field',
            });
          }
        }
        if (Object.hasOwn(val, 'cart_id')) {
          if (
            !Object.hasOwn(val, 'addition_info_temp_cart') &&
            !Object.hasOwn(val, 'quantity')
          ) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              message: 'require at least quantity or addition_info_temp_cart field',
            });
          }
        }
      }),
  }),
  deleteProduct: z.object({
    query: z.object({
      inventory_id: productCartSchema.shape.inventory,
    }),
  }),
};
