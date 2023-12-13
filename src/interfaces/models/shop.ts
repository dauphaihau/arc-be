import { Model, ObjectId, Document } from 'mongoose';
import { z } from 'zod';
import { shopSchema } from '@/interfaces/schema/shop.schema';

export type IShop = z.infer<typeof shopSchema> & Document;

export interface IShopModel extends Model<IShop, unknown> {
  isNameShopTaken: (email: string, excludeUserId?: ObjectId) => Promise<boolean>;
}

export type CreateShopPayload = Pick<IShop, 'user_id' | 'shop_name'>;
