import { CustomZodInfer } from '@/interfaces/utils';
import {
  RequestQueryParams, RequestBody
} from '@/interfaces/express';
import { cartValidation } from '@/validations';
import { IProductCart } from '@/interfaces/models/cart';

type GetCart = CustomZodInfer<typeof cartValidation.getCart>;
export type RequestGetCart = RequestQueryParams<GetCart['query']>;

type AddProductCart = CustomZodInfer<typeof cartValidation.addProduct>;
export type RequestAddProductCart = RequestBody<AddProductCart['body']>;

type UpdateCart = CustomZodInfer<typeof cartValidation.updateCart>;
export type RequestUpdateCart = RequestBody<UpdateCart['body']>;

type DeleteProductCart = CustomZodInfer<typeof cartValidation.deleteProduct>;
export type RequestDeleteProductCart = RequestQueryParams<DeleteProductCart['query']>;

export type ProductCartToAdd = Pick<IProductCart, 'product' | 'inventory' | 'quantity'>;
