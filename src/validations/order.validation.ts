import { z } from 'zod';
import {
  lineItemSchema,
  orderSchema
} from '@/schema';

export const orderValidation = {
  review: z.object({
    body: z.object({
      cart_items: z.array(lineItemSchema.strict()),
    }).strict(),
  }),
  createOrder: z.object({
    body: z.object({
      address_id: orderSchema.shape.address_id,
      payment_type: orderSchema.shape.payment_type,
      cart_items: z.array(lineItemSchema.strict()),
    }).strict(),
  }),
};
