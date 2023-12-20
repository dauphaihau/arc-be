import { z } from 'zod';
import { productCartSchema } from '@/schema';

export const cartValidation = {
  addOrUpdateProduct: z.object({
    body: productCartSchema.strict(),
  }),
  updateProduct: z.object({
    body: z
      .object({
        product_id: productCartSchema.shape.product_id,
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
      .pick({ product_id: true })
      .strict(),
  }),
};
