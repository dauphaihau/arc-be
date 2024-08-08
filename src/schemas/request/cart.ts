import { z } from 'zod';
import { objectIdSchema } from '@/schemas/utils/objectId.schema';
import { booleanStringSchema } from '@/schemas/utils/boolean-string.schema';
import {
  couponSchema,
  productCartSchema,
  orderSchema
} from '@/schemas';

export const additionInfoShopCartSchema = z.object({
  shop_id: objectIdSchema,
  promo_codes: z.array(couponSchema.shape.code).optional(),
  note: orderSchema.shape.note.optional(),
});

export const addProductCartBodySchema = z.object({
  inventory_id: objectIdSchema,
  is_temp: booleanStringSchema.optional(),
  quantity: productCartSchema.shape.quantity.min(1),
});

export const updateCartBodySchema = z.object({
  inventory_id: objectIdSchema,
  is_select_order: booleanStringSchema,
  cart_id: objectIdSchema,
  quantity: productCartSchema.shape.quantity.min(1),
  addition_info_temp_cart: additionInfoShopCartSchema.pick({
    promo_codes: true,
    note: true,
  }).strict(),
  addition_info_shop_carts: z.array(
    additionInfoShopCartSchema.strict()
  ).min(1),
}).partial();
