import { z } from 'zod';
import { ICoupon, ICouponDoc } from '@/interfaces/models/coupon';
import { IShopDoc } from '@/interfaces/models/shop';
import { BaseQueryGetList } from '@/interfaces/request/common-query-params';
import {
  createCouponBodySchema,
  updateCouponBodySchema
} from '@/schemas/request/coupon';

export type CreateCouponBody = z.infer<typeof createCouponBodySchema>;

export type UpdateCouponBody = z.infer<typeof updateCouponBodySchema>;

export type GetSaleCouponByShopIdsAggregate = {
  _id: IShopDoc['id']
  coupons: Pick<ICouponDoc, 'id' | 'type' | 'applies_to' | 'applies_product_ids' | 'percent_off' | 'start_date' | 'end_date'>[]
};

export type GetListCouponsPayload = Partial<{
  shop_id: IShopDoc['id']
  code: ICoupon['code']
  is_auto_sale: ICoupon['is_auto_sale']
} & Pick<BaseQueryGetList, 'page' | 'limit'>>;
