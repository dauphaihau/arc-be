import { Model, Document } from 'mongoose';
import { z } from 'zod';
import {
  paymentSchema,
  paymentCardSchema,
  paymentCashSchema, basePaymentSchema
} from '@/schemas/payment.schema';

export type IBasePayment = z.infer<typeof basePaymentSchema>;
export type IPaymentCard = z.infer<typeof paymentCardSchema>;
export type IPaymentCash = z.infer<typeof paymentCashSchema>;
export type IPayment = z.infer<typeof paymentSchema>;

export type IPaymentDoc = IPayment & Document;

export interface IPaymentModel extends Model<IPaymentDoc, unknown> {}
