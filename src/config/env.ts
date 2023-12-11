import path from 'path';
import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config({ path: path.join(__dirname, '../../.env') });

const envVarsZodSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.preprocess(Number, z.number()).default(3000),
  CORS_ORIGIN: z.string().url().default('*'),
  MONGODB_URL: z.string().url().describe('Mongo DB url'),
  JWT_SECRET: z.string().describe('JWT secret key'),
  JWT_ACCESS_EXPIRATION_MINUTES: z.preprocess(Number, z.number())
    .default(30)
    .describe('minutes after which access tokens expire'),
  JWT_REFRESH_EXPIRATION_DAYS: z
    .preprocess(Number, z.number())
    .default(30)
    .describe('days after which refresh tokens expire'),
  JWT_RESET_PASSWORD_EXPIRATION_MINUTES: z
    .preprocess(Number, z.number())
    .default(10)
    .describe('minutes after which reset password token expires'),
  JWT_VERIFY_EMAIL_EXPIRATION_MINUTES: z
    .preprocess(Number, z.number())
    .default(10)
    .describe('minutes after which verify email token expires'),
  SMTP_SERVICE: z.string()
    .describe('service that will send the emails')
    .nullable(),
  SMTP_HOST: z.string().describe('server that will send the emails'),
  SMTP_PORT: z
    .preprocess(Number, z.number())
    .describe('port to connect to the email server'),
  SMTP_USERNAME: z.string().describe('username for email server'),
  SMTP_PASSWORD: z.string().describe('password for email server'),
  EMAIL_FROM: z.string().describe('the from field in the emails sent by the app'),
});

const result = envVarsZodSchema.safeParse(process.env);
if (!result.success) {
  throw new Error(
    `Config Envs validation error: ${result.error.issues.map(item => item.path[0]).join(', ')}`
  );
}
const envVars = result.data;

export const env = {
  node: envVars.NODE_ENV,
  port: envVars.PORT,
  cors_origin: envVars.CORS_ORIGIN,
  mongoose: {
    url: envVars.MONGODB_URL,
    options: {
      useCreateIndex: true,
      useNewUrlParser: true,
      useUnifiedTopology: true,
      useFindAndModify: false,
    },
  },
  jwt: {
    secret: envVars.JWT_SECRET,
    accessExpirationMinutes: envVars.JWT_ACCESS_EXPIRATION_MINUTES,
    refreshExpirationDays: envVars.JWT_REFRESH_EXPIRATION_DAYS,
    resetPasswordExpirationMinutes: envVars.JWT_RESET_PASSWORD_EXPIRATION_MINUTES,
    verifyEmailExpirationMinutes: envVars.JWT_VERIFY_EMAIL_EXPIRATION_MINUTES,
  },
  email: {
    smtp: {
      service: envVars.SMTP_SERVICE,
      host: envVars.SMTP_HOST,
      port: envVars.SMTP_PORT,
      auth: {
        user: envVars.SMTP_USERNAME,
        pass: envVars.SMTP_PASSWORD,
      },
      // secure: true,
    },
    from: envVars.EMAIL_FROM,
  },
};
