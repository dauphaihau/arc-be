import {
  Model,
  FilterQuery
} from 'mongoose';
import { z } from 'zod';
import { IPopulatedShop } from '@/interfaces/models/shop';
import { Override } from '@/interfaces/utils';
import { IBaseQueryOptions } from '@/models/plugins/paginate.plugin';
import { IUser } from '@/interfaces/models/user';
import { couponSchema } from '@/schemas';

export type ICouponSchema = z.infer<typeof couponSchema>;
export type ICoupon = Override<ICouponSchema, {
  shop: IPopulatedShop
}>;

export interface ICouponModel extends Model<ICoupon, unknown> {
  paginate: (filter: FilterQuery<ICoupon>, options: IBaseQueryOptions) => Promise<ICoupon[]>;
}

export type CreateCouponParams = Partial<Pick<ICoupon, 'shop'>>;
export type CreateCouponPayload = Omit<ICoupon, 'id'>;

export type GetCouponsParams = Partial<Pick<ICoupon, 'shop'>>;

export type GetCouponParams = Partial<Pick<ICoupon, 'id'>>;

export type GetCouponByCode = Pick<ICoupon, 'shop' | 'code'>;

export type DeleteCouponParams = Partial<Pick<ICoupon, 'shop' | 'id'>>;

export type UpdateCouponParams = Partial<Pick<ICoupon, 'id' | 'shop'>>;
export type UpdateCouponPayload = Omit<ICoupon, 'id' | 'shop' | 'code' | 'users_used' | 'max_uses_per_user'>;

export type UpdateCouponShopAfterUsed = {
  user: IUser['id']
  shop: IPopulatedShop
  codes: ICoupon['code'][]
};
