import { z } from 'zod';
import { objectIdSchema } from '@/schema/sub/objectId.schema';
import { MEMBER_ROLES } from '@/config/enums/member';

export const memberSchema = z.object({
  user_id: objectIdSchema,
  shop_id: objectIdSchema,
  role: z.nativeEnum(MEMBER_ROLES),
});
