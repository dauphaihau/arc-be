import { Request } from 'express';

export interface IBodyRequest<T> extends Omit<Request, 'body'> {
  body: T;
}
