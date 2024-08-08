import {
  Model,
  FilterQuery,
  Document
} from 'mongoose';
import { z } from 'zod';
import { IBaseQueryOptions } from '@/models/plugins/paginate.plugin';
import {
  couponReservationSchema,
  couponSchema
} from '@/schemas';

// ------- Base
export type ICoupon = z.infer<typeof couponSchema>;
export type ICouponDoc = ICoupon & Document;

export interface ICouponModel extends Model<ICouponDoc, unknown> {
  paginate: (filter: FilterQuery<ICouponDoc>, options: IBaseQueryOptions) => Promise<ICouponDoc[]>;
}

export type CouponReservation = z.infer<typeof couponReservationSchema>;
