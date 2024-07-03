import { Model, Document } from 'mongoose';
import { z } from 'zod';
import { IOrderShop } from '@/interfaces/models/order';
import { IProductInventory, IProduct } from '@/interfaces/models/product';
import { Override } from '@/interfaces/utils';
import { productCartSchema, cartSchema, itemCartSchema } from '@/schemas';
import { IShop } from '@/interfaces/models/shop';

export type ICart = z.infer<typeof cartSchema> & Document;
export type IItemCart = z.infer<typeof itemCartSchema>;
export type IProductCart = z.infer<typeof productCartSchema>;

export type IAdditionInfoOrderShop = Pick<IOrderShop, 'shop' | 'coupon_codes' | 'note'>;

export interface ICartModel extends Model<ICart, unknown> {}

// ------  API Request
export type DeleteProductCartQueries = Pick<IProductCart, 'inventory'>;

export type UpdateProductCartBody =
  Pick<IProductCart, 'inventory'> &
  Partial<Pick<IProductCart, 'is_select_order' | 'quantity'>> & {
    additionInfoItems?: IAdditionInfoOrderShop[]
  }
;

export type IItemCartPopulated = Override<IItemCart, {
  shop: IShop & { _id: IShop['id'] },
  products: Override<IProductCart, {
    product: IProduct['id'],
    inventory: Override<IProductInventory, {
      product: IProduct
    }>
  }>[]
}>;

export type ICartPopulated = Override<ICart, {
  items: IItemCartPopulated[]
}>;
