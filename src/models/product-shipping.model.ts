import { Schema, model } from 'mongoose';
import { PRODUCT_SHIPPING_CHARGE } from '@/config/enums/product';
import { toJSON } from '@/models/plugins';
import {
  IProductShipping, IProductShippingModel, IProductStandardShipping
} from '@/interfaces/models/product';

// define reserve Schema
const reserveSchema = new Schema<IProductStandardShipping>(
  {
    country: {
      type: String,
      required: true,
    },
    delivery_time: {
      type: String,
      required: true,
    },
    service: {
      type: String,
      required: true,
    },
    charge: {
      type: String,
      enum: Object.values(PRODUCT_SHIPPING_CHARGE),
      default: PRODUCT_SHIPPING_CHARGE.FREE_SHIPPING,
    },
  }, { _id: false }
);

// define Schema
const productShippingSchema = new Schema<IProductShipping, IProductShippingModel>(
  {
    shop: {
      type: Schema.Types.ObjectId,
      ref: 'Shop',
      required: true,
    },
    product: {
      type: Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
    },
    country: {
      type: String,
      required: true,
    },
    zip: {
      type: String,
      required: true,
    },
    process_time: {
      type: String,
      required: true,
    },
    standard_shipping: {
      type: [reserveSchema],
    },
  },
  {
    timestamps: true,
  }
);

// Plugins
productShippingSchema.plugin(toJSON);

export const ProductShipping: IProductShippingModel = model<IProductShipping, IProductShippingModel>('product_shipping', productShippingSchema);
