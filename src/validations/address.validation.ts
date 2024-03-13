import { z } from 'zod';
import { mixBaseQueryOptionsSchema } from '@/schemas/sub/queryOptions.schema';
import { addressSchema } from '@/schemas';

export const addressValidation = {
  createAddress: z.object({
    body: addressSchema.omit({ id: true, user: true }).strict(),
  }),
  updateAddress: z.object({
    params: addressSchema.pick({ id: true }),
    body: addressSchema.omit({ id: true, user: true }).strict(),
  }),
  deleteAddress: z.object({
    params: addressSchema.pick({ id: true }),
  }),
  getAddress: z.object({
    params: addressSchema.pick({ id: true }),
  }),
  getAddresses: z.object({
    query: mixBaseQueryOptionsSchema(
      addressSchema.pick({ is_primary: true })
    ),
  }),
};
