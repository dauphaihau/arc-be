import { IUser } from '../models/user';

export type CreateUserBody = Pick<IUser, 'name' | 'email' | 'password' | 'market_preferences'>;

export type UpdateUserBody = Partial<IUser>;
