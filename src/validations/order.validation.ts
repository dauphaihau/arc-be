import { z } from 'zod';
import { MARKETPLACE_CURRENCIES } from '@/config/enums/marketplace';
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
      .merge(
        z.object({
          additionInfoItems: z.array(lineItemSchema.pick({
            shop: true,
            coupon_codes: true,
            note: true,
          })).optional(),
          currency: z.nativeEnum(MARKETPLACE_CURRENCIES).optional(),
        })
      )
      .strict()
    ,
  }),
  createOrderForBuyNow: z.object({
    body: orderSchema
      .pick({ address: true, payment_type: true })
      .merge(productInLineSchema.pick({ inventory: true, quantity: true }))
      .merge(lineItemSchema.pick({ coupon_codes: true, note: true }))
      .merge(
        z.object({
          currency: z.nativeEnum(MARKETPLACE_CURRENCIES).optional(),
        })
      )
      .strict()
    ,
  }),
};
