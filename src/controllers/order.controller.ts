import { StatusCodes } from 'http-status-codes';
import { paymentService } from '@/services/payment.service';
import {
  RequestBody,
  RequestQueryParams, RequestParams
} from '@/interfaces/express';
import { log } from '@/config';
import { MARKETPLACE_CONFIG } from '@/config/enums/marketplace';
import { PAYMENT_TYPES } from '@/config/enums/order';
import {
  IOrder
} from '@/interfaces/models/order';
import { orderService, cartService, userAddressService } from '@/services';
import { stripeService } from '@/services/stripe.service';
import {
  catchAsync,
  transactionWrapper, ApiError, pick
} from '@/utils';
import { CreateOrderForBuyNowBody, CreateOrderFromCartBody } from '@/interfaces/request/order';
import { CustomMetaData } from '@/interfaces/services/stripe';
import { Order } from '@/models';

const getOrder = catchAsync(async (
  req: RequestParams<{ order_id: IOrder['id'] }>,
  res
) => {
  const order = await orderService.getOrderById(req.params.order_id);
  res.status(StatusCodes.OK).send({ order });
});

const getOrderShopList = catchAsync(async (req, res) => {
  const order_shops = await orderService.getOrderShopList(req.user.id);
  const new_order_shops = await orderService.calcShopShipping(order_shops);
  res.send({
    order_shops: new_order_shops,
  });
});

const createOrderFromCart = catchAsync(async (
  req: RequestBody<CreateOrderFromCartBody>,
  res
) => {
  await transactionWrapper(async (session) => {
    const user_id = req.user.id;
    const user_address_id = req.body.user_address_id;
    if (!user_id || !user_address_id) {
      throw new ApiError(StatusCodes.BAD_REQUEST, 'some fields are missing');
    }

    const cart = await cartService.getCart({
      user_id,
      product_cart_selected: true,
    });
    if (!cart) {
      throw new ApiError(StatusCodes.UNPROCESSABLE_ENTITY, 'Cart be undefined');
    }

    const summary_order = await cartService.getSummaryOrder(cart, req.body.addition_info_shop_carts);

    const root_order = await orderService.createRootOrder({
      user: user_id,
      user_address: user_address_id,
      subtotal: summary_order.subtotal_price,
      total_discount: summary_order.total_discount,
      total_shipping_fee: summary_order.total_shipping_fee,
      total: summary_order.total_price,
    }, session);

    const order_shops = await orderService.createOrderShops({
      root_order,
      shop_carts: cart.shop_carts,
    }, session);

    if (req.body.payment_type === PAYMENT_TYPES.CARD) {
      const checkout_session_url = await stripeService.createCheckoutSessionUrl({
        user: req.user,
        currency: req.body.currency || MARKETPLACE_CONFIG.BASE_CURRENCY,
        cart_id: cart.cart_id,
        root_order,
        order_shops,
      });
      res.status(StatusCodes.OK).send({ checkout_session_url });
      return;
    }
    else if (req.body.payment_type === PAYMENT_TYPES.CASH) {
      const payment = await paymentService.createPayment({
        user: user_id,
        order: root_order.id,
        currency: req.body.currency || MARKETPLACE_CONFIG.BASE_CURRENCY,
        type: PAYMENT_TYPES.CASH,
      }, session);
      await root_order.update({
        payment: payment.id,
      });
      await cartService.clearProductCartSelected(cart.cart_id, session);
      const responseOrderShops = [];
      for (const orderShop of order_shops) {
        await orderShop.update({
          payment: payment.id,
        });
        await orderShop.populate('shop', 'shop_name');
        responseOrderShops.push(pick(orderShop.toJSON(), ['id', 'shop']));
      }
      res.status(StatusCodes.OK).send({ order_shops: responseOrderShops });
    }
    res.status(StatusCodes.UNPROCESSABLE_ENTITY).send();
  });
});


const createOrderForBuyNow = catchAsync(async (
  req: RequestBody<CreateOrderForBuyNowBody>,
  res
) => {
  await transactionWrapper(async (session) => {
    const user_id = req.user.id;
    const { user_address_id, cart_id } = req.body;
    if (!user_address_id || !cart_id) {
      throw new ApiError(StatusCodes.BAD_REQUEST, 'some fields are missing');
    }

    const userAddress = await userAddressService.getById(user_address_id);
    if (!userAddress || userAddress.user.toString() !== user_id.toString()) {
      throw new ApiError(StatusCodes.NOT_FOUND, 'User Address not found');
    }

    const tempCart = await cartService.getCart({
      cart_id: req.body.cart_id,
    });
    if (!tempCart) {
      throw new ApiError(StatusCodes.UNPROCESSABLE_ENTITY, 'tempCart be undefined');
    }

    const shopCart = tempCart.shop_carts[0];
    const summary_order = await cartService.getSummaryOrder(tempCart, [{
      shop_id: shopCart.shop.id,
      promo_codes: req.body.promo_codes,
      note: req.body.note,
    }]);

    const root_order = await orderService.createRootOrder({
      user: user_id,
      user_address: userAddress.id,
      subtotal: summary_order.subtotal_price,
      total_discount: summary_order.total_discount,
      total_shipping_fee: summary_order.total_shipping_fee,
      total: summary_order.total_price,
    }, session);

    const order_shops = await orderService.createOrderShops({
      root_order,
      shop_carts: tempCart.shop_carts,
    }, session);

    if (req.body.payment_type === PAYMENT_TYPES.CARD) {
      const checkout_session_url = await stripeService.createCheckoutSessionUrl({
        user: req.user,
        currency: req.body.currency || MARKETPLACE_CONFIG.BASE_CURRENCY,
        cart_id: tempCart.cart_id,
        root_order,
        order_shops,
      });
      res.status(StatusCodes.OK).send({ checkout_session_url });
      return;
    }
    else if (req.body.payment_type === PAYMENT_TYPES.CASH) {
      const orderShop = order_shops[0];
      await orderShop.populate('shop', 'shop_name');
      res.status(StatusCodes.OK).send({
        order_shop: pick(orderShop.toJSON(), ['id', 'shop']),
      });
    }
    res.status(StatusCodes.UNPROCESSABLE_ENTITY).send();
  });
});

const getOrderByCheckoutSession = catchAsync(async (
  req: RequestQueryParams<{ session_id: string }>,
  res
) => {
  const checkoutSession = await stripeService.getCheckoutSession(req.query.session_id);
  log.debug('checkout-session %o', checkoutSession);
  const metadata = checkoutSession.metadata as CustomMetaData;
  if (!metadata) {
    log.error('checkoutSession metadata be null');
    throw new ApiError(StatusCodes.UNPROCESSABLE_ENTITY);
  }
  const order_shops = await Order
    .find({
      parent: metadata.order_id,
    })
    .select('shop')
    .populate({
      path: 'shop',
      select: 'shop_name',
    });
  if (order_shops.length === 0) {
    log.error('order_shops be empty list');
    throw new ApiError(StatusCodes.UNPROCESSABLE_ENTITY);
  }
  res.status(StatusCodes.OK).send({ order_shops });
});

export const orderController = {
  getOrder,
  getOrderShopList,
  createOrderFromCart,
  createOrderForBuyNow,
  getOrderByCheckoutSession,
};
