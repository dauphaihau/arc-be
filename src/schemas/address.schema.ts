import { z } from 'zod';
import { objectIdSchema } from '@/schemas/sub/objectId.schema';

export const addressSchema = z.object({
  id: objectIdSchema,
  user: objectIdSchema,
  full_name: z.string().max(50),
  address1: z.string().max(50),
  address2: z.string().max(50).optional(),
  city: z.string().max(50),
  state: z.string(),
  zip: z.string().max(10),
  country: z.string(),
  phone: z.string().max(20),
  is_primary: z.boolean().optional(),
});
