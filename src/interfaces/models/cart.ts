import { Model, Document } from 'mongoose';
import { z } from 'zod';
import { productCartSchema, cartSchema, shopCartSchema } from '@/schemas';

export type ICart = z.infer<typeof cartSchema>;
export type ICartDoc = ICart & Omit<Document, 'id'>;

export type IShopCart = z.infer<typeof shopCartSchema>;
export type IProductCart = z.infer<typeof productCartSchema>;

export interface ICartModel extends Model<ICartDoc, unknown> {}
