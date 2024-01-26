import { Request } from 'express';
import { StatusCodes } from 'http-status-codes';
import { cartService } from '@/services';
import { catchAsync } from '@/utils';
import { DeleteProductCartBody } from '@/interfaces/models/cart';

const getCart = catchAsync(async (req, res) => {
  const cart = await cartService.getCartByUserId(req.user.id);
  await cart?.populate('items.shop', 'shop_name');
  await cart?.populate([
    {
      path: 'items.products.inventory',
      select: 'product variant stock price',
      populate: {
        path: 'product',
        select: 'images title',
      },
    },
    {
      path: 'items.products.variant',
      select: 'variant_group_name sub_variant_group_name',
    },
  ]);

  res.status(StatusCodes.OK).send({ cart });
});

const addProduct = catchAsync(async (req, res) => {
  await cartService.addProduct(req.user.id, req.body);
  res.status(StatusCodes.NO_CONTENT).send();
});

const updateProduct = catchAsync(async (req, res) => {
  const cart = await cartService.updateProduct(req.user.id, req.body);
  res.status(StatusCodes.OK).send({ cart });
});

const deleteProduct = catchAsync(async (
  req: Request<unknown, unknown, DeleteProductCartBody>,
  res
) => {
  await cartService.deleteProduct(req.user.id, req.body.inventory as string);
  res.status(StatusCodes.NO_CONTENT).send();
});

export const cartController = {
  addProduct,
  getCart,
  deleteProduct,
  updateProduct,
};
