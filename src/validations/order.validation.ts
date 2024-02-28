import { z } from 'zod';
import {
  lineItemSchema,
  orderSchema,
  productInLineSchema
} from '@/schemas';

export const orderValidation = {
  getSummaryOrder: z.object({
    body: productInLineSchema
      .pick({ inventory: true, quantity: true })
      .merge(lineItemSchema.pick({ coupon_codes: true }))
      .strict()
    ,
  }),
  createOrderFromCart: z.object({
    body: orderSchema
      .pick({ address: true, payment_type: true })
      .merge(lineItemSchema.omit({ products: true }))
      .strict()
    ,
  }),
  createOrderForBuyNow: z.object({
    body: orderSchema
      .pick({ address: true, payment_type: true })
      .merge(productInLineSchema.pick({ inventory: true, quantity: true }))
      .merge(lineItemSchema.pick({ coupon_codes: true, note: true }))
      .strict()
    ,
  }),
};
