import { IProductShipping } from '@/interfaces/models/product';

export type CreateProductShippingPayload = Pick<IProductShipping,
'shop' |
'product' |
'country' |
'zip' |
'standard_shipping'|
'process_time'
>;
