import {
  Model,
  FilterQuery,
  Schema, QueryOptions
} from 'mongoose';
import { z } from 'zod';
import { couponSchema } from '@/schema';

export type ICoupon = z.infer<typeof couponSchema>;

export interface ICouponModel extends Model<ICoupon, unknown> {
  paginate: (filter: FilterQuery<Schema>, options: QueryOptions<Schema>) => Promise<boolean>;
}

export type CreateCouponParams = Partial<Pick<ICoupon, 'shop_id'>>;
export type CreateCouponPayload = Omit<ICoupon, 'id'>;

export type GetCouponsParams = Partial<Pick<ICoupon, 'shop_id'>>;

export type GetCouponParams = Partial<Pick<ICoupon, 'id'>>;

export type GetCouponByCode = Pick<ICoupon, 'shop_id' | 'code'>;

export type DeleteCouponParams = Partial<Pick<ICoupon, 'shop_id' | 'id'>>;

export type UpdateCouponParams = Partial<Pick<ICoupon, 'id' | 'shop_id'>>;
export type UpdateCouponPayload = Omit<ICoupon, 'id' | 'shop_id' | 'code' | 'users_used' | 'max_uses_per_user'>;
