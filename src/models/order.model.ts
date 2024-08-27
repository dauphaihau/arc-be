import { model, Schema } from 'mongoose';
import {
  orderStatuses,
  ORDER_CONFIG, ORDER_SHIPPING_STATUSES
} from '@/config/enums/order';
import {
  IOrderDoc,
  IOrderModel, IOrderShopProduct, IOrder
} from '@/interfaces/models/order';
import { toJSON } from '@/models/plugins';

const productSchema = new Schema<IOrderShopProduct>(
  {
    product: {
      type: Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
    },
    inventory: {
      type: Schema.Types.ObjectId,
      ref: 'product_inventory',
      required: true,
    },
    percent_coupon: {
      type: Schema.Types.ObjectId,
      ref: 'Coupon',
      default: null,
    },
    freeship_coupon: {
      type: Schema.Types.ObjectId,
      ref: 'Coupon',
      default: null,
    },
    price: {
      type: Number,
      required: true,
    },
    sale_price: {
      type: Number,
      default: 0,
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

// define Schema
const orderSchema = new Schema<IOrderDoc, IOrderModel>(
  {
    parent: {
      type: Schema.Types.ObjectId,
      ref: 'Order',
      default: null,
    },
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    user_address: {
      type: Schema.Types.ObjectId,
      ref: 'user_address',
      required: true,
    },
    shop: {
      type: Schema.Types.ObjectId,
      ref: 'Shop',
    },
    payment: {
      type: Schema.Types.ObjectId,
      ref: 'Payment',
    },
    tracking_number: { type: String },
    stripe_charge_id: { type: String },
    shipping_status: {
      type: String,
      enum: Object.values(ORDER_SHIPPING_STATUSES),
    },
    status: {
      type: String,
      enum: orderStatuses,
    },
    products: {
      type: [productSchema],
    },
    subtotal: {
      type: Number,
      default: 0,
      required: true,
    },
    total_shipping_fee: {
      type: Number,
      default: 0,
      required: true,
    },
    total_discount: {
      type: Number,
      default: 0,
      required: true,
    },
    total: {
      type: Number,
      default: 0,
      max: ORDER_CONFIG.MAX_ORDER_TOTAL,
      required: true,
    },
    promo_coupons: {
      type: [{ type: Schema.Types.ObjectId, ref: 'Coupon' }],
      validate(val: IOrder['promo_coupons']) {
        if (val && val.length > ORDER_CONFIG.MAX_PROMO_COUPONS) {
          throw new Error('size is invalid');
        }
      },
    },
    note: {
      type: String,
      maxlength: ORDER_CONFIG.MAX_CHAR_NOTE,
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
orderSchema.plugin(toJSON);

export const Order: IOrderModel = model<IOrderDoc, IOrderModel>('Order', orderSchema);
