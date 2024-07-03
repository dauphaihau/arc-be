import { z } from 'zod';
import { PRODUCT_SHIPPING_CHARGE } from '@/config/enums/product';
import { objectIdSchema } from '@/schemas/sub/objectId.schema';

export const standardShippingSchema = z.object({
  country: z.string(),
  service: z.string(),
  delivery_time: z.string(),
  charge: z.nativeEnum(PRODUCT_SHIPPING_CHARGE).default(PRODUCT_SHIPPING_CHARGE.FREE_SHIPPING),
});

export const productShippingSchema = z.object({
  id: objectIdSchema,
  shop: objectIdSchema,
  product: objectIdSchema,
  country: z.string(),
  zip: z.string().max(10),
  process_time: z.string(),
  standard_shipping: z.array(standardShippingSchema),
});
