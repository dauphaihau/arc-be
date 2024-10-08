import { z } from 'zod';
import { objectIdSchema } from './utils/objectId.schema';
import { TOKEN_TYPES } from '@/config/enums/token';

export const tokenSchema = z.object({
  id: objectIdSchema,
  user: objectIdSchema,
  token: z.string(),
  expires: z.date(),
  type: z.nativeEnum(TOKEN_TYPES),
  blacklisted: z.boolean(),
});
