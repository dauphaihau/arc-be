import { ICouponDoc } from '@/interfaces/models/coupon';
import { IOrder, IOrderDoc } from '@/interfaces/models/order';
import { IPayment } from '@/interfaces/models/payment';
import { IProductShipping } from '@/interfaces/models/product';
import { IShop } from '@/interfaces/models/shop';
import { IUser } from '@/interfaces/models/user';
import { IUserAddress, IUserAddressDoc } from '@/interfaces/models/user-address';
import { SummaryOrder, GetCartAggregate } from '@/interfaces/services/cart';

export type GetOrderShopAggregate = {
  shop: Pick<IShop, 'id' | 'shop_name'>
  user_address: Pick<IUserAddressDoc, 'id' | 'country' | 'zip'>
  // payment: Pick<IPayment, 'card_brand' | 'card_last4'>
  // payment: Pick<IPayment, 'type'>
  payment: IPayment
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

export type CreateOrderFromCartPayload = {
  user_id: IUser['id']
  summary_order: SummaryOrder
  user_address_id: IUserAddress['id']
  shop_carts: GetCartAggregate['shop_carts']
};

export type CreateRootOrderBody = Pick<IOrder,
'user' |
'user_address' |
'subtotal' |
'total' |
'total_shipping_fee' |
'total_discount'
>;

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
