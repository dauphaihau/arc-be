import { Request } from 'express';
import { StatusCodes } from 'http-status-codes';
import { cartService, orderService } from '@/services';
import { catchAsync } from '@/utils';
import { DeleteProductCartBody } from '@/interfaces/models/cart';

const getCart = catchAsync(async (req, res) => {

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
  await cartService.addProduct(req.user.id, req.body);
  res.status(StatusCodes.NO_CONTENT).send();
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
  req: Request<unknown, unknown, DeleteProductCartBody>,
  res
) => {
  const cart = await cartService.deleteProduct(req.user.id, req.body.inventory);
  if (!cart) {
    res.status(StatusCodes.OK).send({ cart });
    return;
  }
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
