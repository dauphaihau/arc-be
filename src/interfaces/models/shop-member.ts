import { Model, FilterQuery } from 'mongoose';
import { z } from 'zod';
import { shopMemberSchema } from '@/schemas';
import { IBaseQueryOptions } from '@/models/plugins/paginate.plugin';

export type IShopMember = z.infer<typeof shopMemberSchema>;

export interface IShopMemberModel extends Model<IShopMember, unknown> {
  paginate: (filter: FilterQuery<IShopMember>, options: IBaseQueryOptions) => Promise<IShopMember[]>;
}

export type AddShopMemberParams = Partial<Pick<IShopMember, 'shop'>>;
export type AddShopMemberBody = Pick<IShopMember, 'shop' | 'user' | 'role'>;

export type DeleteShopMemberParams = Partial<Pick<IShopMember, 'shop' | 'user'>>;

export type UpdateShopMemberParams = Partial<Pick<IShopMember, 'shop' | 'user'>>;
export type UpdateShopMemberBody = Pick<IShopMember, 'role'>;

export type GetShopMemberParams = Partial<Pick<IShopMember, 'shop'>>;
export type GetShopMemberQueries = Pick<IShopMember, 'shop'>;
