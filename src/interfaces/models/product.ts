import { Model, FilterQuery } from 'mongoose';
import { z } from 'zod';
import {
  productAttributeSchema,
  productSchema,
  productImageSchema
} from '@/schema';
import { IBaseQueryOptions } from '@/models/plugins/paginate.plugin';
import { productStateUserCanModify } from '@/schema/product.schema';

export type IProduct = z.infer<typeof productSchema>;
export type IProductImage = z.infer<typeof productImageSchema>;
export type IProductAttribute = z.infer<typeof productAttributeSchema>;

export interface IProductModel extends Model<IProduct, unknown> {
  paginate: (filter: FilterQuery<IProduct>, options: IBaseQueryOptions) => Promise<IProduct[]>;
}

export type PRODUCT_STATES_USER_CAN_MODIFY = z.infer<typeof productStateUserCanModify>;

export type CreateProductParams = Partial<Pick<IProduct, 'shop_id'>>;
export type CreateProductPayload = Omit<IProduct, 'id' | 'rating_average' | 'views' | 'state'> & {
  state: PRODUCT_STATES_USER_CAN_MODIFY
};

export type GetProductParams = Partial<Pick<IProduct, 'id'>>;

export type GetProductsParams = Partial<Pick<IProduct, 'shop_id'>>;

export type DeleteProductParams = Partial<Pick<IProduct, 'id'>>;

export type UpdateProductParams = Partial<Pick<IProduct, 'id' | 'shop_id'>>;

export type UpdateProductPayload = Omit<IProduct, 'id' | 'shop_id' | 'state'> & {
  state: PRODUCT_STATES_USER_CAN_MODIFY
};
