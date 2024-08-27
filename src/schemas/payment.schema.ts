import { z } from 'zod';
import { objectIdSchema } from '@/schemas/utils/objectId.schema';
import { PAYMENT_TYPES } from '@/config/enums/order';

export const basePaymentSchema = z.object({
  id: objectIdSchema,
  order: objectIdSchema,
  user: objectIdSchema,
  type: z.nativeEnum(PAYMENT_TYPES),
  currency: z.string().max(3),
  created_at: z.date(),
  updated_at: z.date(),
});

export const paymentCardSchema = z.object({
  type: z.literal(PAYMENT_TYPES.CARD),
  card_funding: z.string(),
  card_last4: z.string().min(4).max(4),
  card_brand: z.string(),
  card_exp_month: z.number().min(1).max(12),
  card_exp_year: z.number().min(4).max(4),
  stripe_payment_method_id: z.string(),
});
export const paymentCashSchema = z.object({
  type: z.literal(PAYMENT_TYPES.CASH),
});

const conditionPaymentTypeSchema = z.discriminatedUnion('type',
  [
    paymentCardSchema,
    paymentCashSchema,
  ]
);

export const paymentSchema = z.intersection(conditionPaymentTypeSchema, basePaymentSchema);
