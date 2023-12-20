import { z } from 'zod';
import { Model, ObjectId, Document } from 'mongoose';
import { userSchema } from '@/schema';

export interface IUserMethods {
  isPasswordMatch: (password: string) => Promise<boolean>;
}

interface IUserStatics {
  isEmailTaken: (email: string, excludeUserId?: ObjectId) => Promise<boolean>;
}

export type IUser = z.infer<typeof userSchema> & Document & IUserMethods;

export interface IUserModel extends Model<IUser, unknown, IUserMethods>, IUserStatics {}

export type CreateUserPayload = Pick<IUser, 'email' | 'password'>;

export type UpdateUserPayload = Partial<IUser>;
