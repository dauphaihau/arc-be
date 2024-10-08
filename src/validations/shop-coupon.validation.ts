import { z } from 'zod';
import {
  baseQueryGetListSchema
} from '@/schemas/utils/common-query-params.schema';
import { booleanStringSchema } from '@/schemas/utils/boolean-string.schema';
import {
  COUPON_TYPES,
  COUPON_MIN_ORDER_TYPES,
  COUPON_APPLIES_TO
} from '@/config/enums/coupon';
import {
  couponSchema
} from '@/schemas/coupon.schema';
import { createCouponBodySchema, updateCouponBodySchema } from '@/schemas/request/coupon';
import { objectIdHttpSchema } from '@/schemas/utils/objectId.schema';

export const shopCouponValidation = {
  createCoupon: z.object({
    params: z.object({ shop_id: objectIdHttpSchema }).strict(),
    body: createCouponBodySchema
      .omit({
        shop: true,
      })
      .strict()
      .superRefine((val, ctx) => {
        switch (val.applies_to) {
          case COUPON_APPLIES_TO.ALL:
            if (val?.applies_product_ids) {
              ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: 'unrecognized applies_product_ids',
              });
            }
            break;
          case COUPON_APPLIES_TO.SPECIFIC:
            if (!val?.applies_product_ids) {
              ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: 'required applies_product_ids',
              });
            }
            break;
        }

        switch (val.type) {
          case COUPON_TYPES.FIXED_AMOUNT:
            if (val?.percent_off || !val?.amount_off) {
              ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: val?.percent_off ? 'unrecognized percent_off' : 'required amount_off',
              });
            }
            break;
          case COUPON_TYPES.PERCENTAGE:
            if (val?.amount_off || !val?.percent_off) {
              ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: val?.amount_off ? 'unrecognized amount_off' : 'required percent_off',
              });

            }
            break;
          case COUPON_TYPES.FREE_SHIP:
            if (val?.amount_off || val?.percent_off) {
              ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: 'free_ship not include amount_off, percent_off filed',
                path: ['amount_off, percent_off'],
              });
            }
            break;
        }

        switch (val.min_order_type) {
          case COUPON_MIN_ORDER_TYPES.NUMBER_OF_PRODUCTS:
            if (val?.min_order_value || !val?.min_products) {
              ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: val?.min_order_value ? 'unrecognized min_order_value' : 'required min_products',
              });
            }
            break;
          case COUPON_MIN_ORDER_TYPES.ORDER_TOTAL:
            if (!val?.min_order_value || val?.min_products) {
              ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: val?.min_products ? 'unrecognized min_products' : 'required min_order_value',
              });
            }
            break;
          case COUPON_MIN_ORDER_TYPES.NONE:
            if (val?.min_order_value || val?.min_products) {
              ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: 'min_order_type none not include fields: min_order_value, min_products',
              });
            }
            break;
        }

        if (val.max_uses_per_user > val.max_uses) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'max_uses_per_user must be less than or equal to max_uses',
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
    params: z.object({ shop_id: objectIdHttpSchema }).strict(),
    query: z
      .object({
        code: couponSchema.shape.code,
        is_auto_sale: booleanStringSchema,
      })
      .merge(baseQueryGetListSchema)
      .partial()
      .strict()
    ,
  }),
  getDetailCoupon: z.object({
    params: z.object({
      coupon_id: objectIdHttpSchema,
      shop_id: objectIdHttpSchema,
    }).strict(),
  }),
  deleteCoupon: z.object({
    params: z.object({
      coupon_id: objectIdHttpSchema,
      shop_id: objectIdHttpSchema,
    }).strict(),
  }),
  updateCoupon: z.object({
    params: z.object({
      coupon_id: objectIdHttpSchema,
      shop_id: objectIdHttpSchema,
    }).strict(),
    body: updateCouponBodySchema.omit({
      applies_to: true,
      min_order_type: true,
    })
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
