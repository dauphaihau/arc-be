import { z } from 'zod';

export const baseQueryListSchema = z.object({
  limit: z.preprocess(Number, z.number().min(1)),
  page: z.preprocess(Number, z.number().min(1)),
  sortBy: z.enum(['desc', 'asc']),
});

export const mixBaseQueryListSchema = (schema: z.AnyZodObject) => {
  return baseQueryListSchema
    .merge(schema)
    .strict()
    .partial();
};
