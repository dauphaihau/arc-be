import { z } from 'zod';
import { booleanStringSchema } from '@/schemas/utils/boolean-string.schema';
import { objectIdHttpSchema } from '@/schemas/utils/objectId.schema';
import { additionInfoShopCartSchema } from '@/schemas/request/cart';
import { productCartSchema } from '@/schemas';

export const cartValidation = {
  getCart: z.object({
    query: z.object({
      cart_id: objectIdHttpSchema.optional(),
    }).strict(),
  }),
  addProduct: z.object({
    body: z.object({
      inventory_id: objectIdHttpSchema,
      quantity: productCartSchema.shape.quantity.min(1),
      is_temp: booleanStringSchema.optional(),
    }).strict(),
  }),
  updateCart: z.object({
    body:
      z.object({
        inventory_id: objectIdHttpSchema,
        is_select_order: booleanStringSchema,
        cart_id: objectIdHttpSchema,
        quantity: productCartSchema.shape.quantity.min(1),
        addition_info_temp_cart: additionInfoShopCartSchema.pick({
          promo_codes: true,
          note: true,
        }).strict(),
        addition_info_shop_carts: z.array(
          additionInfoShopCartSchema.strict()
        ).min(1),
      })
        .partial()
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
      inventory_id: objectIdHttpSchema,
    }),
  }),
};
