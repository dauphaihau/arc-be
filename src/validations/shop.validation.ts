import { z } from 'zod';
import { shopSchema } from '@/schema';

export const shopValidation = {
  createShop: z.object({
    body: shopSchema.pick({ shop_name: true }).strict(),
  }),
};
