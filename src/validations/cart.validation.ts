import { z } from 'zod';
import { productCartSchema, lineItemSchema } from '@/schemas';

export const cartValidation = {
  addProduct: z.object({
    body: productCartSchema.strict(),
  }),
  updateProduct: z.object({
    body: z
      .object({
        inventory: productCartSchema.shape.inventory,
        variant: productCartSchema.shape.variant.optional(),
        quantity: productCartSchema.shape.quantity.optional(),
        is_select_order: productCartSchema.shape.is_select_order.optional(),
        additionInfoItems: z.array(lineItemSchema.pick({
          shop: true,
          coupon_codes: true,
          note: true,
        })).optional(),
      })
      .strict()
      .refine((val) => {
        return !(Object.keys(val).length === 1);
      }, 'require at least is_select_order or quantity field')
    ,
  }),
  deleteProduct: z.object({
    query: productCartSchema
      .pick({ inventory: true })
      .strict(),
  }),
};
