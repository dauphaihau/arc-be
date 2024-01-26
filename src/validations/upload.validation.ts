import { z } from 'zod';
import { productSchema } from '@/schema';

export const uploadValidation = {
  getPresignedUrl: z.object({
    query: productSchema.pick({ shop: true }).partial(),
  }),
};
