import { model, Schema } from 'mongoose';
import {
  ORDER_CONFIG, ORDER_SHIPPING_STATUSES
} from '@/config/enums/order';
import {
  IOrderShop,
  IOrderShopModel,
  IOrderShopProduct
} from '@/interfaces/models/order';
import { toJSON, paginate } from '@/models/plugins';

// define product in line Schema
const orderShopProductSchema = new Schema<IOrderShopProduct>(
  {
    product: {
      type: Schema.Types.ObjectId,
      required: true,
    },
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

// define Schema
const orderShopSchema = new Schema<IOrderShop, IOrderShopModel>(
  {
    order: {
      type: Schema.Types.ObjectId,
      ref: 'Order',
      required: true,
    },
    shop: {
      type: Schema.Types.ObjectId,
      ref: 'Shop',
      required: true,
    },
    products: {
      type: [orderShopProductSchema],
      required: true,
    },
    shipping_status: {
      type: String,
      enum: Object.values(ORDER_SHIPPING_STATUSES),
      default: ORDER_SHIPPING_STATUSES.PRE_TRANSIT,
    },
    coupon_codes: {
      type: [],
    },
    note: {
      type: String,
      max: ORDER_CONFIG.MAX_CHAR_NOTE,
    },
    subtotal: {
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
      max: ORDER_CONFIG.MAX_ORDER_TOTAL,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Plugins
orderShopSchema.plugin(toJSON);
orderShopSchema.plugin(paginate);

export const OrderShop: IOrderShopModel = model<IOrderShop, IOrderShopModel>('order_shop', orderShopSchema);
