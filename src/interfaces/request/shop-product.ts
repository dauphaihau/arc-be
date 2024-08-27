import {
  RequestParamsAndBody, RequestParams
} from '@/interfaces/express';
import { CustomZodInfer } from '@/interfaces/utils';
import { shopValidation } from '@/validations';

type CreateProduct = CustomZodInfer<typeof shopValidation.createProduct>;
export type RequestCreateProduct = RequestParamsAndBody<CreateProduct['params'], CreateProduct['body']>;

type UpdateProduct = CustomZodInfer<typeof shopValidation.updateProduct>;
export type RequestUpdateProduct = RequestParamsAndBody<UpdateProduct['params'], UpdateProduct['body']>;

type GetDetailProduct = CustomZodInfer<typeof shopValidation.getDetailProduct>;
export type RequestGetDetailProduct = RequestParams<GetDetailProduct['params']>;

type DeleteProduct = CustomZodInfer<typeof shopValidation.deleteProduct>;
export type RequestDeleteProduct = RequestParams<DeleteProduct['params']>;
