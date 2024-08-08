import { z } from 'zod';
import {
  createOrderFromCartBodySchema,
  createOrderForBuyNowBodySchema
} from '@/schemas/request/order';

export const orderValidation = {
  createOrderFromCart: z.object({
    body: createOrderFromCartBodySchema.strict(),
  }),
  createOrderForBuyNow: z.object({
    body: createOrderForBuyNowBodySchema.strict(),
  }),
  getOrderByCheckoutSession: z.object({
    query: z.object({
      session_id: z.string(),
    }),
  }),
};
