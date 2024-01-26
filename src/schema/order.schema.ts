import { z } from 'zod';
import { Schema } from 'mongoose';
// import { productInventorySchema } from './product-inventory.schema';
import { COUPONS_MAX_USE_PER_ORDER } from '@/config/enums/coupon';
import { couponSchema } from '@/schema/coupon.schema';
import { PAYMENT_TYPES, ORDER_STATUSES } from '@/config/enums/order';
import { productSchema } from '@/schema/product.schema';
import { objectIdSchema } from '@/schema/sub/objectId.schema';

export const productOrderSchema = z.object({
  product_id: productSchema.shape.id,
  // quantity: productSchema.shape.quantity,
  quantity: z.number(),
});

export const lineItemSchema = z.object({
  shop: objectIdSchema,
  coupon_codes: z
    .array(couponSchema.shape.code)
    .min(1)
    .max(COUPONS_MAX_USE_PER_ORDER)
    .optional()
  ,
  products: z
    // .array(productSchema.pick({ id: true, quantity: true }))
    // .array(productSchema.pick({ id: true }))
    .array(z.object({
      inventory: objectIdSchema,
      quantity: z.number(),
    }))
    .min(1)
    .max(20),
});

export const orderSchema = z.object({
  id: objectIdSchema,
  user_id: objectIdSchema,
  address_id: objectIdSchema,
  payment_type: z.nativeEnum(PAYMENT_TYPES),
  lines: z
    .array(lineItemSchema.or(z.instanceof(Schema.Types.Mixed)))
    .min(1)
    .max(20),
  tracking_number: z.string(),
  stripe_charge_id: z.string(),
  currency: z.string().max(3),
  status: z.nativeEnum(ORDER_STATUSES),
  subtotal: z.number(),
  shipping_fee: z.number(),
  total_discount: z.number(),
  total: z.number(),
});
