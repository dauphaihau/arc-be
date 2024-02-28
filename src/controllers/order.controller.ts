import { Request } from 'express';
import { StatusCodes } from 'http-status-codes';
import { PAYMENT_TYPES } from '@/config/enums/order';
import {
  IGetOrderParams,
  IGetSummaryOrderBody, CreateOrderForBuyNowBody, CreateOrderFromCartBody
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

const getListOrders = catchAsync(async (req, res) => {
  const filter = { user_id: req.user.id };
  const options = pick(req.query, ['sortBy', 'limit', 'page']);
  const result = await orderService.queryOrders(filter, options);
  res.send(result);
});

const getSummaryOrder = catchAsync(async (
  req: Request<unknown, unknown, IGetSummaryOrderBody>,
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
  req: Request<unknown, unknown, CreateOrderFromCartBody>,
  res
) => {
  await transactionWrapper(async (session) => {
    req.body.user = req.user.id;
    const result = await orderService.createOrderFromCart(req.body, session);
    if (req.body.payment_type === PAYMENT_TYPES.CARD) {
      const checkoutSessionUrl = await stripeService.getCheckoutSessionUrl(req.user, result);
      res.status(StatusCodes.OK).send({ checkoutSessionUrl });
      return;
    }
    res.status(StatusCodes.OK).send({ newOrder: result.newOrder });
  });
});

const createOrderForBuyNow = catchAsync(async (
  req: Request<unknown, unknown, CreateOrderForBuyNowBody>,
  res
) => {
  await transactionWrapper(async (session) => {
    req.body.user = req.user.id;
    const result = await orderService.createOrderForBuyNow(req.body, session);
    if (req.body.payment_type === PAYMENT_TYPES.CARD) {
      const checkoutSessionUrl = await stripeService.getCheckoutSessionUrl(req.user, result);
      res.status(StatusCodes.OK).send({ checkoutSessionUrl });
      return;
    }
    res.status(StatusCodes.OK).send({ newOrder: result.newOrder });
  });
});

export const orderController = {
  getOrder,
  getListOrders,
  createOrderFromCart,
  getSummaryOrder,
  createOrderForBuyNow,
};
