import { z } from 'zod';
import { mixBaseQueryGetListSchema } from '@/schemas/utils/paginate.schema';
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
    query: mixBaseQueryGetListSchema(
      userAddressSchema.pick({ is_primary: true })
    ),
  }),
};
