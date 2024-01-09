import { z } from 'zod';
import { objectIdSchema } from '@/schema/sub/objectId.schema';
import { USER_REGEX_PASSWORD, USER_REGEX_NAME } from '@/config/enums/user';

export const userSchema = z.object({
  name: z
    .string({
      required_error: 'name is required',
      invalid_type_error: 'invalid type name',
    })
    .trim()
    .regex(USER_REGEX_NAME, 'Name is invalid')
    .min(3, 'name must be at least 3 characters')
    .max(60, 'name must be no longer than 60 characters'),
  email: z
    .string({
      required_error: 'email is required',
      invalid_type_error: 'invalid type email',
    })
    .trim()
    .min(6, 'email must be at least 6 characters')
    .max(254, 'email must be no longer than 254 characters')
    .email('invalid email'),
  password: z.string()
    .min(8, 'password must be at least 8 characters')
    .regex(USER_REGEX_PASSWORD, 'password must contain at least 1 lower letter, 1 uppercase letter, 1 number and 1 special character')
  ,
  is_email_verified: z.boolean().optional(),
  shop: objectIdSchema.describe('the shop that user owns').optional(),
});
