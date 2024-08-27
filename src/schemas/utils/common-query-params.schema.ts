import { z } from 'zod';

export const baseQueryGetListSchema = z.object({
  limit: z.coerce.number().min(1),
  page: z.coerce.number().min(1),
});
