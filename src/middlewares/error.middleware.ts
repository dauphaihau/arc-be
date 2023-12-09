import { NextFunction, Request, Response } from 'express';
import mongoose from 'mongoose';
import { StatusCodes, ReasonPhrases, getReasonPhrase } from 'http-status-codes';
import { log, env } from '@/config';
import { ApiError } from '@/utils/ApiError';

export const errorConverter = (
  err: ApiError,
  _req: Request,
  _res: Response,
  next: NextFunction
) => {
  let error = err;
  if (!(error instanceof ApiError)) {
    const statusCode =
      error['statusCode'] ||
      error as Error instanceof mongoose.Error ?
        StatusCodes.BAD_REQUEST :
        StatusCodes.INTERNAL_SERVER_ERROR;
    const message = error['message'] || getReasonPhrase(statusCode);
    error = new ApiError(statusCode, message, false, err.stack);
  }
  next(error);
};

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const errorHandler = (err: ApiError, _req: Request, res: Response, _next: NextFunction) => {
  let { statusCode, message } = err;
  if (env.node === 'production' && !err.isOperational) {
    statusCode = StatusCodes.INTERNAL_SERVER_ERROR;
    message = ReasonPhrases.INTERNAL_SERVER_ERROR;
  }

  res.locals['errorMessage'] = err.message;

  const response = {
    code: statusCode,
    message,
    ...(env.node === 'development' && { stack: err.stack }),
  };

  if (env.node === 'development') {
    log.error(err);
  }

  res.status(statusCode).send(response);
};
