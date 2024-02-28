import { Model, FilterQuery } from 'mongoose';
import { z } from 'zod';
import { IProductInventory } from './product';
import { IAddress } from './address';
import { IAdditionInfoItem } from '@/interfaces/models/cart';
import { ICoupon } from '@/interfaces/models/coupon';
import { AtLeastOne, Override } from '@/interfaces/utils';
import { IBaseQueryOptions } from '@/models/plugins/paginate.plugin';
import {
  lineItemSchema,
  productInLineSchema
} from '@/schemas/order.schema';
import { orderSchema } from '@/schemas';

export type IOrder = z.infer<typeof orderSchema>;
export type ILineItemOrder = z.infer<typeof lineItemSchema>;
export type IProductInLineOrder = z.infer<typeof productInLineSchema>;

export interface IOrderModel extends Model<IOrder, unknown> {
  paginate: (filter: FilterQuery<IOrder>, options: IBaseQueryOptions) => Promise<IOrder[]>;
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
  userAddress: IAddress
};

export type CreateOrderForBuyNowBody = Pick<IOrder, 'user' | 'address' | 'payment_type'> & {
  additionInfoItems?: IAdditionInfoItem[]
  inventory: IProductInventory['id'],
  quantity: number,
};

export type CreateOrderFromCartBody = Pick<IOrder, 'user' | 'address' | 'payment_type'> & {
  additionInfoItems?: IAdditionInfoItem[]
};

export type IClearProductsReverseByOrder = Override<IOrder, {
  lines: ILineItemOrder[]
}>;
