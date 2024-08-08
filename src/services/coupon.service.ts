import { StatusCodes } from 'http-status-codes';
import mongoose, { ClientSession } from 'mongoose';
import { IOrderDoc } from '@/interfaces/models/order';
import { IUserDoc } from '@/interfaces/models/user';
import { GetSaleCouponByShopIdsAggregate } from '@/interfaces/services/coupon';
import { IShop } from '@/interfaces/models/shop';
import {
  COUPON_TYPES,
  COUPON_MIN_ORDER_TYPES,
  COUPON_APPLIES_TO
} from '@/config/enums/coupon';
import {
  ICoupon,
  ICouponDoc,
  ICouponModel
} from '@/interfaces/models/coupon';
import { Product } from '@/models';
import { Coupon } from '@/models/coupon.model';
import { productService } from '@/services/product.service';
import { ApiError } from '@/utils';
import { CreateCouponBody, GetCouponByCode, UpdateCouponBody } from '@/interfaces/request/coupon';

const getById = async (id: ICoupon['id']) => {
  return Coupon.findById(id);
};

const getCouponByCode = async (filter: GetCouponByCode) => {
  return Coupon.findOne(filter);
};

const create = async (createBody: CreateCouponBody) => {
  const {
    shop,
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

const getList: ICouponModel['paginate'] = async (filter, options) => {
  return Coupon.paginate(filter, options);
};

const deleteCouponById = async (id: ICouponDoc['id']) => {
  const coupon = await getById(id);
  if (!coupon) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Coupon not found');
  }
  coupon.remove();
};

const updateCoupon = async (
  couponId: ICouponDoc['id'],
  updateBody: UpdateCouponBody
) => {
  const coupon = await getById(couponId);
  if (!coupon) throw new ApiError(StatusCodes.NOT_FOUND, 'Coupon not found');

  // coupon is active
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

const getSaleCouponByShopIds = async (shopIds: IShop['id'][]) => {
  const shopCoupons = await Coupon.aggregate<GetSaleCouponByShopIdsAggregate>([
    {
      $match: {
        shop: {
          $in: shopIds.map(id => new mongoose.Types.ObjectId(id)),
        },
        is_auto_sale: true,
        is_active: true,
        $or: [
          { type : COUPON_TYPES.PERCENTAGE },
          { type : COUPON_TYPES.FREE_SHIP },
        ],
        start_date: {
          $lt: new Date(),
        },
        end_date: {
          $gt: new Date(),
        },
        // debug
        // type : COUPON_TYPES.FREE_SHIP,
      },
    },
    {
      $addFields: {
        id: {
          $toString: '$_id',
        },
      },
    },
    {
      $group: {
        _id: '$shop',
        coupons: { $push: '$$ROOT' },
      },
    },
    {
      $sort: {
        percent_off: -1,
      },
    },
    {
      $project: {
        _id: 1,
        coupons: {
          id: 1,
          type: 1,
          applies_product_ids: 1,
          applies_to: 1,
          percent_off: 1,
          start_date: 1,
          end_date: 1,
        },
      },
    },
  ]);
  // log.debug('sale coupons aggregate %o', shopCoupons);
  return shopCoupons;
};

const reserveQuantity = async (
  payload: { coupon_id: ICouponDoc['id']; order_id: IOrderDoc['id'], user_id: IUserDoc['id'] },
  session: ClientSession
) => {
  const { coupon_id, order_id, user_id } = payload;

  const filter = {
    _id: new mongoose.Types.ObjectId(coupon_id),
  };
  const update = {
    $inc: {
      uses_count: 1,
    },
    $push: {
      reservations: {
        order: order_id,
      },
      users_used: user_id,
    },
  };
  const options = { upsert: false, new: true, session };

  return Coupon.updateOne(filter, update, options);
};

const clearCouponsReversedByOrder = async (
  order: IOrderDoc,
  // orderShops: IOrderShopDoc[],
  orderShops: IOrderDoc[],
  session: ClientSession
) => {
  const promises: unknown[] = [];

  orderShops.forEach((orderShop) => {
    orderShop.products.forEach((prod) => {

      if (prod.percent_coupon) {
        promises.push(
          Coupon.findOneAndUpdate(
            { _id: prod.percent_coupon },
            {
              $pull: {
                reservations: { order: order.id },
              },
            },
            { session }
          )
        );
      }

      if (prod.freeship_coupon) {
        promises.push(
          Coupon.findOneAndUpdate(
            { _id: prod.freeship_coupon },
            {
              $pull: {
                reservations: { order: order.id },
              },
            },
            { session }
          )
        );
      }

    });
    if (orderShop.promo_coupons) {
      orderShop.promo_coupons.forEach((couponId) => {
        promises.push(
          Coupon.findOneAndUpdate(
            { _id: couponId },
            {
              $pull: {
                reservations: { order: order.id },
              },
            },
            { session }
          )
        );
      });
    }
  });

  const results = await Promise.allSettled(promises);
  results.forEach(rel => {
    if (rel.status === 'rejected') {
      throw new ApiError(
        StatusCodes.INTERNAL_SERVER_ERROR, 'error clear coupon reserved'
      );
    }
  });
};

export const couponService = {
  create,
  getList,
  deleteCouponById,
  getById,
  getCouponByCode,
  updateCoupon,
  getSaleCouponByShopIds,
  reserveQuantity,
  clearCouponsReversedByOrder,
};
