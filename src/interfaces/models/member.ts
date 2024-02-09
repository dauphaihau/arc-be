import { Model, FilterQuery } from 'mongoose';
import { z } from 'zod';
import { memberSchema } from '@/schemas';
import { IBaseQueryOptions } from '@/models/plugins/paginate.plugin';

export type IMember = z.infer<typeof memberSchema>;

export interface IMemberModel extends Model<IMember, unknown> {
  paginate: (filter: FilterQuery<IMember>, options: IBaseQueryOptions) => Promise<IMember[]>;
}

export type AddMemberPayload = Pick<IMember, 'shop' | 'user' | 'role'>;
export type AddMemberParams = Partial<Pick<IMember, 'shop'>>;

export type DeleteMemberParams = Partial<Pick<IMember, 'shop' | 'user'>>;

export type UpdateMemberParams = Partial<Pick<IMember, 'shop' | 'user'>>;
export type UpdateMemberPayload = Pick<IMember, 'role'>;

export type GetMemberParams = Partial<Pick<IMember, 'shop'>>;
export type GetMemberQueries = Partial<Pick<IMember, 'shop'>>;
