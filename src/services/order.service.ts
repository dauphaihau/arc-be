import { StatusCodes } from 'http-status-codes';
import { ClientSession } from 'mongoose';
import { log, env } from '@/config';
import {
  COUPONS_MAX_USE_PER_ORDER,
  COUPON_MIN_ORDER_TYPES,
  COUPON_TYPES
} from '@/config/enums/coupon';
import { SHIPPING_FEE_PERCENT } from '@/config/enums/order';
import { ICart, IProductCart } from '@/interfaces/models/cart';
import {
  IOrder,
  IUpdateOrderBody,
  CreateOrderBody,
  IOrderModel,
  IShopCodes
} from '@/interfaces/models/order';
import { IProduct } from '@/interfaces/models/product';
import { Order } from '@/models';
import { addressService } from '@/services/address.service';
import { cartService } from '@/services/cart.service';
import { couponService } from '@/services/coupon.service';
import { inventoryService } from '@/services/inventory.service';
import { redisService } from '@/services/redis.service';
import { ApiError, convertPrice } from '@/utils';

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
 * 1. map fields stand by for pay via card ( stripe )
 *
 * 2. calculate price each product
 *
 * 3. validate coupons & calculate discount total
 */

async function reviewOrder(payload: ICart, shopsCodes?: IShopCodes[]) {
  const { items, user } = payload;
  const tempOrder = {
    subTotalPrice: 0,
    subTotalAppliedDiscountPrice: 0,
    shippingFee: 0,
    totalDiscount: 0,
    totalPrice: 0,
    totalProducts: 0,
  };

  const shops: { [key: string]: IShopCodes['coupon_codes'] } = {};
  if (shopsCodes && shopsCodes.length > 0) {
    shopsCodes.forEach((ele) => {
      shops[ele.shop as string] = ele.coupon_codes;
    });
  }

  const itemsSelected = [];
  const itemNotSelected = [];

  for (const item of items) {
    const { shop, products = [] } = item;
    const coupon_codes = shops[item?.shop?.id as string] || [];
    const productsSelected: IProductCart[] = [];
    const productsNotSelect: IProductCart[] = [];

    products.forEach(prod => {
      return prod.is_select_order ? productsSelected.push(prod) : productsNotSelect.push(prod);
    });

    if (productsNotSelect.length > 0) {
      itemNotSelected.push({
        shop: item.shop,
        products: productsNotSelect,
      });
    }

    const productsMappedFields = productsSelected.map(ele => {
      const product = ele.inventory.product as IProduct;
      return {
        inventory: ele?.inventory?.id,
        quantity: ele.quantity,
        price: ele?.inventory?.price,
        title: product.title,
        image_url: env.aws_s3.host_bucket + '/' + product.images[0].relative_url,
      };
    });

    tempOrder.totalProducts += productsMappedFields.length;
    // itemsSelected.push({
    //   shop,
    //   products: productsMappedFields,
    // });

    let count_shop_products = 0;
    const subTotalPrice = productsMappedFields.reduce((acc, next) => {
      count_shop_products += next.quantity;
      return acc + (next.price * next.quantity);
    }, 0);
    tempOrder.subTotalPrice += convertPrice(subTotalPrice);
    tempOrder.shippingFee += convertPrice(subTotalPrice * SHIPPING_FEE_PERCENT);

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
          shop,
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
            `Shop ${shop} require order total must be large than ${coupon.min_order_value}`
          );
        }
        if (
          coupon.min_order_type === COUPON_MIN_ORDER_TYPES.NUMBER_OF_PRODUCTS &&
          productsMappedFields.length < (coupon.min_products as number) &&
          count_shop_products < (coupon.min_products as number)
        ) {
          throw new ApiError(
            StatusCodes.BAD_REQUEST,
            `Coupon ${coupon_code} require order must 
            be at least ${coupon.min_products} productsValid`
          );
        }

        let count_user_used_cp = 0;
        coupon.users_used?.forEach((user_used_coupon_id) => {
          if (user_used_coupon_id === user) {
            count_user_used_cp += 1;
          }
        });
        if (count_user_used_cp >= coupon.max_uses_per_user) {
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
        tempOrder.totalDiscount += convertPrice(discount);
      }

      if (
        coupon_codes.length === COUPONS_MAX_USE_PER_ORDER &&
        !coupon_types.includes(COUPON_TYPES.FREE_SHIP)
      ) {
        throw new ApiError(StatusCodes.BAD_REQUEST, 'The only coupon that can be used with another coupon is Free Shipping');
      }
    }

    tempOrder.subTotalAppliedDiscountPrice = convertPrice(
      tempOrder.subTotalPrice - tempOrder.totalDiscount
    );
    tempOrder.totalPrice = convertPrice(
      tempOrder.subTotalPrice - tempOrder.totalDiscount
    );

    itemsSelected.push({
      shop,
      products: productsMappedFields,
      coupon_codes,
    });
  }
  tempOrder.totalPrice += convertPrice(tempOrder.shippingFee);
  return {
    tempOrder,
    itemsSelected,
    itemNotSelected,
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
 * 2. reservation quantity product into inventory ( until user paid then clear reserves)
 *    acquire lock from redis to reserve
 *
 * 3. minus stock
 *
 * 4. update coupon if apply coupon
 *
 * 5. minus quantity product or remove item in cart
 *
 */
async function createOrder(
  payload: CreateOrderBody,
  session: ClientSession
) {
  const {
    user,
    address,
    payment_type,
    shops_codes,
  } = payload;

  const cart = await cartService.getCartByUserId(user);
  if (!cart) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Cart not found');
  }
  await cartService.populateCart(cart);

  const {
    tempOrder,
    itemsSelected,
    itemNotSelected,
  } = await reviewOrder(cart, shops_codes);

  const userAddress = await addressService.getAddressById(address);
  if (!userAddress || userAddress.user.toString() !== user) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Address not found');
  }

  const newOrderCreated = await Order.create([{
    user,
    address,
    payment_type,
    lines: itemsSelected,
    subtotal: tempOrder.subTotalPrice,
    shipping_fee: tempOrder.shippingFee,
    total_discount: tempOrder.totalDiscount,
    total: tempOrder.totalPrice,
  }], { session });
  const newOrder = newOrderCreated[0];

  for (const item of itemsSelected) {
    const { products = [], shop, coupon_codes = [] } = item;
    for (const product of products) {
      const key = `lock_v2024_${product.inventory}`;

      log.info('Asking for lock');
      const lock = await redisService.retrieveLock(key);
      log.info('Lock acquired');

      const isReservation = await inventoryService.reservationProduct(
        {
          inventoryId: product.inventory,
          order: newOrder.id,
          quantity: product.quantity,
        },
        session
      );
      if (!isReservation.modifiedCount) {
        throw new ApiError(StatusCodes.BAD_REQUEST, 'Some products have been updated, please come back to check');
      }

      // minus stock
      await inventoryService.minusStock(product.inventory, product.quantity, session);
      log.info(`inventory ${product.inventory} is modified`);

      await lock.release();
      log.info('Lock has been released, and is available for others to use');
    }

    if (coupon_codes && coupon_codes.length > 0) {
      await couponService.updateCouponsShopAfterUsed({
        shop, user, codes: coupon_codes,
      }, session);
    }
  }

  await cart.updateOne({ items: itemNotSelected }, session);

  return {
    newOrder,
    userAddress,
  };
}

export const orderService = {
  queryOrders,
  getOrderById,
  reviewOrder,
  createOrder,
  updateOrderById,
};
