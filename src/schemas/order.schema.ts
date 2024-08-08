import { z } from 'zod';
import { couponSchema } from '@/schemas/coupon.schema';
import { productInventorySchema } from '@/schemas/product-inventory.schema';
import { productSchema } from '@/schemas/product.schema';
import {
  ORDER_STATUSES,
  ORDER_CONFIG, ORDER_SHIPPING_STATUSES
} from '@/config/enums/order';
import { objectIdSchema } from '@/schemas/utils/objectId.schema';

export const orderProductSchema = z.object({
  product: productSchema.shape.id,
  inventory: productInventorySchema.shape.id,
  percent_coupon: couponSchema.shape.id,
  freeship_coupon: couponSchema.shape.id,
  price: productInventorySchema.shape.price,
  sale_price: productInventorySchema.shape.price,
  quantity: z.number(),
  title: productSchema.shape.title,
  image_url: z.string(),
});

export const orderSchema = z.object({
  id: objectIdSchema,
  parent: objectIdSchema,
  shop: objectIdSchema,
  user: objectIdSchema,
  user_address: objectIdSchema,
  payment: objectIdSchema,
  tracking_number: z.string(),
  stripe_charge_id: z.string(),
  status: z.nativeEnum(ORDER_STATUSES),
  shipping_status: z.nativeEnum(ORDER_SHIPPING_STATUSES).default(ORDER_SHIPPING_STATUSES.PRE_TRANSIT),
  products: z
    .array(orderProductSchema)
    .min(1),
  // .max(20),
  subtotal: z.number(),
  total_shipping_fee: z.number(),
  total_discount: z.number(),
  total: z.number().max(ORDER_CONFIG.MAX_ORDER_TOTAL),
  note: z
    .string()
    .max(ORDER_CONFIG.MAX_CHAR_NOTE)
    .optional(),
  promo_coupons: z
    .array(couponSchema.shape.id).max(ORDER_CONFIG.MAX_PROMO_COUPONS)
    .default([]),
  created_at: z.date(),
  updated_at: z.date(),
});
