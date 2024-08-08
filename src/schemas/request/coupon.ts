import { couponSchema } from '@/schemas';

export const createCouponBodySchema = couponSchema.omit({
  id: true,
  users_used: true,
  created_at: true,
  updated_at: true,
});

export const updateCouponBodySchema = couponSchema.omit({
  id: true,
  shop: true,
  code: true,
  users_used: true,
  max_uses_per_user: true,
  created_at: true,
  updated_at: true,
}).partial();
