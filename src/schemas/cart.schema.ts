import { z } from 'zod';
import { CART_CONFIG } from '@/config/enums/cart';
import { PRODUCT_CONFIG } from '@/config/enums/product';
import { objectIdSchema } from '@/schemas/utils/objectId.schema';

export const productCartSchema = z.object({
  id: objectIdSchema,
  product: objectIdSchema,
  inventory: objectIdSchema,
  quantity: z.number().max(PRODUCT_CONFIG.MAX_STOCK),
  is_select_order: z
    .boolean()
    .default(true)
    .optional(),
  created_at: z.date(),
  updated_at: z.date(),
});

export const shopCartSchema = z.object({
  id: objectIdSchema,
  shop: objectIdSchema,
  products: z.array(productCartSchema),
  created_at: z.date(),
  updated_at: z.date(),
});

export const cartSchema = z.object({
  id: objectIdSchema,
  user: objectIdSchema,
  items: z
    .array(shopCartSchema)
    .max(CART_CONFIG.MAX_SHOP_CART),
  is_temp: z.boolean().default(false).optional(),
  created_at: z.date(),
  updated_at: z.date(),
});
