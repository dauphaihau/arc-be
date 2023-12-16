import { StatusCodes } from 'http-status-codes';
import { Schema, model } from 'mongoose';
import { MAX_PRODUCT_PRICE } from '@/config/enums/product';
import { ICoupon, ICouponModel } from '@/interfaces/models/coupon';
import { toJSON, paginate } from '@/models/plugins';
import { ApiError } from '@/utils';
import {
  COUPON_TYPES,
  COUPON_APPLIES_TO,
  COUPON_MIN_ORDER_TYPES,
  couponTypes,
  couponMinOrderTypes,
  couponAppliesTo
} from '@/config/enums/coupon';

const couponSchema = new Schema<ICoupon, ICouponModel>(
  {
    shop_id: {
      type: Schema.Types.ObjectId,
      ref: 'Shop',
      required: true,
    },
    code: {
      type: String,
      immutable: true,
      min: 6,
      max: 12,
      required: true,
    },
    title: {
      type: String,
      min: 2,
      max: 50,
      required: true,
    },
    applies_to: {
      type: String,
      enum: couponAppliesTo,
      default: COUPON_APPLIES_TO.ALL,
    },
    applies_product_ids: {
      type: [Schema.Types.ObjectId],
      default: [],
    },
    type: {
      type: String,
      enum: couponTypes,
      required: true,
    },
    amount_off: {
      type: Number,
      default: 0,
      max: 100000000,
      required: function (this: ICoupon) {
        return this.type === COUPON_TYPES.FIXED_AMOUNT;
      },
    },
    percent_off: {
      type: Number,
      default: 0,
      max: 99,
      required: function (this: ICoupon) {
        return this.type === COUPON_TYPES.PERCENTAGE;
      },
    },
    start_date: {
      type: Date,
      required: true,
    },
    end_date: {
      type: Date,
      required: true,
    },
    max_uses: {
      type: Number,
      max: 100000,
      required: true,
    },
    max_uses_per_user: {
      type: Number,
      max: 5,
      immutable: true,
      required: true,
    },
    uses_count: {
      type: Number,
      default: 0,
    },
    users_used: {
      type: [Schema.Types.ObjectId],
      default: [],
    },
    min_order_type: {
      type: String,
      enum: couponMinOrderTypes,
      default: COUPON_MIN_ORDER_TYPES.ORDER_TOTAL,
    },
    min_order_value: {
      type: Number,
      default: 0,
      max: MAX_PRODUCT_PRICE,
      required: function (this: ICoupon) {
        return this.min_order_type === COUPON_MIN_ORDER_TYPES.ORDER_TOTAL;
      },
    },
    min_products: {
      type: Number,
      required: function (this: ICoupon) {
        return this.min_order_type === COUPON_MIN_ORDER_TYPES.NUMBER_OF_PRODUCTS;
      },
    },
    is_active: { type: Boolean, default: true },
  },
  {
    timestamps: true,
  }
);

// Plugins
couponSchema.plugin(toJSON);
couponSchema.plugin(paginate);

// Middlewares
couponSchema.pre('validate', function (next) {
  if (new Date() > new Date(this.end_date)) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'end_date must be large than current date');
  }
  if (this.start_date > this.end_date) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'end_date must be large than start_date');
  }
  if (this.max_uses_per_user > this.max_uses) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'max_uses_per_user must be less than or equal to max_uses');
  }
  next();
});

couponSchema.pre('save', function (next) {
  if (this.applies_to === COUPON_APPLIES_TO.ALL) {
    this.applies_product_ids = [];
  }
  if (this.type === COUPON_TYPES.FIXED_AMOUNT) this.percent_off = 0;
  if (this.type === COUPON_TYPES.PERCENTAGE) this.amount_off = 0;
  if (this.type === COUPON_TYPES.FREE_SHIP) {
    this.percent_off = 0;
    this.amount_off = 0;
  }

  if (this.min_order_type === COUPON_MIN_ORDER_TYPES.ORDER_TOTAL) this.min_products = 0;
  if (this.min_order_type === COUPON_MIN_ORDER_TYPES.NUMBER_OF_PRODUCTS) this.min_order_value = 0;
  next();
});

/**
 * @typedef Coupon
 */
export const Coupon: ICouponModel = model<ICoupon, ICouponModel>('Coupon', couponSchema);
