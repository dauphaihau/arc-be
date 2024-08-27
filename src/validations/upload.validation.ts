import { z } from 'zod';
import { objectIdHttpSchema } from '@/schemas/utils/objectId.schema';

export const uploadValidation = {
  getPresignedUrl: z.object({
    query: z.object({
      shop_id: objectIdHttpSchema,
    }),
  }),
};
