import { Request } from 'express';
import { StatusCodes } from 'http-status-codes';
import Stripe from 'stripe';
import { ApiError } from '@/utils';
import { env } from '@/config';

export const stripeClient = new Stripe(env.stripe.secret);

export const onEventWebhook = (req: Request) => {
  const sig = req.headers['stripe-signature'];
  try {
    return Stripe.webhooks.constructEvent(req.body, sig as string, env.stripe.webhook_secret);
  }
  catch (err) {
    throw new ApiError(StatusCodes.BAD_REQUEST, `Webhook Error: ${err}`);
  }
};
