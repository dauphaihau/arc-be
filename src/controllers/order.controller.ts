import { Request } from 'express';
import { StatusCodes } from 'http-status-codes';
import { PAYMENT_TYPES } from '@/config/enums/order';
import {
  IGetOrderParams,
  CreateOrderBody
} from '@/interfaces/models/order';
import { orderService } from '@/services';
import { stripeService } from '@/services/stripe.service';
import { catchAsync, pick, transactionWrapper } from '@/utils';

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

const createOrder = catchAsync(async (
  req: Request<unknown, unknown, CreateOrderBody>,
  res
) => {
  await transactionWrapper(async (session) => {
    req.body.user = req.user.id;
    const result = await orderService.createOrder(req.body, session);
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
  createOrder,
};
