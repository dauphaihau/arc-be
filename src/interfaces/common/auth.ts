import { IUser } from '../models/user';
import { IToken } from '@/interfaces/models/token';
import { IShopMember } from '@/interfaces/models/shop-member';

export type LoginPayload = Pick<IUser, 'email' | 'password'>;

export type VerifyCbParams = Pick<IShopMember, 'shop'>;

export type VerifyTokenQueries = Pick<IToken, 'token' | 'type'>;

export type VerifyEmailQueries = Pick<IToken, 'token'>;
