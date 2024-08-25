import { Document } from 'mongoose';
import { z } from 'zod';
import { RequestParams } from '@/interfaces/express';
import { shopValidation } from '@/validations';
import {
  singleVariantSchema, combineVariantSchema
} from '@/schemas/request/shop-product';
import { IOrderDoc } from '@/interfaces/models/order';
import {
  IProductDoc,
  IProductInventory,
  IProductVariant,
  IProductVariantOpt
} from '@/interfaces/models/product';
import { IShopDoc } from '@/interfaces/models/shop';
import { Override, CustomZodInfer } from '@/interfaces/utils';

type GetDetailProduct = CustomZodInfer<typeof shopValidation.getDetailProduct>;
export type RequestGetDetailProduct = RequestParams<GetDetailProduct['params']>;

export type SingleVariant = z.infer<typeof singleVariantSchema>;
export type CombineVariant = z.infer<typeof combineVariantSchema>;

export type CreateInventoryBody = Pick<IProductInventory, 'shop' | 'product' | 'stock' | 'variant' | 'price' | 'sku'>;

export type UpdateInventoryBody = Pick<IProductInventory, 'shop' | 'product' | 'stock'>;

export type ReservationInventoryBody = {
  inventory_id: IProductInventory['id']
  order_id: IOrderDoc['id'],
  quantity: number
};

export type CreateProductVariantBody = Override<IProductVariant, {
  id?: IProductVariant['id']
  variant_options?: Omit<IProductVariantOpt, 'id'>[]
}>;

type IVariantGetProducts = Omit<IProductVariant, 'variant_options'> & {
  variant_options: {
    inventory: IProductInventory
  }[];
  inventory: IProductInventory
};

export type ResponseGetProducts = Override<IProductDoc, {
  variants?: IVariantGetProducts[]
  inventory: IProductInventory
  shop: IShopDoc & Document
  summary_inventory: Record<
  'lowest_price' | 'highest_price' | 'stock'
  , number>
}>;
