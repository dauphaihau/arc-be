import { StatusCodes } from 'http-status-codes';
import { ClientSession } from 'mongoose';
import { Product } from '@/models';
import {
  COUPON_TYPES,
  COUPON_MIN_ORDER_TYPES,
  COUPON_APPLIES_TO
} from '@/config/enums/coupon';
import {
  CreateCouponPayload,
  ICoupon,
  GetCouponByCode,
  UpdateCouponPayload, UpdateCouponShopAfterUsed, ICouponModel
} from '@/interfaces/models/coupon';
import { productService } from '@/services/product.service';
import { Coupon } from '@/models/coupon.model';
import { ApiError } from '@/utils';

const getCouponById = async (id: ICoupon['id']) => {
  return Coupon.findById(id);
};

const getCouponByCode = async (filter: GetCouponByCode) => {
  return Coupon.findOne(filter);
};

const createCoupon = async (createBody: CreateCouponPayload) => {
  const {
    shop,
    title,
    code,
    type,
    amount_off,
    percent_off,
    min_order_type,
    min_order_value,
    min_products,
    applies_product_ids = [],
    max_uses,
    max_uses_per_user,
    start_date,
    end_date,
    applies_to,
    is_active,
  } = createBody;

  const couponExist = await getCouponByCode({ shop, code });
  if (couponExist && couponExist.is_active) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Duplicate code');
  }

  if (Array.isArray(createBody.applies_product_ids) && createBody.applies_product_ids.length > 0) {
    const products = await Product.find({
      _id: {
        $in: applies_product_ids,
      },
    });
    if (!products || products.length !== applies_product_ids.length) {
      throw new ApiError(StatusCodes.NOT_FOUND, 'applies_product_ids is invalid');
    }
  }

  return Coupon.create({
    shop,
    code,
    title,
    type,
    percent_off,
    amount_off,
    min_order_type,
    min_products,
    min_order_value,
    max_uses,
    max_uses_per_user,
    is_active,
    applies_to,
    applies_product_ids,
    start_date: new Date(start_date),
    end_date: new Date(end_date),
  });
};

/**
 * Query for coupons
 * @param filter - Mongo filter
 * @param options - Query options
 * @param [options.sortBy] - Sort option in the format: sortField:(desc|asc)
 * @param [options.limit] - Maximum number of results per page (default = 10)
 * @param [options.page] - Current page (default = 1)
 * @returns {Promise<QueryResult>}
 */

const queryCoupons: ICouponModel['paginate'] = async (filter, options) => {
  const coupons = await Coupon.paginate(filter, options);
  return coupons;
};

const deleteCouponById = async (id: ICoupon['id']) => {
  const coupon = await getCouponById(id);
  if (!coupon) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Coupon not found');
  }
  coupon.remove();
};

const updateCoupon = async (
  couponId: ICoupon['id'],
  updateBody: UpdateCouponPayload
) => {
  const coupon = await getCouponById(couponId);
  if (!coupon) throw new ApiError(StatusCodes.NOT_FOUND, 'Coupon not found');

  // coupon started
  if (
    coupon.start_date <= new Date() &&
    (Object.keys(updateBody).length !== 1 || !updateBody?.end_date)
  ) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Coupon has started so only end_date can update');
  }

  if (Array.isArray(updateBody.applies_product_ids) && updateBody.applies_product_ids.length > 0) {
    updateBody.applies_to = COUPON_APPLIES_TO.SPECIFIC;
    for (const product_id of updateBody.applies_product_ids) {
      const productExist = await productService.getProductById(product_id as string);
      if (!productExist) {
        throw new ApiError(StatusCodes.NOT_FOUND, `product_id ${product_id} not found`);
      }
    }
  }
  if (updateBody?.amount_off) {
    updateBody.type = COUPON_TYPES.FIXED_AMOUNT;
  }
  if (updateBody?.percent_off) {
    updateBody.type = COUPON_TYPES.PERCENTAGE;
  }
  if (updateBody?.min_order_value) {
    updateBody.min_order_type = COUPON_MIN_ORDER_TYPES.ORDER_TOTAL;
  }
  if (updateBody?.min_products) {
    updateBody.min_order_type = COUPON_MIN_ORDER_TYPES.NUMBER_OF_PRODUCTS;
  }

  Object.assign(coupon, updateBody);
  await coupon.save();
  return coupon;
};

const updateCouponsShopAfterUsed = async (
  { shop, user, codes }: UpdateCouponShopAfterUsed,
  session: ClientSession
) => {
  const filter = {
    shop,
    code: { $in: codes },
  };
  const update = {
    $set: { users_used: user },
    $inc: { uses_count: 1 },
  };
  const options = { upsert: false, session };
  await Coupon.updateMany(filter, update, options);
};

export const couponService = {
  createCoupon,
  queryCoupons,
  deleteCouponById,
  getCouponById,
  getCouponByCode,
  updateCoupon,
  updateCouponsShopAfterUsed,
};
