import { Model, Document } from 'mongoose';
import { z } from 'zod';
import { IOrder } from '@/interfaces/models/order';
import { IProduct } from '@/interfaces/models/product';
import { inventorySchema } from '@/schema';

export type IInventory = z.infer<typeof inventorySchema> & Document;

export interface IInventoryModel extends Model<IInventory, unknown> {
}

export type CreateInventoryPayload = Pick<IInventory, 'shop_id' | 'product_id' | 'stock'>;

export type UpdateInventoryPayload = Pick<IInventory, 'shop_id' | 'product_id' | 'stock'>;

export type ReservationInventoryPayload =
  Pick<IInventory, 'shop_id' | 'product_id'>
  & { quantity: IProduct['quantity'] }
  & { order_id: IOrder['id'] };
