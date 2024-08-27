import { model, Schema } from 'mongoose';
import { toJSON } from '@/models/plugins';
import {
  IPaymentModel,
  IPaymentDoc
} from '@/interfaces/models/payment';
import { paymentTypes } from '@/config/enums/order';

// define Schema
const paymentSchema = new Schema<IPaymentDoc>(
  {
    order: {
      type: Schema.Types.ObjectId,
      ref: 'Order',
      required: true,
    },
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    type: {
      type: String,
      enum: paymentTypes,
      required: true,
    },
    currency: {
      type: String,
      maxlength: 3,
    },
    card_funding: {
      type: String,
    },
    card_last4: {
      minLength: 4,
      maxLength: 4,
      type: String,
    },
    card_brand: {
      type: String,
    },
    card_exp_month: {
      minLength: 1,
      maxLength: 2,
      type: Number,
    },
    card_exp_year: {
      minLength: 4,
      maxLength: 4,
      type: Number,
    },
    stripe_payment_method_id: {
      type: String,
    },
  },
  {
    timestamps: {
      createdAt: 'created_at',
      updatedAt: 'updated_at',
    },
  }
);

// Plugins
paymentSchema.plugin(toJSON);

export const Payment: IPaymentModel = model<IPaymentDoc, IPaymentModel>('Payment', paymentSchema);
