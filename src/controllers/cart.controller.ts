import { Request } from 'express';
import { StatusCodes } from 'http-status-codes';
import { cartService, orderService } from '@/services';
import { catchAsync } from '@/utils';
import { DeleteProductCartQueries } from '@/interfaces/models/cart';
import { log } from '@/config';

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
  await cartService.populateCart(cart);
  // log.debug('cart %o', cart);
  const { tempOrder } = await orderService.reviewOrder(cart);

  res.status(StatusCodes.OK).send({ cart, tempOrder, totalProducts });
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

  await cartService.populateCart(cart);
  const { tempOrder } = await orderService.reviewOrder(cart, req.body);
  res.status(StatusCodes.OK).send({ cart, tempOrder, totalProducts });
});

const addProduct = catchAsync(async (req, res) => {
  const cart = await cartService.addProduct(req.user.id, req.body);
  if (!cart) {
    res.status(StatusCodes.OK).send({ cart });
    return;
  }
  await cartService.populateCart(cart);
  const { tempOrder } = await orderService.reviewOrder(cart);
  res.status(StatusCodes.OK).send({ tempOrder });
});

const updateProduct = catchAsync(async (req, res) => {
  const cart = await cartService.updateProduct(req.user.id, req.body);
  if (!cart) {
    res.status(StatusCodes.OK).send({ cart });
    return;
  }
  await cartService.populateCart(cart);
  const { tempOrder } = await orderService.reviewOrder(cart);

  res.status(StatusCodes.OK).send({ tempOrder });
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
  await cartService.populateCart(cart);
  log.debug('cart %o', cart);
  const { tempOrder } = await orderService.reviewOrder(cart);
  res.status(StatusCodes.OK).send({ tempOrder });
});

export const cartController = {
  addProduct,
  getCart,
  deleteProduct,
  updateProduct,
  getCartWithCoupons,
};
