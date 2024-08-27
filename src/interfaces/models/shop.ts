import {
  Model, ObjectId, FilterQuery
} from 'mongoose';
import { z } from 'zod';
import { RequestBody } from '../express';
import { CustomZodInfer } from '@/interfaces/utils';
import { shopValidation } from '@/validations';
import { shopSchema } from '@/schemas';
import { IBaseQueryOptions } from '@/models/plugins/paginate.plugin';

export type IShop = z.infer<typeof shopSchema>;
export type IShopDoc = IShop & Document;

export interface IShopModel extends Model<IShopDoc, unknown> {
  isNameShopTaken: (email: string, excludeUserId?: ObjectId) => Promise<boolean>
  paginate: (filter: FilterQuery<IShopDoc>, options: IBaseQueryOptions) => Promise<IShopDoc[]>;
}

export type CreateShopBody = Pick<IShopDoc, 'user' | 'shop_name'>;

type CreateShop = CustomZodInfer<typeof shopValidation.createShop>;
export type RequestCreateShop = RequestBody<CreateShop['body']>;
