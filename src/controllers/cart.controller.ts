import { Request } from 'express';
import { StatusCodes } from 'http-status-codes';
import { cartService } from '@/services';
import { catchAsync } from '@/utils';
import { DeleteProductCartBody } from '@/interfaces/models/cart';

const getCart = catchAsync(async (req, res) => {
  const cart = await cartService.getCartByUserId(req.user.id);
  res.status(StatusCodes.OK).send({ cart });
});

const addOrUpdateToCart = catchAsync(async (req, res) => {
  const cart = await cartService.addOrUpdateToCart(req.user.id, req.body);
  res.status(StatusCodes.OK).send({ cart });
});

const updateQuantityProduct = catchAsync(async (req, res) => {
  const cart = await cartService.updateQuantityProduct(req.user.id, req.body);
  res.status(StatusCodes.OK).send({ cart });
});

const deleteProductInCart = catchAsync(async (
  req: Request<unknown, unknown, DeleteProductCartBody>,
  res
) => {
  await cartService.deleteProductInCart(req.user.id, req.body.product_id);
  res.status(StatusCodes.NO_CONTENT).send();
});

export const cartController = {
  addOrUpdateToCart,
  getCart,
  updateQuantityProduct,
  deleteProductInCart,
};
