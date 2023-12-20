import { z } from 'zod';
import {
  Model,
  FilterQuery
} from 'mongoose';
import { addressSchema } from '@/schema';
import { IBaseQueryOptions } from '@/models/plugins/paginate.plugin';

export type IAddress = z.infer<typeof addressSchema>;

export interface IAddressModel extends Model<IAddress> {
  paginate: (filter: FilterQuery<IAddress>, options: IBaseQueryOptions) => Promise<IAddress[]>;
}

export type CreateAddressPayload = Omit<IAddress, 'id'>;

export type UpdateAddressParams = Partial<Pick<IAddress, 'id'>>;
export type UpdateAddressPayload = Partial<Omit<IAddress, 'id'>>;

export type GetAddressParams = Partial<Pick<IAddress, 'id'>>;

export type DeleteAddressParams = Partial<Pick<IAddress, 'id'>>;
