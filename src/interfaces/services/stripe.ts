import { MARKETPLACE_CURRENCIES } from '@/config/enums/marketplace';
import { ICart } from '@/interfaces/models/cart';
import { IOrderDoc } from '@/interfaces/models/order';
import { IUserDoc } from '@/interfaces/models/user';

export type GetCheckoutSessionUrlPayload = {
  user: IUserDoc
  root_order: IOrderDoc,
  order_shops?: IOrderDoc[] | [],
  currency: MARKETPLACE_CURRENCIES
  cart_id: ICart['id']
};

export type CustomMetaData = Record<
'user_id' | 'cart_id' | 'order_id', string
>;
