import { model, Schema } from 'mongoose';
import {
  paymentTypes,
  orderStatuses,
  ORDER_STATUSES
} from '@/config/enums/order';
import {
  IOrder,
  IOrderModel,
  ILineItemOrder,
  IProductInLineOrder
} from '@/interfaces/models/order';
import { toJSON, paginate } from '@/models/plugins';

// define product in line Schema
const productInLineSchema = new Schema<IProductInLineOrder>(
  {
    inventory: {
      type: Schema.Types.ObjectId,
      required: true,
    },
    price: {
      type: Number,
      required: true,
    },
    quantity: {
      type: Number,
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    image_url: {
      type: String,
      required: true,
    },
  }, { _id: false }
);

// define reserve Schema
const lineItemSchema = new Schema<ILineItemOrder>(
  {
    shop: {
      type: Schema.Types.ObjectId,
      ref: 'Shop',
      required: true,
    },
    products: {
      type: [productInLineSchema],
      required: true,
    },
  }, { _id: false }
);

// define Schema
const orderSchema = new Schema<IOrder, IOrderModel>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    address: {
      type: Schema.Types.ObjectId,
      ref: 'Address',
      required: true,
    },
    payment_type: {
      type: String,
      enum: paymentTypes,
      required: true,
    },
    lines: {
      type: [lineItemSchema],
      required: true,
    },
    tracking_number: { type: String },
    stripe_charge_id: { type: String },
    currency: {
      type: String,
      max: 3,
      default: 'usd',
    },
    status: {
      type: String,
      enum: orderStatuses,
      default: ORDER_STATUSES.PENDING,
    },
    subtotal: {
      type: Number,
      default: 0,
      required: true,
    },
    shipping_fee: {
      type: Number,
      default: 0,
      required: true,
    },
    total_discount: {
      type: Number,
      default: 0,
    },
    total: {
      type: Number,
      default: 0,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Plugins
orderSchema.plugin(toJSON);
orderSchema.plugin(paginate);

export const Order: IOrderModel = model<IOrder, IOrderModel>('Order', orderSchema);
