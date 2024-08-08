import { Model, Document } from 'mongoose';
import { z } from 'zod';
import { orderProductSchema, orderSchema } from '@/schemas';

export type IOrder = z.infer<typeof orderSchema>;
export type IOrderDoc = IOrder & Omit<Document, 'id'>;

export type IOrderShopProduct = z.infer<typeof orderProductSchema>;

export interface IOrderModel extends Model<IOrderDoc, unknown> {
}
