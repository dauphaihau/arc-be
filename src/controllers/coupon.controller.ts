import { StatusCodes } from 'http-status-codes';
import { log } from '@/config';
import { IShop } from '@/interfaces/models/shop';
import {
  RequestParamsAndQueryParams,
  RequestParamsAndBody, RequestParams
} from '@/interfaces/express';
import {
  ICouponDoc
} from '@/interfaces/models/coupon';
import { couponService } from '@/services';
import { CreateCouponBody, GetCouponsQueries, UpdateCouponBody } from '@/interfaces/request/coupon';
import { catchAsync, pick, ApiError } from '@/utils';

const createCoupon = catchAsync(async (
  req: RequestParamsAndBody<{ shop_id: IShop['id'] }, CreateCouponBody>,
  res
) => {
  if (!req.params.shop_id) throw new ApiError(StatusCodes.BAD_REQUEST);
  const coupon = await couponService.create({
    ...req.body,
    shop: req.params.shop_id,
  });
  res.status(StatusCodes.CREATED).send({ coupon });
});

const getDetailCoupon = catchAsync(async (
  req: RequestParams<{ coupon_id: ICouponDoc['id'] }>,
  res
) => {
  if (!req.params.coupon_id) throw new ApiError(StatusCodes.BAD_REQUEST);
  const coupon = await couponService.getById(req.params.coupon_id);
  if (!coupon) throw new ApiError(StatusCodes.NOT_FOUND);
  res.status(StatusCodes.OK).send({ coupon });
});

const getCouponsByShop = catchAsync(async (
  req: RequestParamsAndQueryParams<{ shop_id: IShop['id'] }, GetCouponsQueries>,
  res
) => {
  if (!req.params.shop_id) throw new ApiError(StatusCodes.BAD_REQUEST);

  const filter = pick(
    {
      ...req.query,
      shop: req.params.shop_id,
    },
    ['shop', 'code', 'is_auto_sale']
  );
  if (req.query?.is_auto_sale) {
    filter.is_auto_sale = req.query.is_auto_sale.toString() === 'true';
  }
  const options = pick(req.query, ['sortBy', 'limit', 'page']);
  log.debug('filter %o', filter);
  const result = await couponService.getList(filter, options);
  res.send(result);
});

const deleteCoupon = catchAsync(async (
  req: RequestParams<{ coupon_id: ICouponDoc['id'] }>,
  res
) => {
  if (!req.params.coupon_id) throw new ApiError(StatusCodes.BAD_REQUEST);
  await couponService.deleteCouponById(req.params.coupon_id);
  res.status(StatusCodes.OK).send({ message: 'deleted successfully' });
});

const updateCoupon = catchAsync(async (
  req: RequestParamsAndBody<{ coupon_id: ICouponDoc['id'] }, UpdateCouponBody>,
  res
) => {
  if (!req.params.coupon_id) throw new ApiError(StatusCodes.BAD_REQUEST);
  const coupon = await couponService.updateCoupon(req.params.coupon_id, req.body);
  res.send({ coupon });
});

export const couponController = {
  createCoupon,
  getCouponsByShop,
  getDetailCoupon,
  deleteCoupon,
  updateCoupon,
};
