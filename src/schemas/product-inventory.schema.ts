import { z } from 'zod';
import { PRODUCT_CONFIG } from '@/config/enums/product';
import { objectIdSchema } from '@/schemas/utils/objectId.schema';

export const productInventoryReservationSchema = z.object({
  order: objectIdSchema,
  quantity: z.number(),
  created_at: z.date(),
});

export const productInventorySchema = z.object({
  id: objectIdSchema,
  shop: objectIdSchema,
  product: objectIdSchema,
  price: z
    .number()
    .min(PRODUCT_CONFIG.MIN_PRICE)
    .max(PRODUCT_CONFIG.MAX_PRICE),
  stock: z
    .number()
    .min(PRODUCT_CONFIG.MIN_STOCK)
    .max(PRODUCT_CONFIG.MAX_STOCK)
    .default(PRODUCT_CONFIG.MIN_STOCK),
  sku: z
    .string()
    .max(PRODUCT_CONFIG.MAX_CHAR_SKU)
    .optional(),
  variant: z.string().optional(),
  reservations: z.array(productInventoryReservationSchema),
  created_at: z.date(),
  updated_at: z.date(),
});
