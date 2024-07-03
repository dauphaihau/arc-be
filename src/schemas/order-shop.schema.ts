import { z } from 'zod';
import { itemCartSchema } from '@/schemas/cart.schema';
import { productInventorySchema } from '@/schemas/product-inventory.schema';
import { productSchema } from '@/schemas/product.schema';
import {
  ORDER_CONFIG, ORDER_SHIPPING_STATUSES
} from '@/config/enums/order';
import { objectIdSchema } from '@/schemas/sub/objectId.schema';

export const orderShopProductSchema = z.object({
  product: objectIdSchema,
  inventory: objectIdSchema,
  price: productInventorySchema.shape.price,
  quantity: z.number(),
  title: productSchema.shape.title,
  image_url: z.string(),
});

export const orderShopSchema = z.object({
  order: objectIdSchema,
  shop: objectIdSchema,
  coupon_codes: itemCartSchema.shape.coupon_codes,
  shipping_status: z.nativeEnum(ORDER_SHIPPING_STATUSES).default(ORDER_SHIPPING_STATUSES.PRE_TRANSIT),
  products: z
    .array(orderShopProductSchema)
    .min(1)
    .max(20),
  subtotal: z.number(),
  total_discount: z.number(),
  total: z.number(),
  note: z
    .string()
    .max(ORDER_CONFIG.MAX_CHAR_NOTE)
    .optional(),
});
