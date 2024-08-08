import { z } from 'zod';
import { additionInfoShopCartSchema } from '@/schemas/request/cart';
import { basePaymentSchema } from '@/schemas/payment.schema';
import { MARKETPLACE_CURRENCIES } from '@/config/enums/marketplace';
import {
  orderSchema,
  couponSchema, cartSchema
} from '@/schemas';

export const createOrderFromCartBodySchema =
  z.object({
    payment_type: basePaymentSchema.shape.type,
    user_address_id: orderSchema.shape.user_address,
    currency: z.nativeEnum(MARKETPLACE_CURRENCIES).optional(),
    addition_info_shop_carts: z.array(
      additionInfoShopCartSchema.strict()
    ).min(1).optional(),
  });

export const createOrderForBuyNowBodySchema =
  z.object({
    cart_id: cartSchema.shape.id,
    payment_type: basePaymentSchema.shape.type,
    user_address_id: orderSchema.shape.user_address,
    currency: z.nativeEnum(MARKETPLACE_CURRENCIES).optional(),
    note: orderSchema.shape.note.optional(),
    promo_codes: z.array(couponSchema.shape.code).min(1).optional(),
  });
