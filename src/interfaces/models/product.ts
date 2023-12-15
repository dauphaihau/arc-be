import {
  Model,
  FilterQuery,
  Schema, QueryOptions
} from 'mongoose';
import { z } from 'zod';
import {
  productAttributeSchema,
  productSchema,
  productImageSchema
} from '@/schema';

export type IProduct = z.infer<typeof productSchema>;
export type IProductImage = z.infer<typeof productImageSchema>;
export type IProductAttribute = z.infer<typeof productAttributeSchema>;

export interface IProductModel extends Model<IProduct, unknown> {
  paginate: (filter: FilterQuery<Schema>, options: QueryOptions<Schema>) => Promise<boolean>;
}

export type CreateProductParams = Partial<Pick<IProduct, 'shop_id'>>;
export type CreateProductPayload = Omit<IProduct, 'id'>;

export type GetProductParams = Partial<Pick<IProduct, 'shop_id'>>;

export type DeleteProductParams = Partial<Pick<IProduct, 'id'>>;

export type UpdateProductParams = Partial<Pick<IProduct, 'id' | 'shop_id'>>;
export type UpdateProductPayload = Omit<IProduct, 'id' | 'shop_id'>;
