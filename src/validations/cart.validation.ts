import { z } from 'zod';
import { productCartSchema } from '@/schemas';

export const cartValidation = {
  addProduct: z.object({
    body: productCartSchema.strict(),
  }),
  updateProduct: z.object({
    body: z
      .object({
        inventory: productCartSchema.shape.inventory,
        quantity: productCartSchema.shape.quantity.optional(),
        is_select_order: productCartSchema.shape.is_select_order.optional(),
      })
      .strict()
      .refine((val) => {
        return !(Object.keys(val).length === 1);
      }, 'require at least is_select_order or quantity field')
    ,
  }),
  deleteProduct: z.object({
    body: productCartSchema
      .pick({ inventory: true })
      .strict(),
  }),
};
