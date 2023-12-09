import { Model, ObjectId, Document } from 'mongoose';

export interface IUser extends Partial<Document> {
  name: string;
  email: string;
  password: string;
  is_email_verified: boolean;
}

export interface IUserMethods {
  isPasswordMatch: (password: string) => Promise<boolean>;
}

export interface IUserModel extends Model<IUser, unknown, IUserMethods> {
  isEmailTaken: (email: string, excludeUserId?: ObjectId) => Promise<boolean>;
}
