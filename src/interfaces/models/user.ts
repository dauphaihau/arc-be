import { z } from 'zod';
import { Model, ObjectId, Document } from 'mongoose';
import { userSchema } from '@/interfaces/schema/user';

export interface IUserMethods {
  isPasswordMatch: (password: string) => Promise<boolean>;
}

export type IUser = z.infer<typeof userSchema> & Document & IUserMethods;

export interface IUserModel extends Model<IUser, unknown, IUserMethods> {
  isEmailTaken: (email: string, excludeUserId?: ObjectId) => Promise<boolean>;
}

export type CreateUserPayload = Pick<IUser, 'email' | 'password'>;

export type UpdateUserPayload = Partial<IUser>;
