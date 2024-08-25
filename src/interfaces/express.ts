import { Request } from 'express';
import { ParamsDictionary, Send } from 'express-serve-static-core';

export interface RequestParams<T> extends Omit<Request, 'params'> {
  params: T & ParamsDictionary
}

export interface RequestBody<T> extends Omit<Request, 'body'> {
  body: T;
}

export interface RequestQueryParams<T> extends Omit<Request, 'query'> {
  query: T
}

export interface RequestParamsAndBody<P, B> extends Omit<Request, 'params' | 'body'> {
  params: P & ParamsDictionary
  body: B;
}

export interface RequestParamsAndQueryParams<P, Q> extends Omit<Request, 'params' | 'query'> {
  params: P & ParamsDictionary;
  query: Partial<Q>;
}

export interface ResponseCustom<ResBody> extends Express.Response {
  json: Send<ResBody, this>;
}
