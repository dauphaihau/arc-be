import { IToken } from '../models/token';

type TokenInCookie = Pick<IToken, 'token' | 'expires'>;

export type TokensResponse = Record<'access' | 'refresh', TokenInCookie>;
