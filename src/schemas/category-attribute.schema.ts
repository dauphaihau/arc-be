import { z } from 'zod';
import { objectIdSchema } from '@/schemas/utils/objectId.schema';

export const categoryAttributeSchema = z.object({
  category: objectIdSchema,
  name: z.string(),
  options: z.array(z.string()).optional(),
});
