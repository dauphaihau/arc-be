import { z } from 'zod';
import { CATEGORY_CONFIG } from '@/config/enums/category';
import { objectIdSchema } from '@/schemas/sub/objectId.schema';

export const categorySchema = z.object({
  id: objectIdSchema,
  parent: objectIdSchema.optional(),
  name: z
    .string()
    .min(1)
    .max(CATEGORY_CONFIG.MAX_CHAR_NAME),
});
