import { z } from 'zod';
import { productSchema } from '@/schemas';

export const uploadValidation = {
  getPresignedUrl: z.object({
    query: productSchema.pick({ shop: true }).partial(),
  }),
};
