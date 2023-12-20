import { Model, FilterQuery } from 'mongoose';
import { z } from 'zod';
import { memberSchema } from '@/schema';
import { IBaseQueryOptions } from '@/models/plugins/paginate.plugin';

export type IMember = z.infer<typeof memberSchema>;

export interface IMemberModel extends Model<IMember, unknown> {
  paginate: (filter: FilterQuery<IMember>, options: IBaseQueryOptions) => Promise<IMember[]>;
}

export type AddMemberPayload = Pick<IMember, 'shop_id' | 'user_id' | 'role'>;
export type AddMemberParams = Partial<Pick<IMember, 'shop_id'>>;

export type DeleteMemberParams = Partial<Pick<IMember, 'shop_id' | 'user_id'>>;

export type UpdateMemberParams = Partial<Pick<IMember, 'shop_id' | 'user_id'>>;
export type UpdateMemberPayload = Pick<IMember, 'role'>;

export type GetMemberParams = Partial<Pick<IMember, 'shop_id'>>;
export type GetMemberQueries = Partial<Pick<IMember, 'shop_id'>>;
