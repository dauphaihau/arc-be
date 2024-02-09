import {
  Model, FilterQuery, PopulatedDoc
} from 'mongoose';
import { z } from 'zod';
import { IOrder } from './order';
import { Override } from '@/interfaces/utils';
import { IPopulatedShop } from '@/interfaces/models/shop';
import {
  productAttributeSchema,
  productSchema,
  productImageSchema,
  productVariantSchema,
  productInventorySchema,
  productVariantOptSchema,
  productInventoryReservationSchema
} from '@/schemas';
import {
  IBaseQueryOptions,
  IQueryResult
} from '@/models/plugins/paginate.plugin';
import { productStateUserCanModify } from '@/schemas/product.schema';

export type IProductSchema = z.infer<typeof productSchema>;
export type IProduct = Override<IProductSchema, {
  shop: IPopulatedShop
}>;
export type IPopulatedProduct = PopulatedDoc<IProduct>;

export type IProductImage = z.infer<typeof productImageSchema>;
export type IProductVariantOpt = z.infer<typeof productVariantOptSchema>;
export type IProductVariant = z.infer<typeof productVariantSchema>;
export type IProductAttribute = z.infer<typeof productAttributeSchema>;

export type IProductInventoryReservationSchema = z.infer<typeof productInventoryReservationSchema>;
export type IProductInventorySchema = z.infer<typeof productInventorySchema>;
export type IProductInventory = Override<IProductInventorySchema, {
  shop: IPopulatedShop
  product: IPopulatedProduct
}>;

export interface IProductModel extends Model<IProduct, unknown> {
  // eslint-disable-next-line @stylistic/max-len
  paginate: (filter: FilterQuery<IProduct>, options: IBaseQueryOptions) => Promise<IQueryResult<ResponseGetProducts>>;
}

export interface IProductInventoryModel extends Model<IProductInventory, unknown> {}

export type CreateInventoryPayload = Pick<IProductInventory, 'shop' | 'product' | 'stock' | 'variant' | 'price' | 'sku'>;

export type UpdateInventoryPayload = Pick<IProductInventory, 'shop' | 'product' | 'stock'>;

export type ReservationInventoryPayload =
  {
    inventoryId: IProductInventory['id']
    order: IOrder['id'] ,
    quantity: number
  };

export type PRODUCT_STATES_USER_CAN_MODIFY = z.infer<typeof productStateUserCanModify>;

export type CreateProductParams = Partial<Pick<IProduct, 'shop'>>;

type IProductInventoryCanModify = Pick<IProductInventory, 'price' | 'stock' | 'sku'>;

type VariantOption = Pick<IProductVariant, 'variant_name'> & {
  inventory: IProductInventory
} & Partial<IProductInventoryCanModify>;

export type IVariantCreateProduct = Omit<IProductVariant, 'variant_options'> & {
  variant_options: VariantOption[];
} & Partial<IProductInventoryCanModify>;

export type CreateProductPayload =
  Omit<IProduct, 'id' | 'rating_average' | 'views' | 'state' | 'variants'>
  & {
    state: PRODUCT_STATES_USER_CAN_MODIFY
    variants?: IVariantCreateProduct[]
  }
  & Partial<IProductInventoryCanModify>;

export type CreateProductVariantPayload = Omit<IProductVariant, 'id'>;

export type GetProductParams = Partial<Pick<IProduct, 'id'>>;
export type GetProductQueries = Partial<Pick<IProduct, 'category'>>;


export type GetProductsParams = Partial<Pick<IProduct, 'shop' | 'category'>>;

type IVariantGetProducts = Omit<IProductVariant, 'variant_options'> & {
  variant_options: {
    inventory: IProductInventory
  }[];
  inventory: IProductInventory
};
export type ResponseGetProducts = Omit<IProduct, 'variants'> & {
  variants?: IVariantGetProducts[]
  summary_inventory: Record<
  'lowest_price' | 'highest_price' | 'stock'
  ,number>
};

export type DeleteProductParams = Partial<Pick<IProduct, 'id'>>;

export type UpdateProductParams = Partial<Pick<IProduct, 'id' | 'shop'>>;

export type UpdateProductPayload = Omit<IProduct, 'id' | 'shop' | 'state'> & {
  state: PRODUCT_STATES_USER_CAN_MODIFY
} & Partial<IProductInventoryCanModify>;
