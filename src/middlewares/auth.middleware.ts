import { Request, RequestHandler } from 'express';
import passport, { AuthenticateCallback } from 'passport';
import { StatusCodes } from 'http-status-codes';
import { ApiError } from '@/utils/ApiError';

const verifyCallback = (
  req: Request,
  resolve: (reason?: never) => void,
  reject: (reason?: unknown) => void): AuthenticateCallback => {
  return async (err, user, info) => {
    if (err || info || !user) {
      return reject(new ApiError(StatusCodes.UNAUTHORIZED, 'Please authenticate'));
    }
    req.user = user;
    resolve();
  };
};

export const auth = (): RequestHandler => {
  return async (req, res, next) => {
    return new Promise((resolve, reject) => {
      passport.authenticate(
        'jwt',
        { session: false },
        verifyCallback(req, resolve, reject)
      )(req, res, next);
    })
      .then(() => setImmediate(() => next()))
      .catch((err) => setImmediate(() => next(err)));
  };
};
