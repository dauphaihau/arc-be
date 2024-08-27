import { ICouponDoc } from '@/interfaces/models/coupon';
import {
  IProductDoc,
  IProductImage,
  IProductInventory,
  IProduct, IProductShipping
} from '@/interfaces/models/product';
import { IShopDoc } from '@/interfaces/models/shop';

//region get products
export type GetProductsAggregate_Product = {
  id: IProduct['id']
  shop: Pick<IShopDoc, 'id' | 'shop_name'>
  product_id: IProductDoc['id']
  image_relative_url: IProductImage['relative_url']
  title: IProductDoc['title']
  category: IProductDoc['category']
  variant_type: IProductDoc['variant_type']
  inventory: Pick<IProductInventory, 'price' | 'stock' | 'sku'> & {
    sale_price: IProductInventory['price']
  },
  percent_coupon?: Pick<ICouponDoc, 'percent_off' | 'start_date' | 'end_date'>
  free_ship_coupon?: Pick<ICouponDoc, 'start_date' | 'end_date'>
};

export type GetProductsAggregate = {
  results: GetProductsAggregate_Product[]
  total_pages: number
  total_results: number
};

export type ResponseGetProducts = {
  results: GetProductsAggregate_Product[]
  page: number
  limit: number
  total_pages: number,
  total_results: number,
};
//endregion

//region get detail product
export type ResponseGetDetailProduct_Product = Pick<IProduct, 'id' | 'title' | 'description' | 'variant_type' | 'images' | 'category'> & {
  shop: Pick<IShopDoc, 'id' | 'shop_name'>
  shipping: IProductShipping
  inventories: {
    sku: IProductInventory['sku'],
    stock: IProductInventory['stock'],
    price: IProductInventory['price'],
    sale_price: IProductInventory['price'],
  }[],
};

export type ResponseGetDetailProduct = {
  product: ResponseGetDetailProduct_Product
  percent_coupon?: Pick<ICouponDoc, 'percent_off' | 'start_date' | 'end_date'>
  free_ship_coupon?: Pick<ICouponDoc, 'start_date' | 'end_date'>
};

//endregion
