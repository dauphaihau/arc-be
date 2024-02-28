import {
  Model, ObjectId, FilterQuery
  //  Document, PopulatedDoc
} from 'mongoose';
import { z } from 'zod';
import { shopSchema } from '@/schemas';
import { IBaseQueryOptions } from '@/models/plugins/paginate.plugin';

export type IShop = z.infer<typeof shopSchema>;
// export type IPopulatedShop = PopulatedDoc<Document<ObjectId> & IShop>;

export interface IShopModel extends Model<IShop, unknown> {
  isNameShopTaken: (email: string, excludeUserId?: ObjectId) => Promise<boolean>
  paginate: (filter: FilterQuery<IShop>, options: IBaseQueryOptions) => Promise<IShop[]>;
}

export type CreateShopPayload = Pick<IShop, 'user' | 'shop_name'>;
