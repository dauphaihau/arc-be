import { Model } from 'mongoose';
import { z } from 'zod';
import { productCartSchema, cartSchema } from '@/schema';

export type ICart = z.infer<typeof cartSchema>;
export type IProductCart = z.infer<typeof productCartSchema>;

export interface ICartModel extends Model<ICart, unknown> {
}

export type DeleteProductCartBody = Pick<IProductCart, 'product_id'>;
