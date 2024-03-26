import { z } from 'zod';
import { COUPON_CONFIG } from '@/config/enums/coupon';
import { couponSchema } from '@/schemas/coupon.schema';
import { CART_CONFIG } from '@/config/enums/cart';
import { PRODUCT_CONFIG } from '@/config/enums/product';
import { objectIdSchema } from '@/schemas/sub/objectId.schema';

export const productCartSchema = z.object({
  id: objectIdSchema,
  inventory: objectIdSchema,
  variant: objectIdSchema.optional(),
  quantity: z.number().max(PRODUCT_CONFIG.MAX_STOCK),
  is_select_order: z
    .boolean()
    .default(true)
    .optional(),
});

export const itemCartSchema = z.object({
  shop: objectIdSchema,
  products: z.array(productCartSchema),
  coupon_codes: z
    .array(couponSchema.shape.code)
    .max(COUPON_CONFIG.MAX_USE_PER_ORDER)
    .optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const cartSchema = z.object({
  user: objectIdSchema,
  items: z
    .array(itemCartSchema)
    .max(CART_CONFIG.MAX_ITEMS),
});
