import { Document } from 'mongoose';
import { z } from 'zod';
import {
  createProductBodySchema,
  updateProductSchema
} from '@/schemas/request/shop-product';
import { RequestBaseQueryParamsGetList } from '@/interfaces/request/other';
import { IOrderDoc } from '@/interfaces/models/order';
import { ICouponDoc } from '@/interfaces/models/coupon';
import {
  IProductDoc,
  IProductImage,
  IProductInventory,
  IProductVariant,
  IProductVariantOpt,
  IProduct, IProductShipping
} from '@/interfaces/models/product';
import { IShop } from '@/interfaces/models/shop';
import { Override } from '@/interfaces/utils';
import {
  marketGetProductsSortBySchema
} from '@/schemas';

//region get products
type MarketGetProductsSortBy = z.infer<typeof marketGetProductsSortBySchema>;

export type GetProductsQueryParams = Pick<IProductDoc, 'category' | 'title'> & {
  is_digital: 'true' | 'false'
  s: string
  order: MarketGetProductsSortBy
} & Omit<RequestBaseQueryParamsGetList, 'sortBy'>;

export type ProductCustomFields = {
  id: IProduct['id']
  shop: Pick<IShop, 'id' | 'shop_name'>
  product_id: IProductDoc['id']
  image_relative_url: IProductImage['relative_url']
  title: IProductDoc['title']
  category: IProductDoc['category']
  variant_type: IProductDoc['variant_type']
  inventory: Pick<IProductInventory, 'price' | 'stock' | 'sku'> & {
    sale_price: IProductInventory['price']
  },
  percent_coupon?: Pick<ICouponDoc, 'type' | 'percent_off' | 'start_date' | 'end_date'>
  free_ship_coupon?: Pick<ICouponDoc, 'type' | 'start_date' | 'end_date'>
};

export type CouponAggregate = {
  _id: IShop['id']
  coupons: Pick<ICouponDoc, 'type' | 'percent_off' | 'start_date' | 'end_date' | 'applies_product_ids' | 'applies_to'>[]
};

export type ResponseMarketGetProducts = {
  results: ProductCustomFields[]
  page: number
  limit: number
  totalPages: number,
  totalResults: number,
};
//endregion

//region get detail product
type DetailProduct = Pick<IProduct, 'id' | 'title' | 'description' | 'variant_type' | 'images' | 'category'> & {
  shop: Pick<IShop, 'id' | 'shop_name'>
  shipping: IProductShipping
  inventories: {
    sku: IProductInventory['sku'],
    stock: IProductInventory['stock'],
    price: IProductInventory['price'],
    sale_price: IProductInventory['price'],
  }[],
};

export type ResponseMarketGetDetailProduct = {
  product: DetailProduct
  percent_coupon?: Pick<ICouponDoc, 'percent_off' | 'start_date' | 'end_date'>
  free_ship_coupon?: Pick<ICouponDoc, 'start_date' | 'end_date'>
};

//endregion

export type CreateProductBody = z.infer<typeof createProductBodySchema>;

export type CreateInventoryBody = Pick<IProductInventory, 'shop' | 'product' | 'stock' | 'variant' | 'price' | 'sku'>;

export type UpdateInventoryBody = Pick<IProductInventory, 'shop' | 'product' | 'stock'>;

export type ReservationInventoryBody =
  {
    inventory_id: IProductInventory['id']
    order_id: IOrderDoc['id'],
    quantity: number
  };

export type CreateProductVariantBody = Override<IProductVariant, {
  id?: IProductVariant['id']
  variant_options?: Omit<IProductVariantOpt, 'id'>[]
}>;

export type GetDetailProductByShopParams = {
  product_id: IProductDoc['id']
  shop_id: IProductDoc['shop']
};

export type GetProductByShopQueryParams =
  RequestBaseQueryParamsGetList
  & Pick<IProductDoc, 'title' | 'category'>
  & {
    price: IProductInventory['price']
  };

export type UpdateProductParams = {
  product_id: IProductDoc['id']
  shop_id: IProductDoc['shop']
};

export type UpdateProductBody = z.infer<typeof updateProductSchema>;

type IVariantGetProducts = Omit<IProductVariant, 'variant_options'> & {
  variant_options: {
    inventory: IProductInventory
  }[];
  inventory: IProductInventory
};

export type ResponseGetProducts = Override<IProductDoc, {
  variants?: IVariantGetProducts[]
  inventory: IProductInventory
  shop: IShop & Document
  summary_inventory: Record<
  'lowest_price' | 'highest_price' | 'stock'
  , number>
}>;
