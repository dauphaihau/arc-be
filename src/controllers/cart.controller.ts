import { Request } from 'express';
import { StatusCodes } from 'http-status-codes';
import { cartService } from '@/services';
import { catchAsync } from '@/utils';
import { DeleteProductCartBody } from '@/interfaces/models/cart';

const getCart = catchAsync(async (req, res) => {
  const cart = await cartService.getCartByUserId(req.user.id);
  res.status(StatusCodes.OK).send({ cart });
});

const addOrUpdateProduct = catchAsync(async (req, res) => {
  const cart = await cartService.addOrUpdateProduct(req.user.id, req.body);
  res.status(StatusCodes.OK).send({ cart });
});

const updateProduct = catchAsync(async (req, res) => {
  const cart = await cartService.updateProduct(req.user.id, req.body);
  res.status(StatusCodes.OK).send({ cart });
});

const deleteProduct = catchAsync(async (
  req: Request<unknown, unknown, DeleteProductCartBody>,
  res
) => {
  await cartService.deleteProduct(req.user.id, req.body.product_id);
  res.status(StatusCodes.NO_CONTENT).send();
});

export const cartController = {
  addOrUpdateProduct,
  getCart,
  deleteProduct,
  updateProduct,
};
