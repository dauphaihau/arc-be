import { z } from 'zod';
import { PRODUCT_CONFIG } from '@/config/enums/product';
import {
  COUPON_APPLIES_TO,
  COUPON_TYPES,
  COUPON_MIN_ORDER_TYPES,
  COUPON_CONFIG
} from '@/config/enums/coupon';
import { objectIdSchema } from '@/schemas/utils/objectId.schema';

export const couponReservationSchema = z.object({
  order: objectIdSchema,
  // quantity: z.number(),
  created_at: z.date(),
});

export const couponSchema = z.object({
  id: objectIdSchema,
  shop: objectIdSchema,
  code: z
    .string()
    .min(COUPON_CONFIG.MIN_CHAR_CODE)
    .max(COUPON_CONFIG.MAX_CHAR_CODE),
  type: z.nativeEnum(COUPON_TYPES),
  amount_off: z
    .number()
    .min(1, 'must be large than 1')
    .max(PRODUCT_CONFIG.MAX_PRICE - 1),
  percent_off: z
    .number()
    .min(1, 'must be large than 1')
    .max(COUPON_CONFIG.MAX_PERCENTAGE_OFF, `must be less than ${COUPON_CONFIG.MAX_PERCENTAGE_OFF}`)
    .default(0),
  applies_to: z
    .nativeEnum(COUPON_APPLIES_TO)
    .default(COUPON_APPLIES_TO.ALL),
  applies_product_ids: z
    .array(objectIdSchema)
    .min(1)
    .default([]),
  // .optional(),
  users_used: z
    .array(objectIdSchema)
    .optional(),
  max_uses_per_user: z
    .number()
    .min(COUPON_CONFIG.MIN_USES_PER_USER)
    .max(COUPON_CONFIG.MAX_USES_PER_USER,
      `the maximum number cannot exceed ${COUPON_CONFIG.MAX_USES_PER_USER}`),
  max_uses: z
    .number()
    .min(1)
    .max(COUPON_CONFIG.MAX_USES,
      `the maximum number cannot exceed ${COUPON_CONFIG.MAX_USES}`),
  min_order_type: z
    .nativeEnum(COUPON_MIN_ORDER_TYPES)
    .default(COUPON_MIN_ORDER_TYPES.NONE),
  min_order_value: z
    .number()
    .default(0),
  min_products: z
    .number()
    .min(1),
  start_date: z
    .coerce
    .date(),
  end_date: z
    .coerce
    .date(),
  uses_count: z
    .number()
    .default(0)
    .optional(),
  is_active: z
    .boolean()
    .default(false)
    .optional(),
  is_auto_sale: z
    .boolean()
    .default(false),
  reservations: z.array(couponReservationSchema).default([]).optional(),
  created_at: z.date(),
  updated_at: z.date(),
});
