import { z } from 'zod';
import { mixBaseQueryOptionsSchema } from '@/schema/sub/queryOptions.schema';
import { memberSchema } from '@/schema';

export const memberValidation = {
  addMember: z.object({
    body: memberSchema.pick({ user: true, role: true }),
  }),
  deleteMember: z.object({
    params: memberSchema.pick({ shop: true, user: true }),
  }),
  updateMember: z.object({
    params: memberSchema.pick({ shop: true, user: true }),
    body: memberSchema.pick({ role: true }),
  }),
  getMembers: z.object({
    params: memberSchema.pick({ shop: true }),
    query: mixBaseQueryOptionsSchema(
      memberSchema.pick({ role: true })
    ),
  }),
};
