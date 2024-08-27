import { z } from 'zod';
import {
  RequestParams,
  RequestParamsAndBody
} from '../express';
import { shopCouponValidation } from '@/validations';

type GetDetailCoupon = z.infer<typeof shopCouponValidation.getDetailCoupon>;
export type RequestGetDetailCoupon = RequestParams<GetDetailCoupon['params']>;

type CreateCoupon = z.infer<typeof shopCouponValidation.createCoupon>;
export type RequestCreateCoupon = RequestParamsAndBody<CreateCoupon['params'], CreateCoupon['body']>;

type DeleteCoupon = z.infer<typeof shopCouponValidation.deleteCoupon>;
export type RequestDeleteCoupon = RequestParams<DeleteCoupon['params']>;

type UpdateCoupon = z.infer<typeof shopCouponValidation.updateCoupon>;
export type RequestUpdateCoupon = RequestParamsAndBody<UpdateCoupon['params'], UpdateCoupon['body']>;
