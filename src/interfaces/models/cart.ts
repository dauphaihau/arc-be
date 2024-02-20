import { Model } from 'mongoose';
import { z } from 'zod';
import { IProductInventory } from '@/interfaces/models/product';
import { Override } from '@/interfaces/utils';
import { productCartSchema, cartSchema, itemCartSchema } from '@/schemas';
import { IPopulatedShop } from '@/interfaces/models/shop';

interface ITimestamps {
  createdAt: Date
  updatedAt: Date
}

export type ICartSchema = z.infer<typeof cartSchema>;
export type IItemCartSchema = z.infer<typeof itemCartSchema>;
export type IProductCartSchema = z.infer<typeof productCartSchema>;

export type IProductCart = Override<IProductCartSchema, {
  inventory: IProductInventory
}>;

export type IItemCart = Override<IItemCartSchema, {
  shop: IPopulatedShop,
  products: IProductCart[]
}> & ITimestamps;

export type ICart = Override<ICartSchema, {
  items: IItemCart[]
}>;

export interface ICartModel extends Model<ICart, unknown> {}

export type DeleteProductCartQueries = Partial<Pick<IProductCart, 'inventory'>>;

export type UpdateProductCartBody =
  Pick<IProductCart, 'inventory'> &
  Partial<Pick<IProductCart, 'is_select_order' | 'quantity'>>
;

export type IMinusQtyProdCart = {
  shop: IPopulatedShop,
  inventory: IProductInventory['id']
  quantity: number
};
