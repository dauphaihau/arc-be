import { StatusCodes } from 'http-status-codes';
import { Schema, model } from 'mongoose';
import {
  COUPON_TYPES,
  COUPON_APPLIES_TO,
  COUPON_MIN_ORDER_TYPES,
  COUPON_CONFIG
} from '@/config/enums/coupon';
import { PRODUCT_CONFIG } from '@/config/enums/product';
import {
  ICouponDoc,
  ICouponModel,
  CouponReservation
} from '@/interfaces/models/coupon';
import { toJSON, paginate } from '@/models/plugins';
import { ApiError } from '@/utils';

const reserveSchema = new Schema<CouponReservation>(
  {
    order: {
      type: Schema.Types.ObjectId,
      ref: 'order',
    },
    // quantity: {
    //   type: Number,
    //   default: 0,
    // },
  },
  {
    _id: false,
    timestamps: {
      createdAt: 'created_at',
      updatedAt: false,
    },
  }
);

// define Schema
const couponSchema = new Schema<ICouponDoc, ICouponModel>(
  {
    shop: {
      type: Schema.Types.ObjectId,
      ref: 'Shop',
      required: true,
    },
    code: {
      type: String,
      immutable: true,
      minlength: COUPON_CONFIG.MIN_CHAR_CODE,
      maxlength: COUPON_CONFIG.MAX_CHAR_CODE,
      required: true,
    },
    applies_to: {
      type: String,
      enum: Object.values(COUPON_APPLIES_TO),
      default: COUPON_APPLIES_TO.ALL,
    },
    applies_product_ids: {
      type: [Schema.Types.ObjectId],
      default: [],
    },
    type: {
      type: String,
      enum: Object.values(COUPON_TYPES),
      required: true,
    },
    amount_off: {
      type: Number,
      default: 0,
      max: PRODUCT_CONFIG.MAX_PRICE - 1,
      required: function (this: ICouponDoc) {
        return this.type === COUPON_TYPES.FIXED_AMOUNT;
      },
    },
    percent_off: {
      type: Number,
      default: 0,
      max: COUPON_CONFIG.MAX_PERCENTAGE_OFF,
      required: function (this: ICouponDoc) {
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
      max: COUPON_CONFIG.MAX_USES,
      required: true,
    },
    max_uses_per_user: {
      type: Number,
      max: COUPON_CONFIG.MAX_USES_PER_USER,
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
      enum: Object.values(COUPON_MIN_ORDER_TYPES),
      default: COUPON_MIN_ORDER_TYPES.NONE,
    },
    min_order_value: {
      type: Number,
      default: 0,
      // max: PRODUCT_CONFIG.MAX_PRICE,
      required: function (this: ICouponDoc) {
        return this.min_order_type === COUPON_MIN_ORDER_TYPES.ORDER_TOTAL;
      },
    },
    min_products: {
      type: Number,
      default: 0,
      required: function (this: ICouponDoc) {
        return this.min_order_type === COUPON_MIN_ORDER_TYPES.NUMBER_OF_PRODUCTS;
      },
    },
    is_active: {
      type: Boolean,
      default: true,
    },
    is_auto_sale: {
      type: Boolean,
      default: false,
    },
    reservations: {
      type: [reserveSchema],
      default: [],
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

export const Coupon: ICouponModel = model<ICouponDoc, ICouponModel>('Coupon', couponSchema);
