import { Model } from 'mongoose';
import { z } from 'zod';
import { productCartSchema, cartSchema, itemCartSchema } from '@/schema';

export type ICart = z.infer<typeof cartSchema>;
export type IProductCart = z.infer<typeof productCartSchema>;
export type IItemCart = z.infer<typeof itemCartSchema>;

export interface ICartModel extends Model<ICart, unknown> {}

export type DeleteProductCartBody = Pick<IProductCart, 'inventory'>;

export type UpdateProductCartBody =
  Pick<IProductCart, 'inventory'> &
  Partial<Pick<IProductCart, 'is_select_order' | 'quantity'>>
;
