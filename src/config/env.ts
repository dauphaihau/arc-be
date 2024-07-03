import path from 'path';
import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config({ path: path.join(__dirname, '../../.env.dev') });

const envVarsZodSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.preprocess(Number, z.number()).default(3000),
  CORS_ORIGIN: z.string().url().or(z.literal('*')),
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
  AWS_ACCESS_KEY_ID: z.string().describe('access key id for aws s3'),
  AWS_SECRET_ACCESS_KEY: z.string().describe('secret access key for aws s3'),
  AWS_S3_REGION: z.string().describe('region for aws s3'),
  AWS_S3_BUCKET: z.string().describe('bucket for aws s3'),
  AWS_S3_HOST_BUCKET: z.string().url().describe('host bucket for aws s3'),
  REDIS_HOST: z.string().describe('server redis server'),
  REDIS_PORT: z
    .preprocess(Number, z.number())
    .default(6379).describe('port redis server'),
  REDIS_USERNAME: z.string().optional().describe('username redis server'),
  REDIS_PASSWORD: z.string().optional().describe('password redis server'),
  STRIPE_SECRET_KEY: z.string().describe('Stripe secret key'),
  STRIPE_WEBHOOK_SECRET_KEY: z.string().describe('Stripe webhook secret key'),
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
  aws_s3: {
    credentials: {
      accessKeyId: envVars.AWS_ACCESS_KEY_ID,
      secretAccessKey: envVars.AWS_SECRET_ACCESS_KEY,
      signatureVersion: 'v4',
    },
    region: envVars.AWS_S3_REGION,
    bucket: envVars.AWS_S3_BUCKET,
    host_bucket: envVars.AWS_S3_HOST_BUCKET,
  },
  redis: {
    host: envVars.REDIS_HOST,
    port: envVars.REDIS_PORT,
    username: envVars.REDIS_USERNAME,
    password: envVars.REDIS_PASSWORD,
  },
  stripe: {
    secret: envVars.STRIPE_SECRET_KEY,
    webhook_secret: envVars.STRIPE_WEBHOOK_SECRET_KEY,
  },
};
