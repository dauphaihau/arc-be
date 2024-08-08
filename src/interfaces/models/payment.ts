import { Model, Document } from 'mongoose';
import { z } from 'zod';
import { paymentSchema } from '@/schemas/payment.schema';

export type IPayment = z.infer<typeof paymentSchema>;

export type IPaymentDoc = IPayment & Document;

export interface IPaymentModel extends Model<IPaymentDoc, unknown> {}
