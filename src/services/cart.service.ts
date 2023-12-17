// import mongoose from 'mongoose';
import { StatusCodes } from 'http-status-codes';
import { ICart, IProductCart } from '@/interfaces/models/cart';
import { Cart } from '@/models';
import { productService } from '@/services/product.service';
import { ApiError } from '@/utils';
import { IProduct } from '@/interfaces/models/product';

const getCartByUserId = async (user_id: ICart['user_id']) => {
  return Cart.findOne({ user_id });
};

async function createUserCart(user_id: ICart['user_id'], product: IProductCart) {
  const filter = { user_id };
  const updateOrInsert = {
    $addToSet: { products: product },
  };
  const options = { upsert: true, new: true };
  return Cart.findOneAndUpdate(filter, updateOrInsert, options);
}

async function deleteProductInCart(userId: ICart['user_id'], product_id: IProduct['id']) {
  const filter = { cart_user_id: userId };
  const update = {
    $pull: {
      products: { product_id },
    },
  };
  return Cart.updateOne(filter, update);
}

async function updateQuantityProduct(user_id: ICart['user_id'], product: IProductCart) {
  const { product_id, quantity } = product;
  if (quantity === 0) {
    return deleteProductInCart(user_id, product_id);
  }
  const filter = {
    user_id,
    'products.product_id': product_id,
  };
  const update = {
    $set: {
      'products.$.quantity': quantity,
    },
  };
  const options = { new: true };
  return Cart.findOneAndUpdate(filter, update, options);
}

/**
 * Add/Update to cart
 *
 * 1. create cart if user cart not exist
 *
 * 2. cart exists add product into cart
 *
 * 3. update quantity product if product already in cart
 */
async function addOrUpdateToCart(user_id: ICart['user_id'], product: IProductCart) {
  const productExist = await productService.getProductById(product.product_id);
  if (!productExist) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Product not found');
  }
  if (productExist.quantity < product.quantity) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Quantity of product is invalid');
  }

  const userCart = await getCartByUserId(user_id);
  if (!userCart || !userCart.products.length) {
    return createUserCart(user_id, product);
  }

  const isProductExists = userCart.products.some((prod) => {
    return prod.product_id.toString() === product.product_id;
  });
  if (!isProductExists) {
    return userCart.update(
      { $addToSet: { products: product } },
      { returnDocument: 'after' }
    );
  }
  return updateQuantityProduct(user_id, product);
}

export const cartService = {
  addOrUpdateToCart,
  getCartByUserId,
  updateQuantityProduct,
  deleteProductInCart,
};
