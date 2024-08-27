import { z } from 'zod';
import { Model, FilterQuery, Document } from 'mongoose';
import { userAddressSchema } from '@/schemas';
import { IBaseQueryOptions } from '@/models/plugins/paginate.plugin';

export type IUserAddress = z.infer<typeof userAddressSchema>;
export type IUserAddressDoc = IUserAddress & Omit<Document, 'id'>;

export interface IUserAddressModel extends Model<IUserAddressDoc> {
  paginate: (filter: FilterQuery<IUserAddressDoc>, options: IBaseQueryOptions) => Promise<IUserAddressDoc[]>;
}

export type CreateUserAddressPayload = Omit<IUserAddressDoc, 'id'>;

export type UpdateUserAddressParams = Partial<Pick<IUserAddressDoc, 'id'>>;

export type UpdateUserAddressBody = Partial<Omit<IUserAddressDoc, 'id'>>;

export type GetUserAddressParams = Partial<Pick<IUserAddressDoc, 'id'>>;

export type DeleteUserAddressParams = Partial<Pick<IUserAddressDoc, 'id'>>;
