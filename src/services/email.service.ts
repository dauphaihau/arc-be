import SMTPTransport from 'nodemailer/lib/smtp-transport';
import nodemailer from 'nodemailer';
import { log, env } from '@/config';

const transport = nodemailer.createTransport(env.email.smtp as SMTPTransport.Options);

/* istanbul ignore next */
if (env.node !== 'test') {
  transport.verify()
    .then(() => log.info('Connected to email server'))
    .catch(() => {
      log.warn('Unable to connect to email server. Make sure you have configured the SMTP options in .env');
    });
}

/**
 * Send an email
 */
const sendEmail = async (to: string, subject: string, text: string) => {
  const msg = {
    from: env.email.from,
    to,
    subject,
    text,
  };
  await transport.sendMail(msg);
};

/**
 * Send reset password email
 */
const sendResetPasswordEmail = async (to: string, token: string) => {
  const subject = 'Reset password';
  // replace this url with the link to the reset password page of your front-end app
  const resetPasswordUrl = `${env.cors_origin}/reset?t=${token}`;
  const text = `Dear user,
To reset your password, click on this link: ${resetPasswordUrl}
If you did not request any password resets, then ignore this email.`;
  await sendEmail(to, subject, text);
};

/**
 * Send verification email
 */
const sendVerificationEmail = async (to: string, token: string) => {
  const subject = 'Email Verification';
  // replace this url with the link to the email verification page of your front-end app
  const verificationEmailUrl = `http://link-to-app/verify-email?token=${token}`;
  const text = `Dear user,
To verify your email, click on this link: ${verificationEmailUrl}
If you did not create an account, then ignore this email.`;
  await sendEmail(to, subject, text);
};

export const emailService = {
  transport,
  sendEmail,
  sendResetPasswordEmail,
  sendVerificationEmail,
};
