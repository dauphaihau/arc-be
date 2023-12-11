import { z } from 'zod';
import { memberSchema } from '@/interfaces/schema/member';

export const memberValidation = {
  addMember: z.object({
    body: memberSchema.pick({ user_id: true, role: true }),
  }),
  deleteMember: z.object({
    params: memberSchema.pick({ user_id: true }),
  }),
  updateMember: z.object({
    params: memberSchema.pick({ shop_id: true, user_id: true }),
    body: memberSchema.pick({ role: true }),
  }),
  getMembers: z.object({
    params: memberSchema.pick({ shop_id: true }),
    query: z.strictObject({
      limit: z.string().optional(),
      page: z.string().optional(),
      sortBy: z.string().optional(),
    }),
  }),
};
