import { z } from 'zod';
import { PRODUCT_MAX_PRICE } from '@/config/enums/product';
import {
  COUPON_APPLIES_TO,
  COUPON_TYPES,
  COUPON_MIN_ORDER_TYPES
} from '@/config/enums/coupon';
import { objectIdSchema } from '@/schema/sub/objectId.schema';

export const couponSchema = z.object({
  id: objectIdSchema,
  shop_id: objectIdSchema,
  code: z
    .string()
    .min(6)
    .max(12),
  title: z
    .string()
    .min(2)
    .max(50),
  type: z
    .nativeEnum(COUPON_TYPES)
    .optional(),
  amount_off: z
    .number()
    .min(1, 'must be large than 1')
    .max(100000000)
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
    .min(1)
    .max(5, 'the maximum number cannot exceed 5'),
  max_uses: z
    .number()
    .min(1)
    .max(100000, 'the maximum number cannot exceed 100000'),
  min_order_type: z
    .nativeEnum(COUPON_MIN_ORDER_TYPES)
    .default(COUPON_MIN_ORDER_TYPES.ORDER_TOTAL),
  min_order_value: z
    .number()
    .max(PRODUCT_MAX_PRICE)
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
});
