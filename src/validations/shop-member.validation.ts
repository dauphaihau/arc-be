import { z } from 'zod';
import { mixBaseQueryOptionsSchema } from '@/schemas/sub/queryOptions.schema';
import { shopMemberSchema } from '@/schemas';

export const shopMemberValidation = {
  addMember: z.object({
    body: shopMemberSchema.pick({ user: true, role: true }),
  }),
  deleteMember: z.object({
    params: shopMemberSchema.pick({ shop: true, user: true }),
  }),
  updateMember: z.object({
    params: shopMemberSchema.pick({ shop: true, user: true }),
    body: shopMemberSchema.pick({ role: true }),
  }),
  getMembers: z.object({
    params: shopMemberSchema.pick({ shop: true }),
    query: mixBaseQueryOptionsSchema(
      shopMemberSchema.pick({ role: true })
    ),
  }),
};
