import { RequestHandler } from 'express';
import { AnyZodObject, z, ZodError } from 'zod';
import { StatusCodes } from 'http-status-codes';
import type { Request } from 'express';
import { ApiError } from '@/utils';
import { CustomZodInfer } from '@/interfaces/utils';

export async function zParse<T extends AnyZodObject>(
  schema: T,
  req: Request
): Promise<CustomZodInfer<T>> {
  try {
    return await schema.parseAsync(req) as CustomZodInfer<typeof schema>;
  }
  catch (error) {
    if (error instanceof ZodError) {
      const errorMessage = error.issues.map(detail => {
        return `${detail.path.at(-1)} ${detail.message}`;
      }).join(', ');
      throw new ApiError(StatusCodes.BAD_REQUEST, errorMessage);
    }
    throw new ApiError(StatusCodes.BAD_REQUEST, JSON.stringify(error));
  }
}

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
