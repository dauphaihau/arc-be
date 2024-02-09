import { z } from 'zod';
import { objectIdSchema } from '@/schemas/sub/objectId.schema';
import { MEMBER_ROLES } from '@/config/enums/member';

export const memberSchema = z.object({
  user: objectIdSchema,
  shop: objectIdSchema,
  role: z.nativeEnum(MEMBER_ROLES),
});
