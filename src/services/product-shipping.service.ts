import { ClientSession } from 'mongoose';
import { ProductShipping } from '@/models/product-shipping.model';
import { CreateProductShippingPayload } from '@/interfaces/services/product-shipping';

const create = async (body: CreateProductShippingPayload, session: ClientSession) => {
  const result = await ProductShipping.create([body], { session });
  return result[0];
};

export const productShippingService = {
  create,
};
