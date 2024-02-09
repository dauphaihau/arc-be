import { z } from 'zod';
import { mixBaseQueryOptionsSchema } from '@/schemas/sub/queryOptions.schema';
import { shopSchema } from '@/schemas';

export const shopValidation = {
  getShops: z.object({
    query: mixBaseQueryOptionsSchema(
      shopSchema
        .pick({ shop_name: true })
        .strict()
    ),
  }),
  createShop: z.object({
    body: shopSchema
      .pick({ shop_name: true })
      .strict(),
  }),
};
