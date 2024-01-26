import { IUser } from '../models/user';
import { IToken } from '@/interfaces/models/token';
import { IMember } from '@/interfaces/models/member';

export type LoginPayload = Pick<IUser, 'email' | 'password'>;

export type VerifyCbParams = Pick<IMember, 'shop'>;

export type VerifyTokenQueries = Partial<Pick<IToken, 'token' | 'type'>>;

export type VerifyEmailQueries = Partial<Pick<IToken, 'token'>>;
