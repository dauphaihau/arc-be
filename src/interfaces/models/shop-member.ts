import { Model, FilterQuery, Document } from 'mongoose';
import { z } from 'zod';
import { IShopDoc } from '@/interfaces/models/shop';
import { IUser } from '@/interfaces/models/user';
import { shopMemberSchema } from '@/schemas';
import { IBaseQueryOptions } from '@/models/plugins/paginate.plugin';

export type IShopMember = z.infer<typeof shopMemberSchema> & Document;

export interface IShopMemberModel extends Model<IShopMember, unknown> {
  paginate: (filter: FilterQuery<IShopMember>, options: IBaseQueryOptions) => Promise<IShopMember[]>;
}

export type AddShopMemberParams = Partial<Pick<IShopMember, 'shop'>>;
export type AddShopMemberBody = Pick<IShopMember, 'shop' | 'user' | 'role'>;

export type DeleteShopMemberParams = {
  shop_id: IShopDoc['id']
  user_id: IUser['id']
};

export type UpdateShopMemberParams = {
  shop_id: IShopDoc['id']
  user_id: IUser['id']
};

export type UpdateShopMemberBody = Pick<IShopMember, 'role'>;

export type GetShopMemberParams = Partial<Pick<IShopMember, 'shop'>>;
export type GetShopMemberQueries = IBaseQueryOptions & Pick<IShopMember, 'shop'> ;
