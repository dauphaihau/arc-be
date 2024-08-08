import { z } from 'zod';
import { Model, Document } from 'mongoose';
import { userSchema } from '@/schemas';

export interface IUserMethods {
  isPasswordMatch: (password: string) => Promise<boolean>;
}

export type IUser = z.infer<typeof userSchema>;

export type IUserDoc = IUser & Omit<Document, 'id'> & IUserMethods;

interface IUserStatics {
  isEmailTaken: (email: string, excludeUserId?: IUserDoc['id']) => Promise<boolean>;
}

export interface IUserModel extends Model<IUserDoc, unknown, IUserMethods>, IUserStatics {}

export type CreateUserBody = Pick<IUserDoc, 'email' | 'password'>;

export type UpdateUserBody = Partial<IUserDoc>;
