import { z } from 'zod';
import { mixBaseQueryOptionsSchema } from '@/schema/sub/queryOptions.schema';
import { memberSchema } from '@/schema';

export const memberValidation = {
  addMember: z.object({
    body: memberSchema.pick({ user_id: true, role: true }),
  }),
  deleteMember: z.object({
    params: memberSchema.pick({ shop_id: true, user_id: true }),
  }),
  updateMember: z.object({
    params: memberSchema.pick({ shop_id: true, user_id: true }),
    body: memberSchema.pick({ role: true }),
  }),
  getMembers: z.object({
    params: memberSchema.pick({ shop_id: true }),
    query: mixBaseQueryOptionsSchema(
      memberSchema.pick({ role: true })
    ),
  }),
};
