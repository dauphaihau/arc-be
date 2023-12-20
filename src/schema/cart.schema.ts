import { z } from 'zod';
import { productSchema } from '@/schema/product.schema';
import { objectIdSchema } from '@/schema/sub/objectId.schema';

export const productCartSchema = z.object({
  product_id: productSchema.shape.id,
  quantity: productSchema.shape.quantity,
  is_select_order: z
    .boolean()
    .default(true)
    .optional(),
});

export const cartSchema = z.object({
  user_id: objectIdSchema,
  products: z
    .array(productCartSchema)
    .max(20),
});
