import { CustomZodInfer } from '@/interfaces/utils';
import { RequestBody, RequestQueryParams } from '@/interfaces/express';
import { authValidation } from '@/validations';
import { IShopDoc } from '@/interfaces/models/shop';
import { IToken } from '@/interfaces/models/token';

type Register = CustomZodInfer<typeof authValidation.register>;
export type RequestRegister = RequestBody<Register['body']>;

type Login = CustomZodInfer<typeof authValidation.login>;
export type RequestLogin = RequestBody<Login['body']>;

export type VerifyCbParams = {
  shop_id: IShopDoc['id']
};

type VerifyToken = CustomZodInfer<typeof authValidation.verifyToken>;
export type RequestVerifyToken = RequestQueryParams<VerifyToken['query']>;

export type VerifyEmailQueryParams = Pick<IToken, 'token'>;
