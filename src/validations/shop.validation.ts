import { z } from 'zod';
import { mixBaseQueryOptionsSchema } from '@/schema/sub/queryOptions.schema';
import { shopSchema } from '@/schema';

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
