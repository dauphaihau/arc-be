import { z } from 'zod';
import { productCartSchema } from '@/schema';

export const cartValidation = {
  addOrUpdateToCart: z.object({
    body: productCartSchema.strict(),
  }),
  deleteProductInCart: z.object({
    body: productCartSchema
      .pick({ product_id: true })
      .strict(),
  }),
};
