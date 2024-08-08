import { RequestHandler } from 'express';
import { z } from 'zod';
import { StatusCodes } from 'http-status-codes';
import { ApiError } from '@/utils';

export const validate = (
  schema: z.AnyZodObject | z.ZodOptional<z.AnyZodObject>
): RequestHandler => {
  return (req, _res, next) => {
    const result = schema.safeParse({
      body: req.body,
      query: req.query,
      params: req.params,
    });
    if (!result.success) {
      const errorMessage = result.error.issues.map(detail => {
        return `${detail.path.at(-1)} ${detail.message}`;
      }).join(', ');
      return next(new ApiError(StatusCodes.BAD_REQUEST, errorMessage as string));
    }
    next();
  };
};
