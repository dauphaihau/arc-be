import {
  Model,
  FilterQuery
} from 'mongoose';
import { z } from 'zod';
import { IBaseQueryOptions } from '@/models/plugins/paginate.plugin';
import { IUser } from '@/interfaces/models/user';
import { couponSchema } from '@/schema';

export type ICoupon = z.infer<typeof couponSchema>;

export interface ICouponModel extends Model<ICoupon, unknown> {
  paginate: (filter: FilterQuery<ICoupon>, options: IBaseQueryOptions) => Promise<ICoupon[]>;
}

export type CreateCouponParams = Partial<Pick<ICoupon, 'shop_id'>>;
export type CreateCouponPayload = Omit<ICoupon, 'id'>;

export type GetCouponsParams = Partial<Pick<ICoupon, 'shop_id'>>;

export type GetCouponParams = Partial<Pick<ICoupon, 'id'>>;

export type GetCouponByCode = Pick<ICoupon, 'shop_id' | 'code'>;

export type DeleteCouponParams = Partial<Pick<ICoupon, 'shop_id' | 'id'>>;

export type UpdateCouponParams = Partial<Pick<ICoupon, 'id' | 'shop_id'>>;
export type UpdateCouponPayload = Omit<ICoupon, 'id' | 'shop_id' | 'code' | 'users_used' | 'max_uses_per_user'>;

export type UpdateCouponShopAfterUsed =
  Pick<ICoupon, 'shop_id' | 'code'>
  & { user_id: IUser['id'] };
