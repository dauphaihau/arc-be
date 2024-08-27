import { z } from 'zod';
import { mixBaseQueryGetListSchema } from '@/schemas/utils/paginate.schema';
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
    query: mixBaseQueryGetListSchema(
      shopMemberSchema.pick({ role: true })
    ),
  }),
};
