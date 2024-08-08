import { StatusCodes } from 'http-status-codes';
import {
  UpdateProductCartBody,
  AddProductCartBody
} from '@/interfaces/request/cart';
import { RequestBody, RequestQueryParams } from '@/interfaces/express';
import { IProductCart } from '@/interfaces/models/cart';
import { cartService } from '@/services';
import { catchAsync } from '@/utils';

const getCart = catchAsync(async (
  req: RequestQueryParams<{ cart_id: string }>,
  res
) => {
  const cart = await cartService.getCart({
    cart_id: req.query.cart_id,
    user_id: req.user.id,
  });
  if (cart === null) {
    res.status(StatusCodes.OK).send({ cart });
    return;
  }
  const summary_order = await cartService.getSummaryOrder(cart);
  res.status(StatusCodes.OK).send({
    cart,
    summary_order,
  });
});

const addProduct = catchAsync(async (
  req: RequestBody<AddProductCartBody>,
  res
) => {
  if (req.body.is_temp) {
    const tempCartCreated = await cartService.createTempUserCart(req.user.id, req.body);
    const tempCart = await cartService.getCart({ cart_id: tempCartCreated.id });
    if (tempCart === null) {
      res.status(StatusCodes.UNPROCESSABLE_ENTITY).send();
      return;
    }
    const summary_order = await cartService.getSummaryOrder(tempCart);
    res.status(StatusCodes.OK).send({
      cart: tempCart,
      summary_order,
    });
    return;
  }

  await cartService.addProduct(req.user.id, req.body);
  const cart = await cartService.getCart({ user_id: req.user.id });
  const summary_order = await cartService.getSummaryOrder(cart);

  res.status(StatusCodes.OK).send({ cart, summary_order });
});

const updateCart = catchAsync(async (
  req: RequestBody<UpdateProductCartBody>,
  res
) => {
  const {
    quantity, inventory_id, cart_id,
  } = req.body;

  if (cart_id) {
    if (typeof quantity === 'number') {
      await cartService.updateProductTempCart(cart_id, quantity);
    }
    const tempCart = await cartService.getCart({ cart_id });
    const shopCart = tempCart?.shop_carts[0];

    const tempAdditionInfoShopCarts = [];
    if (req.body.addition_info_temp_cart && shopCart) {
      tempAdditionInfoShopCarts.push({
        shop_id: shopCart.shop.id,
        coupon_codes: req.body.addition_info_temp_cart.promo_codes,
        note: req.body.addition_info_temp_cart.note,
      });
    }
    const summary_order = await cartService.getSummaryOrder(tempCart, tempAdditionInfoShopCarts);
    res.status(StatusCodes.OK).send({ summary_order });
    return;
  }
  else if (
    inventory_id && (Object.hasOwn(req.body, 'quantity') || Object.hasOwn(req.body, 'is_select_order'))
  ) {
    await cartService.updateProduct(req.user.id, req.body);
  }
  const cart = await cartService.getCart({ user_id: req.user.id });
  const summary_order = await cartService.getSummaryOrder(cart, req.body.addition_info_shop_carts);

  res.status(StatusCodes.OK).send({
    cart,
    summary_order,
  });
});

const deleteProduct = catchAsync(async (
  req: RequestQueryParams<{ inventory_id: IProductCart['inventory'] }>,
  res
) => {
  await cartService.deleteProduct(req.user.id, req.query.inventory_id);
  const cart = await cartService.getCart({ user_id: req.user.id });
  if (!cart) {
    res.status(StatusCodes.OK).send({ cart });
    return;
  }
  const summary_order = await cartService.getSummaryOrder(cart);

  res.status(StatusCodes.OK).send({ cart, summary_order });
});

export const cartController = {
  addProduct,
  getCart,
  deleteProduct,
  updateCart,
};
