import { z } from 'zod';
import { IProductCart, ICart } from '@/interfaces/models/cart';
import { ICouponDoc } from '@/interfaces/models/coupon';
import { IOrder } from '@/interfaces/models/order';
import {
  IProductInventory,
  IProduct,
  IProductImage
} from '@/interfaces/models/product';
import { IShopDoc } from '@/interfaces/models/shop';
import { IUserDoc, IUser } from '@/interfaces/models/user';
import { Override } from '@/interfaces/utils';
import { additionInfoShopCartSchema } from '@/schemas/request/cart';

// region get cart
export type GetCartFilter = Partial<{
  product_cart_selected: IProductCart['is_select_order']
  cart_id: ICart['id'] | undefined
  user_id: IUser['id']
}>;

export type ShopCart = {
  shop: Pick<IShopDoc, 'id' | 'shop_name'>
  products: Override<IProductCart, {
    price: IProductInventory['price']
    product: Pick<IProduct, 'id' |'title' | 'variants' | 'variant_group_name' | 'variant_sub_group_name'> & {
      image: {
        relative_url: IProductImage['relative_url']
      }
    }
    inventory: Pick<IProductInventory, 'id' | 'price' | 'stock' | 'sku' | 'variant'> & {
      sale_price?: IProductInventory['price']
    }
    percent_coupon: Pick<ICouponDoc, 'id' | 'percent_off' | 'start_date' | 'end_date'> | null
    freeship_coupon: Pick<ICouponDoc, 'id' | 'start_date' | 'end_date'> | null
  }>[]
  subtotal_price: number
  total_discount: number
  total_shipping_fee: number
  total_price: number
  coupons?: ICouponDoc['id'][]
  note?: IOrder['note']
};

export type GetCartAggregate = {
  cart_id: ICart['id']
  user_id: IUserDoc['id']
  shop_carts: ShopCart[]
  summary_cart: {
    total_products: number
    total_products_selected: number
    subtotal_price: number
    shop_ids: IShopDoc['id'][]
  }
};

// endregion

export type AdditionInfoShopCart = z.infer<typeof additionInfoShopCartSchema>;

export type SummaryOrder = {
  subtotal_price: number
  total_discount: number
  subtotal_applies_total_discount: number
  total_shipping_fee: number
  total_price: number
  total_products: number
};
