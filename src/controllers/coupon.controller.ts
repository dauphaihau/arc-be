import { StatusCodes } from 'http-status-codes';
import { Request } from 'express';
import {
  RequestParamsQuery,
  RequestParamsBody
} from '@/interfaces/common/request';
import {
  CreateCouponParams,
  CreateCouponBody,
  DeleteCouponParams, GetCouponsQueries, GetCouponParams, UpdateCouponParams,
  GetCouponsParams,
  UpdateCouponBody
} from '@/interfaces/models/coupon';
import { couponService } from '@/services';
import { catchAsync, pick } from '@/utils';

const createCoupon = catchAsync(async (
  req: RequestParamsBody<CreateCouponParams, CreateCouponBody>,
  res
) => {

  const coupon = await couponService.create({
    ...req.body,
    shop: req.params.shop as string,
  });
  res.status(StatusCodes.CREATED).send({ coupon });
});

const getCoupon = catchAsync(async (
  req: Request<GetCouponParams>,
  res
) => {
  const coupon = await couponService.getCouponById(req.params.id as string);
  res.status(StatusCodes.OK).send({ coupon });
});

const getCouponsByShop = catchAsync(async (
  req: RequestParamsQuery<GetCouponsParams, GetCouponsQueries>,
  res
) => {

  const filter = pick(
    {
      ...req.query,
      shop: req.params.shop,
    },
    ['shop', 'code']
  );
  if (req.query?.is_auto_sale) {
    filter['is_auto_sale'] = req.query.is_auto_sale.toString() === 'true';
  }
  const options = pick(req.query, ['sortBy', 'limit', 'page']);
  const result = await couponService.queryCoupons(filter, options);
  res.send(result);
});

const deleteCoupon = catchAsync(async (
  req: Request<DeleteCouponParams>,
  res
) => {
  await couponService.deleteCouponById(req.params.id as string);
  res.status(StatusCodes.OK).send({ message: 'deleted successfully' });
});

const updateCoupon = catchAsync(async (
  req: RequestParamsBody<UpdateCouponParams, UpdateCouponBody>,
  res
) => {
  const coupon_id = req.params.id as string;
  const coupon = await couponService.updateCoupon(coupon_id, req.body);
  res.send({ coupon });
});

export const couponController = {
  createCoupon,
  getCouponsByShop,
  getCoupon,
  deleteCoupon,
  updateCoupon,
};
