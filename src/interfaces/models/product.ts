import {
  Model, FilterQuery, Document
} from 'mongoose';
import { z } from 'zod';
import { IOrder } from './order';
import { Override } from '@/interfaces/utils';
import { IShop } from '@/interfaces/models/shop';
import {
  productAttributeSchema,
  productSchema,
  productImageSchema,
  productVariantSchema,
  productInventorySchema,
  productVariantOptSchema,
  productInventoryReservationSchema, createProductBodySchema
} from '@/schemas';
import {
  IBaseQueryOptions,
  IQueryResult
} from '@/models/plugins/paginate.plugin';
import { updateProductSchema } from '@/schemas/product.schema';
import { BaseQueryParamsGetList } from '@/interfaces/common/request';

// ----- Base
export type IProduct = z.infer<typeof productSchema> & Document;
export type IProductInventory = z.infer<typeof productInventorySchema>;
export type IProductImage = z.infer<typeof productImageSchema>;
export type IProductVariant = z.infer<typeof productVariantSchema>;
export type IProductVariantOpt = z.infer<typeof productVariantOptSchema>;
export type IProductAttribute = z.infer<typeof productAttributeSchema>;
export type IProductInventoryReservationSchema = z.infer<typeof productInventoryReservationSchema>;

export interface IProductModel extends Model<IProduct, unknown> {
  // eslint-disable-next-line @stylistic/max-len
  paginate: (filter: FilterQuery<IProduct>, options: IBaseQueryOptions) => Promise<IQueryResult<ResponseGetProducts>>;
}

export interface IProductInventoryModel extends Model<IProductInventory, unknown> {}

// ------- API Request

export type CreateInventoryPayload = Pick<IProductInventory, 'shop' | 'product' | 'stock' | 'variant' | 'price' | 'sku'>;

export type UpdateInventoryPayload = Pick<IProductInventory, 'shop' | 'product' | 'stock'>;

export type ReservationInventoryPayload =
  {
    inventoryId: IProductInventory['id']
    order: IOrder['id'] ,
    quantity: number
  };

export type CreateProductParams = Partial<Pick<IProduct, 'shop'>>;

export type CreateProductBody = z.infer<typeof createProductBodySchema>;

export type CreateProductVariantBody = Override<IProductVariant, {
  id?: IProductVariant['id']
  variant_options?: Omit<IProductVariantOpt, 'id'>[]
}>;

export type GetProductParams = Partial<Pick<IProduct, 'id'>>;

export type GetDetailProductByShopParams = Partial<Pick<IProduct, 'id' | 'shop'>>;

export type GetProductByShopParams = Partial<Pick<IProduct, 'shop'>>;

export type GetProductQueries = Partial<
Pick<IProduct, 'category' | 'title'> & { is_digital: 'true' | 'false' } & BaseQueryParamsGetList
>;

export type DeleteProductParams = Partial<Pick<IProduct, 'id'>>;

export type UpdateProductParams = Partial<Pick<IProduct, 'id' | 'shop'>>;

export type UpdateProductBody = z.infer<typeof updateProductSchema>;

// ------- API Response

type IVariantGetProducts = Omit<IProductVariant, 'variant_options'> & {
  variant_options: {
    inventory: IProductInventory
  }[];
  inventory: IProductInventory
};

export type ResponseGetProducts = Override<IProduct, {
  variants?: IVariantGetProducts[]
  inventory: IProductInventory
  shop: IShop & Document
  summary_inventory: Record<
  'lowest_price' | 'highest_price' | 'stock'
  ,number>
}>;
