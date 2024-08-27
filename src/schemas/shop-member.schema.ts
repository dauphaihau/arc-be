import { z } from 'zod';
import { objectIdSchema } from '@/schemas/utils/objectId.schema';
import { SHOP_MEMBER_ROLES } from '@/config/enums/shop';

export const shopMemberSchema = z.object({
  user: objectIdSchema,
  shop: objectIdSchema,
  role: z.nativeEnum(SHOP_MEMBER_ROLES),
});
