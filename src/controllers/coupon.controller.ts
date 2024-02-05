import { StatusCodes } from 'http-status-codes';
import { Request } from 'express';
import {
  CreateCouponParams,
  CreateCouponPayload,
  DeleteCouponParams, GetCouponsParams, GetCouponParams, UpdateCouponParams,
  UpdateCouponPayload
} from '@/interfaces/models/coupon';
import { couponService } from '@/services';
import { catchAsync, pick } from '@/utils';
import { IPopulatedShop } from '@/interfaces/models/shop';

const createCoupon = catchAsync(async (
  req: Request<CreateCouponParams, unknown, CreateCouponPayload>,
  res
) => {

  const coupon = await couponService.createCoupon({
    ...req.body,
    shop: req.params.shop as IPopulatedShop,
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
  req: Request<GetCouponsParams>,
  res
) => {
  const filter = pick(
    {
      ...req.query,
      shop: req.params.shop,
    },
    ['shop', 'code']
  );
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
  req: Request<UpdateCouponParams, unknown, UpdateCouponPayload>,
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
