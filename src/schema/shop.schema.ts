import { z } from 'zod';
import { objectIdSchema } from '@/schema/sub/objectId.schema';

export const shopSchema = z.object({
  id: objectIdSchema,
  user_id: objectIdSchema.describe('the user that owns this shop'),
  shop_name: z
    .string({
      required_error: 'shop_name is required',
      invalid_type_error: 'invalid type shop name',
    })
    .trim()
    .min(6, 'must be at least 6 characters')
    .max(20, 'must be no longer than 20 characters'),
});
