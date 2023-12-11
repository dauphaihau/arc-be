import { z } from 'zod';

const REG_PASSWORD = /^(?=.*[0-9])(?=.*[a-z])(?=.*[A-Z])(?=.*\W)(?!.* ).{8,16}$/;

export const userSchema = z.object({
  name: z
    .string({
      required_error: 'name is required',
      invalid_type_error: 'invalid type name',
    })
    .trim()
    .min(3, 'name must be at least 3 characters'),
  // .max(20, 'name must be no longer than 20 characters'),
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
    .regex(new RegExp(REG_PASSWORD), 'password must contain at least 1 lower letter, 1 uppercase letter, 1 number and 1 special character')
  ,
  is_email_verified: z.boolean(),
});
