import { IUser } from '../models/user';

export type LoginPayload = Pick<IUser, 'email' | 'password'>;
