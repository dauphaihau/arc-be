import { ClientSession } from 'mongoose';
import { StatusCodes } from 'http-status-codes';
import {
  ICart,
  IProductCart,
  UpdateProductCartBody
} from '@/interfaces/models/cart';
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

async function deleteProduct(user_id: ICart['user_id'], product_id: IProduct['id']) {
  const filter = { user_id };
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
    return deleteProduct(user_id, product_id);
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

async function updateProduct(
  user_id: ICart['user_id'],
  productUpdate: UpdateProductCartBody
) {
  const { product_id, quantity } = productUpdate;
  const productInDB = await productService.getProductById(product_id);

  if (!productInDB) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Product not found');
  }

  if (quantity && quantity > productInDB.quantity) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Quantity of product have been exceed stock');
  }

  if (quantity === 0) {
    return deleteProduct(user_id, product_id);
  }

  const filter = {
    user_id,
    'products.product_id': product_id,
  };
  const set: { [key: string]: unknown } = {};
  Object.keys(productUpdate).forEach((key) => {
    set[`products.$.${key}`] = productUpdate[key as keyof typeof productUpdate];
  });
  const update = {
    $set: set,
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
async function addOrUpdateProduct(user_id: ICart['user_id'], product: IProductCart) {
  const productInDB = await productService.getProductById(product.product_id);
  if (!productInDB) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Product not found');
  }
  if (product.quantity > productInDB.quantity) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Quantity of product have been exceed stock');
  }

  const userCart = await getCartByUserId(user_id);
  if (!userCart || !userCart.products.length) {
    return createUserCart(user_id, product);
  }

  const isProductExistsInCart = userCart.products.some((prod) => {
    return prod.product_id.toString() === product.product_id;
  });
  if (!isProductExistsInCart) {
    return userCart.update(
      { $addToSet: { products: product } },
      { returnDocument: 'after' }
    );
  }
  return updateQuantityProduct(user_id, product);
}

async function minusQuantityProduct(
  user_id: ICart['user_id'],
  product: IProductCart,
  session: ClientSession
) {
  const { product_id, quantity } = product;
  if (quantity === 0) {
    return deleteProduct(user_id, product_id);
  }
  const filter = {
    user_id,
    'products.product_id': product_id,
  };
  const update = {
    $inc: {
      'cart_products.$.quantity': quantity,
      // cart_count_products: quantity,
    },
  };
  const options = { new: true, session };
  return Cart.findOneAndUpdate(filter, update, options);
}

export const cartService = {
  addOrUpdateProduct,
  getCartByUserId,
  minusQuantityProduct,
  deleteProduct,
  updateProduct,
};
