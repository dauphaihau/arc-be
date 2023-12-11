import { Request } from 'express';
import { ParamsDictionary } from 'express-serve-static-core';

export interface IBodyRequest<T> extends Omit<Request, 'body'> {
  body: T;
}

export interface IParamsRequest<T> extends Omit<Request, 'params'> {
  params: T & ParamsDictionary;
}
