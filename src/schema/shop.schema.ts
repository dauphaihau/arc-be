import mongoose from 'mongoose';
import { z } from 'zod';

export const shopSchema = z.object({
  shop_name: z
    .string({
      required_error: 'shop_name is required',
      invalid_type_error: 'invalid type shop name',
    })
    .trim()
    .min(6, 'shop_name must be at least 6 characters')
    .max(20, 'shop_name must be no longer than 20 characters'),
  user_id: z.union([z.instanceof(mongoose.Types.ObjectId), z.string()]),
});
