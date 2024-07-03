import { Request } from 'express';
import { StatusCodes } from 'http-status-codes';
import moment from 'moment';
import {
  RequestBody,
  RequestQuery
} from '@/interfaces/common/request';
import { log } from '@/config';
import { OrderShop } from '@/models/order-shop.model';
import { MARKETPLACE_CONFIG } from '@/config/enums/marketplace';
import { PAYMENT_TYPES } from '@/config/enums/order';
import {
  IGetOrderParams,
  IGetSummaryOrderBody,
  CreateOrderForBuyNowBody,
  CreateOrderFromCartBody
} from '@/interfaces/models/order';
import { orderService, inventoryService } from '@/services';
import { stripeService } from '@/services/stripe.service';
import {
  catchAsync, pick, transactionWrapper, ApiError
} from '@/utils';

const getOrder = catchAsync(async (
  req: Request<IGetOrderParams>,
  res
) => {
  const order = await orderService.getOrderById(req.params.id as string);
  res.status(StatusCodes.OK).send({ order });
});

const getOrderShopList = catchAsync(async (req, res) => {
  const filter = { user_id: req.user.id };
  const options = pick(req.query, ['sortBy', 'limit', 'page']);
  options['populate'] = [
    {
      path: 'order',
      match: { user: { $eq: req.user.id } },
      select: 'user address createdAt',
    },
    {
      path: 'shop',
      select: 'shop_name',
    },
    {
      path: 'products',
      populate: {
        path: 'product',
        model: 'Product',
        select: 'shipping',
        populate: {
          path: 'shipping',
          model: 'product_shipping',
        },
      },
    },
  ];
  const result = await orderService.queryOrderShopList(filter, options);

  const parseTimeShipping = (time: string) => {
    const typeTime = time.substring(0, time.length - 1);
    time = typeTime;
    const [from, to] = time.split('-');
    return {
      from: Number(from),
      to: Number(to),
      typeTime,
      max: Number(to) || Number(from),
    };
  };

  // Estimated delivery
  await Promise.all(
    result.results.map(async (orderShop) => {

      orderShop.from_countries = [];
      // address destination
      // const address = await Address.findById(orderShop.order.address);

      let estimatedDelivery = 0;

      orderShop.products.forEach((prod) => {
        if (prod?.product?.shipping) {

          if (
            orderShop?.from_countries &&
            !orderShop?.from_countries?.includes(prod.product.shipping.country)
          ) {
            orderShop.from_countries.push(prod.product.shipping.country);
          }

          // console.log('prod-product-shipping', prod?.product?.shipping);
          const { max: processTime } = parseTimeShipping(
            prod.product.shipping.process_time
          );

          prod.product.shipping.standard_shipping.forEach((ss) => {
            const { max: deliveryTime } = parseTimeShipping(
              ss.delivery_time
            );
            estimatedDelivery = Math.max(estimatedDelivery, processTime + deliveryTime);
          });
        }
      });
      orderShop.estimated_delivery = moment(orderShop.order.createdAt).add(estimatedDelivery, 'd').toDate();
    })
  );

  res.send(result);
});

const getSummaryOrder = catchAsync(async (
  req: RequestBody<IGetSummaryOrderBody>,
  res
) => {
  const { inventory, quantity, coupon_codes } = req.body;
  const inventoryInDB = await inventoryService.getInventoryById(inventory);
  if (!inventoryInDB) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Product not found');
  }
  await inventoryInDB?.populate('product');

  const tempCart = {
    user: req.user.id,
    items: [{
      shop: inventoryInDB.shop,
      products: [{
        is_select_order: true,
        quantity,
        inventory: inventoryInDB,
      }],
    }],
  };
  const tempAdditionInfoItems = [{ shop: inventoryInDB.shop, coupon_codes }];

  const { summaryOrder } = await orderService.getSummaryOrder(
    // @ts-expect-error:next-line
    tempCart,
    tempAdditionInfoItems
  );

  res.status(StatusCodes.OK).send({ summaryOrder });
});

const createOrderFromCart = catchAsync(async (
  req: RequestBody<CreateOrderFromCartBody>,
  res
) => {
  await transactionWrapper(async (session) => {
    req.body.user = req.user.id;
    const result = await orderService.createOrderFromCart(req.body, session);
    if (req.body.payment_type === PAYMENT_TYPES.CARD) {
      const currency = req.body.currency || MARKETPLACE_CONFIG.BASE_CURRENCY;
      const checkoutSessionUrl = await stripeService.getCheckoutSessionUrl(req.user, { ...result, currency });
      res.status(StatusCodes.OK).send({ checkoutSessionUrl });
      return;
    }
    for (const orderShop of result.orderShops) {
      await orderShop.populate('shop', 'shop_name');
    }
    res.status(StatusCodes.OK).send({
      order: result.newOrder,
      orderShops: result.orderShops,
    });
  });
});

const createOrderForBuyNow = catchAsync(async (
  req: RequestBody<CreateOrderForBuyNowBody>,
  res
) => {
  await transactionWrapper(async (session) => {
    req.body.user = req.user.id;
    const result = await orderService.createOrderForBuyNow(req.body, session);
    if (req.body.payment_type === PAYMENT_TYPES.CARD) {
      const currency = req.body.currency || MARKETPLACE_CONFIG.BASE_CURRENCY;
      const checkoutSessionUrl = await stripeService.getCheckoutSessionUrl(req.user, { ...result, currency });
      res.status(StatusCodes.OK).send({ checkoutSessionUrl });
      return;
    }
    await result.orderShops[0].populate('shop', 'shop_name');
    res.status(StatusCodes.OK).send({
      order: result.newOrder,
      orderShops: result.orderShops,
    });
  });
});

const getOrderByCheckoutSession = catchAsync(async (
  req: RequestQuery<{ session_id: string }>,
  res
) => {
  const checkoutSession = await stripeService.getCheckoutSession(req.query.session_id);
  if (!checkoutSession.metadata) {
    log.error('checkoutSession metadata be null');
    throw new ApiError(StatusCodes.UNPROCESSABLE_ENTITY);
  }
  const orderShops = await OrderShop
    .find({
      order: checkoutSession.metadata['order_id'] as string,
    })
    .select('shop')
    .populate({
      path: 'shop',
      select: 'shop_name',
    });
  if (orderShops.length === 0) {
    log.error('orderShops be empty list');
    throw new ApiError(StatusCodes.UNPROCESSABLE_ENTITY);
  }
  res.status(StatusCodes.OK).send({ orderShops });
});

export const orderController = {
  getOrder,
  getOrderShopList,
  createOrderFromCart,
  getSummaryOrder,
  createOrderForBuyNow,
  getOrderByCheckoutSession,
};
