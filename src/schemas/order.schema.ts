import { z } from 'zod';
import { itemCartSchema } from '@/schemas/cart.schema';
import { productInventorySchema } from '@/schemas/product-inventory.schema';
import { productSchema } from '@/schemas/product.schema';
import {
  PAYMENT_TYPES,
  ORDER_STATUSES,
  ORDER_CONFIG
} from '@/config/enums/order';
import { objectIdSchema } from '@/schemas/sub/objectId.schema';

export const productInLineSchema = z.object({
  inventory: objectIdSchema,
  price: productInventorySchema.shape.price,
  quantity: z.number(),
  title: productSchema.shape.title,
  image_url: z.string(),
});

export const lineItemSchema = z.object({
  shop: objectIdSchema,
  coupon_codes: itemCartSchema.shape.coupon_codes,
  products: z
    .array(productInLineSchema)
    .min(1)
    .max(20),
  note: z
    .string()
    .max(ORDER_CONFIG.MAX_CHAR_NOTE)
    .optional(),
});

export const orderSchema = z.object({
  id: objectIdSchema,
  user: objectIdSchema,
  address: objectIdSchema,
  payment_type: z.nativeEnum(PAYMENT_TYPES),
  lines: z
    .array(lineItemSchema)
    .min(1)
    .max(20),
  tracking_number: z.string(),
  stripe_charge_id: z.string(),
  currency: z.string().max(3),
  status: z.nativeEnum(ORDER_STATUSES),
  subtotal: z.number(),
  shipping_fee: z.number(),
  total_discount: z.number(),
  total: z.number().max(ORDER_CONFIG.MAX_ORDER_TOTAL),
});
