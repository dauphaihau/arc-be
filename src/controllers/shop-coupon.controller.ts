import { StatusCodes } from 'http-status-codes';
import { zParse } from '@/middlewares/zod-validate.middleware';
import { shopCouponValidation } from '@/validations';
import { couponService } from '@/services';
import {
  RequestCreateCoupon, RequestUpdateCoupon,
  RequestGetDetailCoupon, RequestDeleteCoupon
} from '@/interfaces/request/coupon';
import { ApiError } from '@/utils';
import { catchAsync } from '@/utils/catchAsync';

const createCoupon = catchAsync(async (req: RequestCreateCoupon, res) => {
  const coupon = await couponService.create({
    ...req.body,
    shop: req.params.shop_id,
  });
  res.status(StatusCodes.CREATED).send({ coupon });
});

const getDetailCoupon = catchAsync(async (req: RequestGetDetailCoupon, res) => {
  const coupon = await couponService.getById(req.params.coupon_id);
  if (!coupon) throw new ApiError(StatusCodes.NOT_FOUND);
  res.status(StatusCodes.OK).send({ coupon });
});

const getCouponsByShop = catchAsync(async (req, res) => {
  const { query, params } = await zParse(shopCouponValidation.getCoupons, req);
  const result = await couponService.getList({ ...query, ...params });
  res.send(result);
});

const deleteCoupon = catchAsync(async (req: RequestDeleteCoupon, res) => {
  await couponService.deleteCouponById(req.params.coupon_id);
  res.status(StatusCodes.OK).send({ message: 'deleted successfully' });
});

const updateCoupon = catchAsync(async (req: RequestUpdateCoupon, res) => {
  const coupon = await couponService.updateCoupon(req.params.coupon_id, req.body);
  res.send({ coupon });
});

export const shopCouponController = {
  createCoupon,
  getCouponsByShop,
  getDetailCoupon,
  deleteCoupon,
  updateCoupon,
};
