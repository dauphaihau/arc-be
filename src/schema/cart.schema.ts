import { z } from 'zod';
import { CART_CONFIG } from '@/config/enums/cart';
import { PRODUCT_CONFIG } from '@/config/enums/product';
import { objectIdSchema } from '@/schema/sub/objectId.schema';

export const productCartSchema = z.object({
  inventory: objectIdSchema,
  variant: objectIdSchema.optional(),
  quantity: z.number().max(PRODUCT_CONFIG.MAX_QUANTITY),
  is_select_order: z
    .boolean()
    .default(true)
    .optional(),
});

export const itemCartSchema = z.object({
  shop: objectIdSchema,
  products: z.array(productCartSchema),
});

export const cartSchema = z.object({
  user: objectIdSchema,
  items: z
    .array(itemCartSchema)
    .max(CART_CONFIG.MAX_ITEMS),
  // count_products: z.number().max(20),
});
