import { IUser } from '../models/user';
import { IMember } from '@/interfaces/models/member';

export type LoginPayload = Pick<IUser, 'email' | 'password'>;

export type VerifyCbParams = Pick<IMember, 'shop_id'>;
