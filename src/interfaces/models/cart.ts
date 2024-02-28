import { Model } from 'mongoose';
import { z } from 'zod';
import { ILineItemOrder } from '@/interfaces/models/order';
import { IProductInventory, IProduct } from '@/interfaces/models/product';
import { Override } from '@/interfaces/utils';
import { productCartSchema, cartSchema, itemCartSchema } from '@/schemas';
import { IShop } from '@/interfaces/models/shop';


// ------  Base

export type ICart = z.infer<typeof cartSchema>;
export type IItemCart = z.infer<typeof itemCartSchema>;
export type IProductCart = z.infer<typeof productCartSchema>;

export type IAdditionInfoItem = Pick<ILineItemOrder, 'shop' | 'coupon_codes' | 'note'>;

export interface ICartModel extends Model<ICart, unknown> {}


// ------  API Request

export type DeleteProductCartQueries = Partial<Pick<IProductCart, 'inventory'>>;

export type UpdateProductCartBody =
  Pick<IProductCart, 'inventory'> &
  Partial<Pick<IProductCart, 'is_select_order' | 'quantity'>> & {
    additionInfoItems?: IAdditionInfoItem[]
  }
;

export type IMinusQtyProdCart = {
  shop: IShop['id'],
  inventory: IProductInventory['id']
  quantity: number
};

export type IItemCartPopulated = Override<IItemCart, {
  shop: IShop & { _id: IShop['id'] },
  products: Override<IProductCart, {
    inventory: Override<IProductInventory, {
      product: IProduct
    }>
  }>[]
}>;

export type ICartPopulated = Override<ICart, {
  items: IItemCartPopulated[]
}>;
