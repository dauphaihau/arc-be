import { z } from 'zod';
import { tokenSchema, userSchema } from '@/schema';

export const authValidation = {
  register: z.object({
    body: userSchema
      .pick({ name: true, email: true, password: true })
      .strict(),
  }),
  login: z.object({
    body: userSchema
      .pick({ password: true, email: true })
      .strict(),
  }),
  forgotPassword: z.object({
    body: userSchema.pick({ email: true }).strict(),
  }),
  resetPassword: z.object({
    query: tokenSchema.pick({ token: true }).strict(),
    body: userSchema.pick({ password: true }).strict(),
  }),
  verifyToken: z.object({
    query: tokenSchema.pick({ token: true, type: true }).strict(),
  }),
  verifyEmail: z.object({
    query: tokenSchema.pick({ token: true }).strict(),
  }),
};
