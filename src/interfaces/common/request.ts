import { Request } from 'express';
import { ParamsDictionary } from 'express-serve-static-core';

export interface RequestBody<T> extends Omit<Request, 'body'> {
  body: T;
}

export interface RequestQuery<T> extends Omit<Request, 'query'> {
  query: Partial<T>
}

export interface RequestParamsBody<P, B> extends Omit<Request, 'params' | 'body'> {
  params: P & ParamsDictionary;
  body: B;
}

export interface RequestParamsQuery<P, Q> extends Omit<Request, 'params' | 'query'> {
  params: P & ParamsDictionary;
  query: Partial<Q>;
}

export interface RequestParams<T> extends Omit<Request, 'params'> {
  params: T & ParamsDictionary;
}

export type BaseQueryParamsGetList = Record<
'sortBy'| 'limit'| 'page'| 'populate'| 'select'
, string>;
