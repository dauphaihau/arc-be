import { StatusCodes } from 'http-status-codes';
import { ClientSession } from 'mongoose';
import { IPayment } from '@/interfaces/models/payment';
import { log } from '@/config';
import { Payment } from '@/models/payment.model';
import { ApiError } from '@/utils/ApiError';

const createPayment = async (
  body: Omit<IPayment, 'id' | 'created_at' | 'updated_at'>,
  session: ClientSession
) => {
  const paymentCreated = await Payment.create([body], { session });
  if (paymentCreated.length === 0) {
    log.error('create payment failed');
    throw new ApiError(StatusCodes.UNPROCESSABLE_ENTITY);
  }
  return paymentCreated[0];
};

export const paymentService = {
  createPayment,
};
