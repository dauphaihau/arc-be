import { z } from 'zod';
import { IBaseQueryOptions } from '@/models/plugins/paginate.plugin';
import { ICoupon } from '@/interfaces/models/coupon';
import {
  createCouponBodySchema,
  updateCouponBodySchema
} from '@/schemas/request/coupon';

export type CreateCouponBody = z.infer<typeof createCouponBodySchema>;

export type UpdateCouponBody = z.infer<typeof updateCouponBodySchema>;

export type GetCouponByCode = Pick<ICoupon, 'shop' | 'code'>;

export type GetCouponsQueries = IBaseQueryOptions & Pick<ICoupon, 'is_auto_sale' | 'code'>;
