import { z } from 'zod';
import {
  lineItemSchema,
  orderSchema, shopCodesSchema
} from '@/schema';

export const orderValidation = {
  reviewOrder: z.object({
    body: z.object({
      cart_items: z.array(lineItemSchema.strict()),
    }).strict(),
  }),
  createOrder: z.object({
    body: z.object({
      address: orderSchema.shape.address,
      payment_type: orderSchema.shape.payment_type,
      shops_codes: z.array(shopCodesSchema),
    }).strict(),
  }),
};
