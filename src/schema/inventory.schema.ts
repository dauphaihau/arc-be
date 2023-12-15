import { z } from 'zod';
import { objectIdSchema } from '@/schema/sub/objectId.schema';

export const inventorySchema = z.object({
  shop_id: objectIdSchema,
  product_id: objectIdSchema,
  stock: z.number(),
  reservations: z.array(z.any()),
});
