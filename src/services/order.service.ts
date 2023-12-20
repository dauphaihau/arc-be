import { StatusCodes } from 'http-status-codes';
import { ClientSession } from 'mongoose';
import { inventoryService } from '@/services/inventory.service';
import { cartService } from '@/services/cart.service';
import { redisService } from '@/services/redis.service';
import { couponService } from '@/services/coupon.service';
import { addressService } from '@/services/address.service';
import {
  COUPONS_MAX_USE_PER_ORDER,
  COUPON_MIN_ORDER_TYPES, COUPON_TYPES
} from '@/config/enums/coupon';
import { productService } from '@/services/product.service';
import { log } from '@/config';
import {
  IOrder,
  ReviewOrderBody,
  IUpdateOrderBody,
  CreateOrderBody, IOrderModel
} from '@/interfaces/models/order';
import { Order } from '@/models';
import { ApiError } from '@/utils';
import { SHIPPING_FEE_PERCENT } from '@/config/enums/order';

const getOrderById = async (id: IOrder['id']) => {
  return Order.findById(id);
};

/**
 * Query for orders
 * @param filter - Mongo filter
 * @param options - Query options
 * @param [options.sortBy] - Sort option in the format: sortField:(desc|asc)
 * @param [options.limit] - Maximum number of results per page (default = 10)
 * @param [options.page] - Current page (default = 1)
 * @returns {Promise<QueryResult>}
 *
 **/
const queryOrders: IOrderModel['paginate'] = async (filter, options) => {
  return Order.paginate(filter, options);
};

const updateOrderById = async (
  id: IOrder['id'],
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

/*
 * Review order
 *
 * 1. validate products
 *
 * 2. calculate price each product
 *
 * 3. validate coupons
 *
 * 4. calculate discount total
 */
async function reviewOrder(payload: ReviewOrderBody) {
  const { cart_items, user_id } = payload;
  let productsFlattened;
  const tempOrder = {
    subTotalPrice: 0,
    shippingFee: 0,
    totalDiscount: 0,
    totalPrice: 0,
  };

  for (const cart_item of cart_items) {
    const { coupon_codes = [], shop_id, products = [] } = cart_item;
    const productsValid = await productService.checkAndGetShopProducts(shop_id, products);

    let count_shop_products = 0;
    const subTotalPrice = productsValid.reduce((acc, next) => {
      count_shop_products += next.quantity;
      return acc + (next.price * next.quantity);
    }, 0);
    tempOrder.subTotalPrice += subTotalPrice;
    tempOrder.shippingFee += subTotalPrice * SHIPPING_FEE_PERCENT;

    // validate per coupon
    if (coupon_codes && coupon_codes.length > 0) {

      if (coupon_codes.length > COUPONS_MAX_USE_PER_ORDER) {
        throw new ApiError(
          StatusCodes.BAD_REQUEST,
          `Only ${COUPONS_MAX_USE_PER_ORDER} coupons use at same time`
        );
      }

      const coupon_types = [];
      for (const coupon_code of coupon_codes) {
        const coupon = await couponService.getCouponByCode({
          shop_id,
          code: coupon_code,
        });
        if (!coupon) {
          throw new ApiError(StatusCodes.NOT_FOUND, 'Coupon not exist');
        }
        coupon_types.push(coupon.type);

        if (!coupon.is_active) {
          throw new ApiError(StatusCodes.BAD_REQUEST, 'Coupon not active');
        }
        if (coupon.uses_count >= coupon.max_uses) {
          throw new ApiError(StatusCodes.BAD_REQUEST, `Coupon ${coupon_code} reach max count use`);
        }

        if (
          coupon.min_order_type === COUPON_MIN_ORDER_TYPES.ORDER_TOTAL &&
          subTotalPrice < (coupon.min_order_value as number)
        ) {
          throw new ApiError(
            StatusCodes.BAD_REQUEST,
            `Shop ${shop_id} require order total must be large than ${coupon.min_order_value}`
          );
        }
        if (
          coupon.min_order_type === COUPON_MIN_ORDER_TYPES.NUMBER_OF_PRODUCTS &&
          productsValid.length < (coupon.min_products as number) &&
          count_shop_products < (coupon.min_products as number)
        ) {
          throw new ApiError(
            StatusCodes.BAD_REQUEST,
            `Coupon ${coupon_code} require order must 
            be at least ${coupon.min_products} productsValid`
          );
        }

        let count = 0;
        coupon.users_used?.forEach((user_used_coupon_id) => {
          if (user_used_coupon_id === user_id) {
            count += 1;
          }
        });
        if (count >= coupon.max_uses_per_user) {
          throw new ApiError(
            StatusCodes.BAD_REQUEST,
            `User has reach limit use coupon ${coupon_code}`
          );
        }

        let discount = 0;
        switch (coupon.type) {
          case COUPON_TYPES.FIXED_AMOUNT:
            discount = coupon.amount_off as number;
            break;
          case COUPON_TYPES.PERCENTAGE:
            discount = subTotalPrice * (coupon.percent_off as number / 100);
            break;
          case COUPON_TYPES.FREE_SHIP:
            tempOrder.shippingFee -= subTotalPrice * SHIPPING_FEE_PERCENT;
            break;
        }
        tempOrder.totalDiscount += discount;
      }

      if (
        coupon_codes.length === COUPONS_MAX_USE_PER_ORDER &&
        !coupon_types.includes(COUPON_TYPES.FREE_SHIP)
      ) {
        throw new ApiError(StatusCodes.BAD_REQUEST, 'The only coupon that can be used with another coupon is Free Shipping');
      }
    }

    productsFlattened = productsValid;
    tempOrder.totalPrice = tempOrder.subTotalPrice - tempOrder.totalDiscount;
  }
  tempOrder.totalPrice += tempOrder.shippingFee;
  return {
    tempOrder,
    productsFlattened,
  };
}

/*
 * Create order
 *
 * 1. init order from "review order"
 *
 *    validate address
 *
 *    create order
 *
 * 2. reservation quantity product in inventory
 *    acquire lock from redis to reserve
 *
 * 3. minus quantity product
 *
 * 4. minus quantity product in cart
 *
 * 5. update coupon if apply coupon
 *
 */
async function createOrder(
  payload: CreateOrderBody,
  session: ClientSession
) {
  const {
    user_id,
    payment_type,
    address_id,
    cart_items = [],
  } = payload;

  const { tempOrder, productsFlattened } = await reviewOrder(payload);

  const userAddress = await addressService.getAddressById(address_id);
  if (!userAddress || userAddress.user_id.toString() !== user_id) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Address not found');
  }

  const newOrderCreated = await Order.create([{
    user_id,
    address_id,
    payment_type,
    lines: cart_items,
    subtotal: tempOrder.subTotalPrice,
    shipping_fee: tempOrder.shippingFee,
    total_discount: tempOrder.totalDiscount,
    total: tempOrder.totalPrice,
  }], { session });
  const newOrder = newOrderCreated[0];

  for (const cart_item of cart_items) {
    const { products = [], shop_id, coupon_codes = [] } = cart_item;
    for (const product of products) {
      const key = `lock_v2023_${product.id}`;

      log.info('Asking for lock');
      const lock = await redisService.retrieveLock(key);
      log.info('Lock acquired');

      const isReservation = await inventoryService.reservationProduct(
        {
          shop_id,
          product_id: product.id,
          quantity: product.quantity,
          order_id: newOrder.id,
        },
        session
      );
      if (!isReservation.modifiedCount) {
        throw new ApiError(StatusCodes.BAD_REQUEST, 'Some products have been updated, please come back to check');
      }
      log.info(`inventory of product ${product.id} is modified`);

      // minus quantity product
      await productService.minusQuantityProduct(product.id, product.quantity, session);

      // minus quantity product in cart
      await cartService.minusQuantityProduct(
        user_id,
        {
          product_id: product.id,
          quantity: -product.quantity,
        },
        session
      );
      log.info(`quantity product in cart, quantity product ${product.id} is modified`);
      await lock.release();
      log.info('Lock has been released, and is available for others to use');
    }

    if (coupon_codes && coupon_codes.length > 0) {
      for (const code of coupon_codes) {
        const couponUpdated = await couponService.updateCouponShopAfterUsed(
          { shop_id, user_id, code },
          session
        );
        log.debug('coupon updated %o', couponUpdated);
      }
    }
  }

  return {
    newOrder,
    userAddress,
    productsFlattened,
  };
}

export const orderService = {
  queryOrders,
  getOrderById,
  reviewOrder,
  createOrder,
  updateOrderById,
};
