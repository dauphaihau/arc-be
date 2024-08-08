import { z } from 'zod';
import { IProductCart } from '@/interfaces/models/cart';
import {
  addProductCartBodySchema,
  updateCartBodySchema
} from '@/schemas/request/cart';
import { additionInfoShopCartSchema } from '@/schemas/request/cart';

export type AddProductCartBody = z.infer<typeof addProductCartBodySchema>;

export type AdditionInfoShopCart = z.infer<typeof additionInfoShopCartSchema>;

export type UpdateProductCartBody = z.infer<typeof updateCartBodySchema>;

export type ProductCartToAdd = Pick<IProductCart, 'product' | 'inventory' | 'quantity'>;
