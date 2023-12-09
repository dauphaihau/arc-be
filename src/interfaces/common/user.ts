import { IUser } from '../models/user';

export type CreateUserPayload = Pick<IUser, 'email' | 'password'>;

export type UpdateUserPayload = Partial<IUser>;
