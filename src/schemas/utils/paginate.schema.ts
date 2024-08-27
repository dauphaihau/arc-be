import { Document } from 'mongoose';
import { z } from 'zod';

export const baseQueryGetListSchema = z.object({
  limit: z.preprocess(
    Number,
    z.union([z.number(), z.string()])
  ),
  page: z.preprocess(
    Number,
    z.union([z.number(), z.string()])
  ),
  sortBy: z.string(),
  populate: z.string(),
  select: z.string(),
}).partial();

export const baseResponseGetListSchema = z
  .object({
    results: z.array(z.instanceof(Document)),
    total_pages: z.number(),
    total_results: z.number(),
  })
  .merge(
    baseQueryGetListSchema.pick({ page: true, limit: true })
  );

export const mixBaseQueryGetListSchema = (schema: z.AnyZodObject) => {
  return baseQueryGetListSchema
    .merge(schema)
    .strict()
    .partial();
};
