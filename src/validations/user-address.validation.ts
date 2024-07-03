import { z } from 'zod';
import { mixBaseQueryOptionsSchema } from '@/schemas/sub/queryOptions.schema';
import { userAddressSchema } from '@/schemas';

export const userAddressValidation = {
  create: z.object({
    body: userAddressSchema.omit({ id: true, user: true }).strict(),
  }),
  update: z.object({
    params: userAddressSchema.pick({ id: true }),
    body: userAddressSchema.omit({ id: true, user: true }).strict(),
  }),
  delete: z.object({
    params: userAddressSchema.pick({ id: true }),
  }),
  getDetail: z.object({
    params: userAddressSchema.pick({ id: true }),
  }),
  getList: z.object({
    query: mixBaseQueryOptionsSchema(
      userAddressSchema.pick({ is_primary: true })
    ),
  }),
};
