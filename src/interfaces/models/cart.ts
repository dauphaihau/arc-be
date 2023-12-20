import { Model } from 'mongoose';
import { z } from 'zod';
import { productCartSchema, cartSchema } from '@/schema';

export type ICart = z.infer<typeof cartSchema>;
export type IProductCart = z.infer<typeof productCartSchema>;

export interface ICartModel extends Model<ICart, unknown> {
}

export type DeleteProductCartBody = Pick<IProductCart, 'product_id'>;

export type UpdateProductCartBody =
  Pick<IProductCart, 'product_id'> &
  Partial<Pick<IProductCart, 'is_select_order' | 'quantity'>>
;
