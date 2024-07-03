import { Model, FilterQuery, Document } from 'mongoose';
import { z } from 'zod';
import { IProductInventory, IProduct, IProductShipping } from './product';
import { IUserAddress } from './user-address';
import { IShop } from '@/interfaces/models/shop';
import {
  orderShopSchema,
  orderShopProductSchema
} from '@/schemas/order-shop.schema';
import { MARKETPLACE_CURRENCIES } from '@/config/enums/marketplace';
import { IAdditionInfoOrderShop } from '@/interfaces/models/cart';
import { ICoupon } from '@/interfaces/models/coupon';
import { AtLeastOne, Override } from '@/interfaces/utils';
import {
  IBaseQueryOptions,
  IQueryResult
} from '@/models/plugins/paginate.plugin';
import { orderSchema } from '@/schemas';

export type IOrder = z.infer<typeof orderSchema> & Document;
export type IOrderShop = z.infer<typeof orderShopSchema> & Document;
export type IOrderShopProduct = z.infer<typeof orderShopProductSchema>;

export interface IOrderModel extends Model<IOrder, unknown> {
  paginate: (filter: FilterQuery<IOrder>, options: IBaseQueryOptions) => Promise<IOrder[]>;
}

type OrderShopPopulated = Override<IOrderShop, {
  order: Override<IOrder, {
    address: IUserAddress
  }>
  shop: Pick<IShop, 'shop_name'>
  products: Override<IOrderShopProduct, {
    product: Override<IProduct, {
      shipping: IProductShipping
    }>
  }>[]
  estimated_delivery?: Date
  from_countries?: string[]
}>;

export interface IOrderShopModel extends Model<IOrderShop, unknown> {
  paginate: (
    filter: FilterQuery<IOrderShop>,
    options: IBaseQueryOptions
  ) => Promise<IQueryResult<OrderShopPopulated>>;
}

export type IUpdateOrderBody = AtLeastOne<Pick<IOrder, 'status'>>;

export type IGetOrderParams = Partial<Pick<IOrder, 'id'>>;

export type IGetSummaryOrderBody = {
  inventory: IProductInventory['id'],
  quantity: number,
  coupon_codes: ICoupon['code'][]
};

export type IGetCheckoutSessionUrlPayload = {
  newOrder: IOrder,
  orderShops: IOrderShop[] | [],
  userAddress: IUserAddress
  currency: MARKETPLACE_CURRENCIES
};

export type CreateOrderForBuyNowBody = Pick<IOrder, 'user' | 'address' | 'payment_type'> & {
  inventory: IProductInventory['id'],
  quantity: number,
  currency?: MARKETPLACE_CURRENCIES
} & Pick<IOrderShop, 'note' | 'coupon_codes'>;

export type CreateOrderFromCartBody = Pick<IOrder, 'user' | 'address' | 'payment_type'> & {
  additionInfoItems?: IAdditionInfoOrderShop[]
  currency?: MARKETPLACE_CURRENCIES
};
