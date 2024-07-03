import { z } from 'zod';
import {
  Model,
  FilterQuery
} from 'mongoose';
import { userAddressSchema } from '@/schemas';
import { IBaseQueryOptions } from '@/models/plugins/paginate.plugin';

export type IUserAddress = z.infer<typeof userAddressSchema>;

export interface IUserAddressModel extends Model<IUserAddress> {
  paginate: (filter: FilterQuery<IUserAddress>, options: IBaseQueryOptions) => Promise<IUserAddress[]>;
}

export type CreateUserAddressPayload = Omit<IUserAddress, 'id'>;

export type UpdateUserAddressParams = Partial<Pick<IUserAddress, 'id'>>;
export type UpdateUserAddressBody = Partial<Omit<IUserAddress, 'id'>>;

export type GetUserAddressParams = Partial<Pick<IUserAddress, 'id'>>;

export type DeleteUserAddressParams = Partial<Pick<IUserAddress, 'id'>>;
