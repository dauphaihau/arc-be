import { z } from 'zod';
import { PRODUCT_CONFIG } from '@/config/enums/product';
import { objectIdSchema } from '@/schema/sub/objectId.schema';

export const productInventoryReservationSchema = z.object({
  order: objectIdSchema,
  quantity: z.number(),
  createdOn: z.date().optional(),
});

export const productInventorySchema = z.object({
  id: objectIdSchema,
  shop: objectIdSchema,
  product: objectIdSchema,
  price: z
    .number()
    .min(1)
    .max(PRODUCT_CONFIG.MAX_PRICE),
  stock: z
    .number()
    .min(0)
    .max(PRODUCT_CONFIG.MAX_QUANTITY),
  sku: z
    .string()
    .max(PRODUCT_CONFIG.MAX_CHAR_SKU)
    .optional(),
  variant: z.string().optional(),
  reservations: z.array(productInventoryReservationSchema),
});
