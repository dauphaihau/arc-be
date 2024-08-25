import { z } from 'zod';
import {
  MARKETPLACE_REGIONS, MARKETPLACE_LANGUAGES, MARKETPLACE_CURRENCIES
} from '@/config/enums/marketplace';
import { objectIdSchema } from '@/schemas/utils/objectId.schema';
import {
  USER_REGEX_PASSWORD,
  USER_REGEX_NAME,
  USER_CONFIG
} from '@/config/enums/user';

export const userSchema = z.object({
  id: objectIdSchema,
  name: z
    .string({
      required_error: 'name is required',
      invalid_type_error: 'invalid type name',
    })
    .trim()
    .regex(USER_REGEX_NAME, 'Name is invalid')
    .min(USER_CONFIG.MIN_CHAR_NAME, `Name must be at least ${USER_CONFIG.MIN_CHAR_NAME} characters`)
    .max(USER_CONFIG.MAX_CHAR_NAME, `Name must be no longer than ${USER_CONFIG.MAX_CHAR_NAME} characters`),
  email: z
    .string({
      required_error: 'email is required',
      invalid_type_error: 'invalid type email',
    })
    .trim()
    .min(USER_CONFIG.MIN_CHAR_EMAIL, `Email must be at least ${USER_CONFIG.MIN_CHAR_EMAIL} characters`)
    .max(USER_CONFIG.MAX_CHAR_EMAIL, `Email must be no longer than ${USER_CONFIG.MAX_CHAR_EMAIL} characters`)
    .email('invalid email'),
  password: z.string()
    .min(
      USER_CONFIG.MIN_CHAR_PASSWORD,
      `Password must be at least ${USER_CONFIG.MIN_CHAR_PASSWORD} characters`
    )
    .max(
      USER_CONFIG.MAX_CHAR_PASSWORD,
      `Password must be no longer than ${USER_CONFIG.MAX_CHAR_PASSWORD} characters`
    )
    .regex(USER_REGEX_PASSWORD, 'password must contain at least 1 lower letter, 1 uppercase letter, 1 number and 1 special character')
  ,
  is_email_verified: z.boolean().optional(),
  shop: objectIdSchema.describe('the shop that user owns').optional(),
  market_preferences: z.object({
    region: z.string().default(MARKETPLACE_REGIONS.UNITED_STATES),
    language: z.string().default(MARKETPLACE_LANGUAGES.EN),
    currency: z.nativeEnum(MARKETPLACE_CURRENCIES).default(MARKETPLACE_CURRENCIES.USD),
  }).optional(),
});
