import { z } from 'zod';
import { shopSchema } from '@/interfaces/schema/shop';

export const shopValidation = {
  createShop: z.object({
    body: shopSchema.pick({ shop_name: true }).strict(),
  }),
};
