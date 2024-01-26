import { Model, FilterQuery } from 'mongoose';
import { z } from 'zod';
import { IProduct } from './product';
import { IAddress } from './address';
import { IBaseQueryOptions } from '@/models/plugins/paginate.plugin';
import { lineItemSchema } from '@/schema/order.schema';
import { orderSchema } from '@/schema';

export type IOrder = z.infer<typeof orderSchema>;
export type ILineItemOrder = z.infer<typeof lineItemSchema>;

export interface IOrderModel extends Model<IOrder, unknown> {
  paginate: (filter: FilterQuery<IOrder>, options: IBaseQueryOptions) => Promise<IOrder[]>;
}

type AtLeastOne<T> = { [K in keyof T]: Pick<T, K> }[keyof T];
export type IUpdateOrderBody = AtLeastOne<Pick<IOrder, 'status'>>;

export type IGetOrderParams = Partial<Pick<IOrder, 'id'>>;

// export type IProductCreateCheckoutSessionStripe = Pick<IProduct, 'id' | 'shop_id' | 'title' | 'price' | 'quantity'> & {
export type IProductCreateCheckoutSessionStripe = Pick<IProduct, 'id' | 'shop' | 'title'> & {
  image_url: string
};

export type IGetCheckoutSessionUrlPayload = {
  newOrder: IOrder,
  productsFlattened: IProductCreateCheckoutSessionStripe[] | undefined,
  userAddress: IAddress
};

export type CreateOrderBody =
  Pick<IOrder, 'user_id' | 'address_id' | 'payment_type'> & { cart_items: ILineItemOrder[] };

export type ReviewOrderBody =
  Pick<IOrder, 'user_id'> & {
    cart_items: ILineItemOrder[]
  };


export type IClearProductsReverseByOrder = Omit<IOrder, 'lines'> & {
  lines: ILineItemOrder[]
};
