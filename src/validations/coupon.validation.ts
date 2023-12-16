import { z } from 'zod';
import { COUPON_TYPES } from '@/config/enums/coupon';
import { couponSchema } from '@/schema/coupon.schema';
import { mixBaseQueryListSchema } from '@/schema/sub/queryList.schema';

export const couponValidation = {
  createCoupon: z.object({
    params: couponSchema.pick({ shop_id: true }),
    body: couponSchema
      .omit({
        id: true,
        shop_id: true,
        users_used: true,
        applies_to: true,
        min_order_type: true,
      })
      .strict()
      .superRefine((val, ctx) => {

        if (val?.amount_off && val?.percent_off) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'only accept one',
            path: ['amount_off, percent_off'],
          });
        }

        if (!val?.type && !val?.amount_off && !val?.percent_off) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'require 1 field',
            path: ['amount_off, percent_off'],
          });
        }

        if (val.type === COUPON_TYPES.FREE_SHIP && (val?.amount_off || val?.percent_off)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'free_ship not include amount_off, percent_off filed',
            path: ['type'],
          });
        }

        if (val?.type && val.type !== COUPON_TYPES.FREE_SHIP) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'only accept free_ship',
            path: ['type'],
          });
        }

        if (val.max_uses_per_user > val.max_uses) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'must be less than or equal to max_uses',
            path: ['max_uses_per_user'],
          });
        }

        if (val?.min_order_value && val?.min_products) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'only accept  one',
            path: ['min_order_value, min_products'],
          });
        }

        if (val.end_date < val.start_date) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'end_date must be large than start_date',
            path: ['date:'],
          });
        }
      }),
  }),
  getCoupons: z.object({
    params: couponSchema.pick({ shop_id: true }),
    query: mixBaseQueryListSchema(
      couponSchema.pick({
        code: true,
      })
    ),
  }),
  getCoupon: z.object({
    params: couponSchema.pick({ shop_id: true, id: true }),
  }),
  deleteCoupon: z.object({
    params: couponSchema
      .pick({ shop_id: true, id: true })
      .strict(),
  }),
  updateCoupon: z.object({
    params: couponSchema.pick({ shop_id: true, id: true }),
    body: couponSchema
      .omit({
        id: true,
        shop_id: true,
        code: true,
        users_used: true,
        max_uses_per_user: true,
        applies_to: true,
        min_order_type: true,
      })
      .partial()
      .strict()
      .superRefine((val, ctx) => {

        if (!Object.keys(val).length) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'must not be null',
            path: [],
          });
        }

        if (val?.amount_off && val?.percent_off) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'only accept one',
            path: ['amount_off, percent_off'],
          });
        }

        if (val.type === COUPON_TYPES.FREE_SHIP && (val?.amount_off || val?.percent_off)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'free_ship not include amount_off, percent_off filed',
            path: ['type'],
          });
        }

        if (val?.type && val.type !== COUPON_TYPES.FREE_SHIP) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'only accept free_ship',
            path: ['type'],
          });
        }

        if (val?.min_order_value && val?.min_products) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'only accept one',
            path: ['min_order_value, min_products'],
          });
        }
      }),
  }),
};
