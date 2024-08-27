import { StatusCodes } from 'http-status-codes';
import mongoose from 'mongoose';
import moment from 'moment';
import type { ClientSession } from 'mongoose';
import {
  PRODUCT_SHIPPING_OTHER_COUNTRIES_OPTIONS
} from '@/config/enums/product';
import { omit } from '@/utils/omitFieldsObject';
import { IProductShipping } from '@/interfaces/models/product';
import { Payment } from '@/models/payment.model';
import { ICouponDoc } from '@/interfaces/models/coupon';
import { IUser } from '@/interfaces/models/user';
import { log, env } from '@/config';
import {
  DAYS_SHIPPING_INTERNATIONAL, ORDER_CONFIG, ORDER_SHIPPING_STATUSES, ORDER_STATUSES
} from '@/config/enums/order';
import {
  IOrderDoc
} from '@/interfaces/models/order';
import {
  Order, Product, Shop, Coupon, UserAddress, ProductInventory
} from '@/models';
import { couponService } from '@/services/coupon.service';
import { productInventoryService } from '@/services/product-inventory.service';
import { redisService } from '@/services/redis.service';
import { ApiError } from '@/utils';
import {
  IUpdateOrderBody
} from '@/interfaces/request/order';
import { ProductShipping } from '@/models/product-shipping.model';
import {
  CreateOrderShopsPayload,
  CreateRootOrderBody,
  GetOrderShopAggregate, CreateOrderShopBody
} from '@/interfaces/services/order';

const getOrderById = async (id?: IOrderDoc['id']) => {
  if (!id) throw new ApiError(StatusCodes.BAD_REQUEST);
  return Order.findById(id);
};

const createRootOrder = async (body: CreateRootOrderBody, session: ClientSession) => {
  if (body.total > ORDER_CONFIG.MAX_ORDER_TOTAL) {
    throw new ApiError(
      StatusCodes.BAD_REQUEST,
      `The total amount due must be no more than ${ORDER_CONFIG.MAX_ORDER_TOTAL}`
    );
  }

  const newOrderCreated = await Order.create([{
    ...body,
    status: ORDER_STATUSES.PENDING,
  }], { session });
  return newOrderCreated[0];
};

const createOrderShops = async (payload: CreateOrderShopsPayload, session: ClientSession) => {
  const { shop_carts, root_order } = payload;
  const user_id = root_order.user;
  const user_address_id = root_order.user_address;

  const orderShops: CreateOrderShopBody[] = [];

  for (const shop_cart of shop_carts) {

    let couponIdsToReserve: ICouponDoc['id'][] = [];

    //region reserve inventory
    for (const productCart of shop_cart.products) {
      const key = `lock_inventory_${productCart.inventory.id}`;

      log.info('Asking for lock');
      const lock = await redisService.retrieveLock(key);
      log.info('Lock acquired');

      const isReservation = await productInventoryService.reserveQuantity(
        {
          inventory_id: productCart.inventory.id,
          order_id: root_order.id,
          quantity: productCart.quantity,
        },
        session
      );
      if (!isReservation.modifiedCount) {
        throw new ApiError(StatusCodes.BAD_REQUEST, 'Some products have been updated, please come back to check');
      }

      if (productCart.percent_coupon) {
        couponIdsToReserve.push(productCart.percent_coupon.id);
      }

      if (productCart.freeship_coupon) {
        couponIdsToReserve.push(productCart.freeship_coupon.id);
      }

      await lock.release();
      log.info('Lock has been released, and is available for others to use');
    }
    //endregion

    //region reserve coupons
    couponIdsToReserve = [...couponIdsToReserve, ...shop_cart.coupons || []];

    if (couponIdsToReserve.length > 0) {
      for (const coupon_id of couponIdsToReserve) {
        const key = `lock_coupon_${coupon_id}`;
        const lock = await redisService.retrieveLock(key);
        const isReservationCp = await couponService.reserveQuantity(
          {
            coupon_id,
            order_id: root_order.id,
            user_id,
          },
          session
        );
        if (!isReservationCp.modifiedCount) {
          log.error(`reserve coupon ${coupon_id} failed`);
          throw new ApiError(StatusCodes.BAD_REQUEST, 'Some coupons have been updated, please come back to check');
        }
        await lock.release();
      }
    }
    //endregion

    const orderShopBody = {
      parent: root_order.id,
      user: user_id,
      shop: shop_cart.shop.id,
      user_address: user_address_id,
      shipping_status: ORDER_SHIPPING_STATUSES.PRE_TRANSIT,
      products: shop_cart.products.map((productCart) => ({
        product: productCart.product.id,
        inventory: productCart.inventory.id,
        title: productCart.product.title,
        price: productCart.inventory.price,
        sale_price: productCart.inventory.sale_price || 0,
        percent_coupon: productCart.percent_coupon?.id || null,
        freeship_coupon: productCart.freeship_coupon?.id || null,
        quantity: productCart.quantity,
        image_url: `${env.aws_s3.host_bucket}/${productCart.product.image.relative_url}`,
      })),
      subtotal: shop_cart.subtotal_price,
      total_discount: shop_cart.total_discount,
      total_shipping_fee: shop_cart.total_shipping_fee,
      total: shop_cart.total_price,
      promo_coupons: shop_cart.coupons && shop_cart.coupons.length > 0 ? shop_cart.coupons : [],
      note: shop_cart.note,
    };
    orderShops.push(orderShopBody);
  }
  return Order.insertMany(orderShops, { session });
};

async function calcShopShipping(orderShops: GetOrderShopAggregate[]) {
  const parseTimeShipping = (time: string) => {
    const typeTime = time.replace(/[^a-z]/gi, '');
    const rangeTime = time.replace(typeTime, '');
    const [from, to] = rangeTime.split('-');
    return {
      from: Number(from),
      to: Number(to),
      typeTime,
      max: Number(to) || Number(from),
    };
  };

  const newOrderShops = [];
  for (const orderShop of orderShops) {
    const productShippingMap = new Map<IProductShipping['country'], number>();

    log.debug('order-shop-product-shipping-docs %o', orderShop);
    orderShop.product_shipping_docs.forEach(psd => {
      let deliveryTime = DAYS_SHIPPING_INTERNATIONAL;
      const { max: processTime } = parseTimeShipping(psd.process_time);

      for (const ss of psd.standard_shipping) {
        if (
          ss.country === orderShop.user_address.country ||
          ss.country === PRODUCT_SHIPPING_OTHER_COUNTRIES_OPTIONS.EVERYWHERE
        ) {
          const { max: maxDeliveryTime } = parseTimeShipping(ss.delivery_time);
          deliveryTime = maxDeliveryTime;
          if (ss.country === orderShop.user_address.country) break;
        }
      }

      const productShipping = productShippingMap.get(psd.country);
      productShippingMap.set(
        psd.country, Math.max(productShipping || 0, processTime + deliveryTime)
      );
    });

    const days_estimated_delivery = Math.max(...productShippingMap.values());
    const estimated_delivery = moment(orderShop.created_at).add(days_estimated_delivery, 'd').toDate();

    newOrderShops.push({
      ...omit(orderShop, ['product_shipping_docs', 'shipping_status', 'user_address']),
      shipping: {
        shipping_status: orderShop.shipping_status,
        updated_at: orderShop.updated_at,
        to_country: orderShop.user_address.country,
        from_countries: Array.from(productShippingMap.keys()),
        estimated_delivery,
      },
    });
  }

  return newOrderShops;
}

const getOrderShopList = async (userId: IUser['id']) => {
  const limit = 10;
  const orderShopAgg = await Order.aggregate<GetOrderShopAggregate>([
    {
      $match: {
        user: new mongoose.Types.ObjectId(userId),
        parent: { $ne: null },
      },
    },
    {
      $unwind: '$products',
    },
    {
      $lookup: {
        from: Coupon.collection.name,
        localField: 'products.percent_coupon',
        foreignField: '_id',
        as: 'percent_coupon_docs',
        pipeline: [
          {
            $project: { _id: 0, percent_off: 1 },
          },
        ],
      },
    },
    {
      $lookup: {
        from: Product.collection.name,
        localField: 'products.product',
        foreignField: '_id',
        as: 'product_docs',
        pipeline: [
          {
            $project: {
              _id: 0, id: '$_id', variant_type: 1, variant_group_name: 1, variant_sub_group_name: 1, shipping: 1,
            },
          },
        ],
      },
    },
    {
      $lookup: {
        from: ProductInventory.collection.name,
        localField: 'products.inventory',
        foreignField: '_id',
        as: 'inventory_docs',
        pipeline: [
          {
            $project: {
              _id: 0, variant: 1,
            },
          },
        ],
      },
    },
    {
      $set: {
        'products.percent_coupon': { $arrayElemAt: ['$percent_coupon_docs', 0] },
        'products.product': { $arrayElemAt: ['$product_docs', 0] },
        'products.inventory': { $arrayElemAt: ['$inventory_docs', 0] },
      },
    },
    {
      $group: {
        _id: '$_id',
        products: { $push: '$products' },
        data: {
          $first: '$$ROOT',
        },
      },
    },
    { $replaceRoot: { newRoot: { $mergeObjects: ['$data', { products: '$products' }] } } },

    {
      $lookup: {
        from: Shop.collection.name,
        localField: 'shop',
        foreignField: '_id',
        as: 'shop_docs',
        pipeline: [
          {
            $project: { _id: 0, id: '$_id', shop_name: 1 },
          },
        ],
      },
    },
    {
      $lookup: {
        from: UserAddress.collection.name,
        localField: 'user_address',
        foreignField: '_id',
        as: 'user_address_docs',
        pipeline: [
          {
            $project: {
              _id: 0, id: '$_id', country: 1, zip: 1,
            },
          },
        ],
      },
    },
    {
      $lookup: {
        from: Coupon.collection.name,
        let: { promo_coupons: '$promo_coupons' },
        pipeline: [
          { $match: { $expr: { $in: ['$_id', '$$promo_coupons'] } } },
          {
            $project: { _id: 0, id: '$_id', code: 1 },
          },
        ],
        as: 'promo_coupons',
      },
    },
    {
      $lookup: {
        from: Coupon.collection.name,
        localField: 'products.percent_coupon',
        foreignField: '_id',
        as: 'percent_coupon_docs',
      },
    },
    {
      $lookup: {
        from: Payment.collection.name,
        localField: 'payment',
        foreignField: '_id',
        pipeline: [
          {
            $project: {
              _id: 0, type: 1, card_funding: 1, card_last4: 1, card_brand: 1,
            },
          },
        ],
        as: 'payment_docs',
      },
    },
    {
      $lookup: {
        from: ProductShipping.collection.name,
        localField: 'products.product.shipping',
        foreignField: '_id',
        pipeline: [
          {
            $project: {
              _id: 0,
              id: '$_id',
              country: 1,
              zip: 1,
              process_time: 1,
              standard_shipping: 1,
            },
          },
        ],
        as: 'product_shipping_docs',
      },
    },
    {
      $addFields: {
        user_address: {
          $arrayElemAt: ['$user_address_docs', 0],
        },
        shop: {
          $arrayElemAt: ['$shop_docs', 0],
        },
        payment: {
          $arrayElemAt: ['$payment_docs', 0],
        },
      },
    },
    {
      $sort: {
        created_at: -1,
      },
    },
    {
      $limit: limit,
    },
    {
      $project: {
        _id: 0,
        id: '$_id',
        shop: 1,
        user_address: 1,
        payment: 1,
        products: 1,
        promo_coupons: 1,
        note: 1,
        shipping: 1,
        shipping_status: 1,
        subtotal: 1,
        total_discount: 1,
        product_shipping_docs: 1,
        total_shipping_fee: 1,
        total: 1,
        created_at: 1,
        updated_at: 1,
      },
    },
  ]);
  return orderShopAgg;
};

const updateOrderById = async (
  id: IOrderDoc['id'],
  updateBody: IUpdateOrderBody,
  session: ClientSession
) => {
  const order = await getOrderById(id);
  log.debug('order %o', order);
  if (!order) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Order not found');
  }
  Object.assign(order, updateBody);
  await order.save({ session });
  return order;
};

export const orderService = {
  getOrderShopList,
  getOrderById,
  updateOrderById,
  calcShopShipping,
  createRootOrder,
  createOrderShops,
};
