import {
  IBasePayment,
  IPaymentCard,
  IPaymentCash
} from '@/interfaces/models/payment';
import { ICouponDoc } from '@/interfaces/models/coupon';
import { IOrder, IOrderDoc } from '@/interfaces/models/order';
import { IProductShipping } from '@/interfaces/models/product';
import { IShopDoc } from '@/interfaces/models/shop';
import { IUserAddressDoc } from '@/interfaces/models/user-address';
import { GetCartAggregate } from '@/interfaces/services/cart';

//region get order shops
type GetOrderShopAggregate_Payment = Pick<IBasePayment, 'type'> & (
  Pick<IPaymentCard, 'type' | 'card_brand' | 'card_last4' | 'card_funding' > | IPaymentCash
);

export type GetOrderShopAggregate = {
  shop: Pick<IShopDoc, 'id' | 'shop_name'>
  user_address: Pick<IUserAddressDoc, 'id' | 'country' | 'zip'>
  payment: GetOrderShopAggregate_Payment
  product_shipping_docs: Pick<IProductShipping, 'country' | 'zip' | 'process_time' | 'standard_shipping'>[]
  promo_codes: Pick<ICouponDoc, 'id' | 'code'>[]
} & Pick<IOrder,
'subtotal' |
'total' |
'total_shipping_fee' |
'total_discount' |
'note' |
'shipping_status' |
'created_at' |
'updated_at'
>;
//endregion

//region create order shops
export type CreateOrderShopsPayload = {
  root_order: IOrderDoc
  shop_carts: GetCartAggregate['shop_carts']
};

export type CreateOrderShopBody = Pick<IOrder,
'parent' |
'user' |
'shop' |
'user_address' |
'products' |
'shipping_status' |
'note' |
'promo_coupons' |
'subtotal' |
'total' |
'total_shipping_fee' |
'total_discount'
>;
//endregion

export type CreateRootOrderBody = Pick<IOrder,
'user' |
'user_address' |
'subtotal' |
'total' |
'total_shipping_fee' |
'total_discount'
>;
