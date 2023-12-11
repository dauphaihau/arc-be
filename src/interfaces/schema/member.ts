import mongoose from 'mongoose';
import { z } from 'zod';
import { MEMBER_ROLES } from '@/config/enums/member';

export const memberSchema = z.object({
  user_id: z.union([z.instanceof(mongoose.Types.ObjectId), z.string()]),
  shop_id: z.union([z.instanceof(mongoose.Types.ObjectId), z.string()]),
  role: z.nativeEnum(MEMBER_ROLES),
});
