import { Request } from 'express';
import { StatusCodes } from 'http-status-codes';
import { cartService, orderService } from '@/services';
import { catchAsync } from '@/utils';
import {
  DeleteProductCartQueries,
  UpdateProductCartBody
} from '@/interfaces/models/cart';

const getCart = catchAsync(async (req, res) => {
  const { type } = req.query;
  if (type && type === 'header') {
    const result = await cartService.getProductsForHeader(req.user.id);
    res.status(StatusCodes.OK).send({ cart: result });
    return;
  }

  const cart = await cartService.getCartByUserId(req.user.id);
  if (!cart) {
    res.status(StatusCodes.OK).send({ cart });
    return;
  }
  cart.items = cart.items.sort((a, b) => {
    return new Date(b.createdAt).valueOf() - new Date(a.createdAt).valueOf();
  });
  const totalProducts = cart.items.reduce((init, item) => {
    init += item.products.length;
    return init;
  }, 0);

  const cartPopulated = await cartService.populateCart(cart);
  const { summaryOrder } = await orderService.getSummaryOrder(cartPopulated);

  res.status(StatusCodes.OK).send({
    cart, summaryOrder, totalProducts,
  });
});

const getCartWithCoupons = catchAsync(async (req, res) => {
  const cart = await cartService.getCartByUserId(req.user.id);
  if (!cart) {
    res.status(StatusCodes.OK).send({ cart });
    return;
  }
  let totalProducts = 0;
  cart.items.forEach(item => {
    totalProducts += item.products.length;
  });

  const cartPopulated = await cartService.populateCart(cart);
  const { summaryOrder } = await orderService.getSummaryOrder(cartPopulated, req.body);

  res.status(StatusCodes.OK).send({ cart, summaryOrder, totalProducts });
});

const addProduct = catchAsync(async (req, res) => {
  const cart = await cartService.addProduct(req.user.id, req.body);
  if (!cart) {
    res.status(StatusCodes.OK).send({ cart });
    return;
  }
  const cartPopulated = await cartService.populateCart(cart);
  const { summaryOrder } = await orderService.getSummaryOrder(cartPopulated);

  res.status(StatusCodes.OK).send({ summaryOrder });
});

const updateProduct = catchAsync(async (
  req: Request<unknown, unknown, UpdateProductCartBody>,
  res
) => {
  const { additionInfoItems, ...resBody } = req.body;
  const cart = await cartService.updateProduct(req.user.id, resBody);
  if (!cart) {
    res.status(StatusCodes.OK).send({ cart });
    return;
  }
  const cartPopulated = await cartService.populateCart(cart);
  const { summaryOrder } = await orderService.getSummaryOrder(cartPopulated, additionInfoItems);

  res.status(StatusCodes.OK).send({ summaryOrder });
});

const deleteProduct = catchAsync(async (
  req: Request<unknown, unknown, unknown, DeleteProductCartQueries>,
  res
) => {
  const cart = await cartService.deleteProduct(req.user.id, req.query.inventory);
  if (!cart) {
    res.status(StatusCodes.OK).send({ cart });
    return;
  }

  const cartPopulated = await cartService.populateCart(cart);
  const { summaryOrder } = await orderService.getSummaryOrder(cartPopulated);
  res.status(StatusCodes.OK).send({ summaryOrder });
});

export const cartController = {
  addProduct,
  getCart,
  deleteProduct,
  updateProduct,
  getCartWithCoupons,
};
