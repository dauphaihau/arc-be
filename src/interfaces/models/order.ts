import { Model, FilterQuery } from 'mongoose';
import { z } from 'zod';
import { IProduct } from './product';
import { IAddress } from './address';
import { AtLeastOne, Override } from '@/interfaces/utils';
import { IBaseQueryOptions } from '@/models/plugins/paginate.plugin';
import {
  lineItemSchema,
  shopCodesSchema,
  productInLineSchema
} from '@/schemas/order.schema';
import { orderSchema } from '@/schemas';

export type IOrder = z.infer<typeof orderSchema>;
export type ILineItemOrder = z.infer<typeof lineItemSchema>;
export type IProductInLineOrder = z.infer<typeof productInLineSchema>;
export type IShopCodes = z.infer<typeof shopCodesSchema>;

export interface IOrderModel extends Model<IOrder, unknown> {
  paginate: (filter: FilterQuery<IOrder>, options: IBaseQueryOptions) => Promise<IOrder[]>;
}

export type IUpdateOrderBody = AtLeastOne<Pick<IOrder, 'status'>>;

export type IGetOrderParams = Partial<Pick<IOrder, 'id'>>;

export type IProductCreateCheckoutSessionStripe = Pick<IProduct, 'id' | 'shop' | 'title'> & {
  image_url: string
};

export type IGetCheckoutSessionUrlPayload = {
  newOrder: IOrder,
  userAddress: IAddress
};

export type CreateOrderBody = Pick<IOrder, 'user' | 'address' | 'payment_type'> & {
  shops_codes?: IShopCodes[]
};

export type IClearProductsReverseByOrder = Override<IOrder, {
  lines: ILineItemOrder[]
}>;
