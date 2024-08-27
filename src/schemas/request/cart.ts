import { z } from 'zod';
import { objectIdHttpSchema } from '@/schemas/utils/objectId.schema';
import {
  couponSchema,
  orderSchema
} from '@/schemas';

export const additionInfoShopCartSchema = z.object({
  shop_id: objectIdHttpSchema,
  promo_codes: z.array(couponSchema.shape.code).optional(),
  note: orderSchema.shape.note.optional(),
});
