import { z } from 'zod';
import { PRODUCT_CONFIG } from '@/config/enums/product';
import {
  COUPON_APPLIES_TO,
  COUPON_TYPES,
  COUPON_MIN_ORDER_TYPES,
  COUPON_CONFIG
} from '@/config/enums/coupon';
import { objectIdSchema } from '@/schemas/sub/objectId.schema';

export const couponSchema = z.object({
  id: objectIdSchema,
  shop: objectIdSchema,
  code: z
    .string()
    .min(COUPON_CONFIG.MIN_CHAR_CODE)
    .max(COUPON_CONFIG.MAX_CHAR_CODE),
  title: z
    .string()
    .min(COUPON_CONFIG.MIN_CHAR_TITLE)
    .max(COUPON_CONFIG.MAX_CHAR_TITLE),
  type: z
    .nativeEnum(COUPON_TYPES)
    .optional(),
  amount_off: z
    .number()
    .min(1, 'must be large than 1')
    .max(PRODUCT_CONFIG.MAX_PRICE - 1)
    .optional(),
  percent_off: z
    .number()
    .min(1, 'must be large than 1')
    .max(99, 'must be less than 99')
    .optional(),
  applies_to: z
    .nativeEnum(COUPON_APPLIES_TO)
    .default(COUPON_APPLIES_TO.ALL),
  applies_product_ids: z
    .array(objectIdSchema)
    .min(1)
    .default([])
    .optional(),
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
    .max(PRODUCT_CONFIG.MAX_STOCK,
      `the maximum number cannot exceed ${PRODUCT_CONFIG.MAX_STOCK}`),
  min_order_type: z
    .nativeEnum(COUPON_MIN_ORDER_TYPES)
    .default(COUPON_MIN_ORDER_TYPES.NONE),
  min_order_value: z
    .number()
    // .max(PRODUCT_CONFIG.MAX_PRICE)
    .default(0)
    .optional(),
  min_products: z
    .number()
    .min(1)
    .optional(),
  start_date: z
    .coerce
    .date()
    .refine((val) => new Date(val) >= new Date(), 'must be greater than current date'),
  end_date: z
    .coerce
    .date()
    .refine((val) => new Date(val) >= new Date(), 'must be large than current date'),
  uses_count: z
    .number()
    .default(0),
  is_active: z
    .boolean()
    .default(false),
  is_auto_sale: z
    .boolean()
    .default(false),
});
