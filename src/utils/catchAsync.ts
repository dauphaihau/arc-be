import { Request, Response, NextFunction } from 'express';

type AsyncRequestHandler<R> = (
  req: R,
  res: Response,
  next: NextFunction,
) => Promise<void>;

export const catchAsync = <R = Request>(fn: AsyncRequestHandler<R>): AsyncRequestHandler<R> =>
  async (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch((err) => next(err));
  };
