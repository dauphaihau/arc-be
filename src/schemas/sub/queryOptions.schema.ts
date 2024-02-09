import { Document } from 'mongoose';
import { z } from 'zod';

export const baseQueryOptionsSchema = z.object({
  limit: z.preprocess(
    Number,
    z.union([z.number(), z.string()])
  ),
  page: z.preprocess(
    Number,
    z.union([z.number(), z.string()])
  ),
  sortBy: z.enum(['desc', 'asc']),
  populate: z.string(),
  select: z.string(),
}).partial();

export const queryResultSchema = z
  .object({
    results: z.array(z.instanceof(Document)),
    totalPages: z.number(),
    totalResults: z.number(),
  })
  .merge(
    baseQueryOptionsSchema.pick({ page: true, limit: true })
  );

export const mixBaseQueryOptionsSchema = (schema: z.AnyZodObject) => {
  return baseQueryOptionsSchema
    .merge(schema)
    .strict()
    .partial();
};
