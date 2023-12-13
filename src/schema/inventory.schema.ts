import mongoose from 'mongoose';
import { z } from 'zod';

export const inventorySchema = z.object({
  // id: z.union([z.instanceof(mongoose.Types.ObjectId), z.string()]),
  shop_id: z.union([z.instanceof(mongoose.Types.ObjectId), z.string()]),
  product_id: z.union([z.instanceof(mongoose.Types.ObjectId), z.string()]),
  stock: z.number(),
  reservations: z.array(z.any()),
});
