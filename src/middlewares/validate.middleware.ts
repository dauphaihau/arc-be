import { RequestHandler } from 'express';
import { StatusCodes } from 'http-status-codes';
import { z } from 'zod';
import { ApiError } from '@/utils';

export const validate = (
  schema: z.AnyZodObject | z.ZodOptional<z.AnyZodObject>
): RequestHandler => {
  return async (req, _res, next) => {
    const result = await schema.safeParse({
      body: req.body,
      query: req.query,
      params: req.params,
    });
    if (!result.success) {
      const errorMessage = result.error.issues.map(detail => detail.message).join(', ');
      return next(new ApiError(StatusCodes.BAD_REQUEST, errorMessage as string));
    }
    next();
  };
};
