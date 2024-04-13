import { z } from 'zod';
import { userSchema } from '@/schemas';

export const userValidation = {
  updateUser: z.object({
    body: userSchema
      .omit({ id: true, is_email_verified: true, shop: true })
      .partial()
      .strict()
      .refine(val => Object.values(val).some(Boolean), 'request body required at least 1 field')
    ,
  }),
};
