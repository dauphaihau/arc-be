import express from 'express';
import { StatusCodes } from 'http-status-codes';
import { onEventWebhook } from '@/config/stripe';
import { stripeService } from '@/services/stripe.service';
import { catchAsync } from '@/utils';

const router = express.Router();

router.post(
  '/',
  express.raw({ type: 'application/json' }),
  catchAsync(async (req, res) => {
    const event = onEventWebhook(req);
    await stripeService.onEventStripe(event);
    res.status(StatusCodes.OK).send({});
  })
);

export default router;
