import { ICouponDoc } from '@/interfaces/models/coupon';
import { IShop } from '@/interfaces/models/shop';

export type GetSaleCouponByShopIdsAggregate = {
  _id: IShop['id']
  coupons: Pick<ICouponDoc, 'id' | 'type' | 'applies_to' | 'applies_product_ids' | 'percent_off' | 'start_date' | 'end_date'>[]
};
