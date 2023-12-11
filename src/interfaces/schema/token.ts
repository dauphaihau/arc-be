import mongoose from 'mongoose';
import { z } from 'zod';
import { TOKEN_TYPES } from '@/config/enums/token';

export const tokenSchema = z.object({
  user_id: z.union([z.instanceof(mongoose.Types.ObjectId), z.string()]),
  token: z.string(),
  expires: z.date(),
  type: z.nativeEnum(TOKEN_TYPES),
  blacklisted: z.boolean(),
});
