import { FilterQuery, Document, Model } from 'mongoose';
import { z } from 'zod';
import { IBaseQueryOptions } from '@/models/plugins/paginate.plugin';
import { couponReservationSchema, couponSchema } from '@/schemas';

export type ICoupon = z.infer<typeof couponSchema>;
export type ICouponDoc = ICoupon & Omit<Document, 'id'>;

export type CouponReservation = z.infer<typeof couponReservationSchema>;

export interface ICouponModel extends Model<ICouponDoc, unknown> {
  paginate: (filter: FilterQuery<ICouponDoc>, options: IBaseQueryOptions) => Promise<ICouponDoc[]>;
}
