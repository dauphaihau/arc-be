import {
  Model
} from 'mongoose';
import { z } from 'zod';
import { IProductInventory } from '@/interfaces/models/product';
import { Override } from '@/interfaces/utils';
import { productCartSchema, cartSchema, itemCartSchema } from '@/schema';
import { IPopulatedShop } from '@/interfaces/models/shop';

export type ICartSchema = z.infer<typeof cartSchema>;
export type IItemCartSchema = z.infer<typeof itemCartSchema>;
export type IProductCartSchema = z.infer<typeof productCartSchema>;

export type IProductCart = Override<IProductCartSchema, {
  inventory: IProductInventory
}>;

export type IItemCart = Override<IItemCartSchema, {
  shop: IPopulatedShop,
  products: IProductCart[]
}>;

export type ICart = Override<ICartSchema, {
  items: IItemCart[]
}>;

export interface ICartModel extends Model<ICart, unknown> {}

export type DeleteProductCartBody = Pick<IProductCart, 'inventory'>;

export type UpdateProductCartBody =
  Pick<IProductCart, 'inventory'> &
  Partial<Pick<IProductCart, 'is_select_order' | 'quantity'>>
;

export type IMinusQtyProdCart = {
  shop: IPopulatedShop,
  inventory: IProductInventory['id']
  quantity: number
};
