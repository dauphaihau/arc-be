import { IUserDoc } from '../models/user';
import { IShop } from '@/interfaces/models/shop';
import { IToken } from '@/interfaces/models/token';

export type LoginBody = Pick<IUserDoc, 'email' | 'password'>;

export type VerifyCbParams = {
  shop_id: IShop['id']
};

export type VerifyTokenQueryParams = Pick<IToken, 'token' | 'type'>;

export type VerifyEmailQueryParams = Pick<IToken, 'token'>;
