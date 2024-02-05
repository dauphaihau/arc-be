// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import { ClientSession } from 'mongoose';
import { StatusCodes } from 'http-status-codes';
import { productService } from '@/services/product.service';
import { log } from '@/config';
import { IProductInventory } from '@/interfaces/models/product';
import { inventoryService } from '@/services/inventory.service';
import {
  ICart,
  IItemCart,
  IMinusQtyProdCart,
  IProductCart,
  UpdateProductCartBody
} from '@/interfaces/models/cart';
import { Cart, ProductInventory } from '@/models';
import { ApiError } from '@/utils';

const getCartByUserId = async (userId: ICart['user']) => {
  return Cart.findOne({ user: userId });
};

const populateCart = async (cart: ICart) => {
// const populateCart = async (cart: ICartModel) => {
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
};

async function createUserCart(
  userId: ICart['user'],
  shopId: IItemCart['shop'],
  product: IProductCart
) {
  const filter = { user: userId };
  const updateOrInsert = {
    // $inc: {
    //   count_products: product.quantity,
    // },
    $addToSet: {
      items: {
        shop: shopId,
        products: [product],
      },
    },
  };
  const options = { upsert: true, new: true };
  return Cart.findOneAndUpdate(filter, updateOrInsert, options);
}

async function deleteProduct(
  userId: ICart['user'],
  inventoryId: IProductInventory
) {
  const inventoryInDB = await ProductInventory.findById(inventoryId);
  if (!inventoryInDB || !inventoryInDB.shop) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Product not found');
  }
  const filter = {
    user: userId,
    'items.shop': inventoryInDB.shop,
  };
  const update = {
    $pull: {
      'items.$.products': {
        inventory: inventoryInDB.id,
      },
    },
  };
  const options = { new: true };
  const cartUpdated = await Cart.findOneAndUpdate(filter, update, options);

  if (cartUpdated) {
    const itemCart = cartUpdated.items.find((item) => {
      if (item.shop && inventoryInDB.shop) {
        return item.shop.toString() === inventoryInDB.shop.toString();
      }
      return null;
    });
    log.debug('item-cart %o', itemCart);
    if (itemCart && !itemCart.products.length) {
      log.info('pull item-shop cause by products is empty');
      const update = {
        $pull: {
          items: {
            shop: inventoryInDB.shop.toString(),
          },
        },
      };
      return Cart.findOneAndUpdate({ user: userId }, update, { new: true });
    }
  }
  return cartUpdated;
}

async function updateProduct(
  userId: ICart['user'],
  productUpdate: UpdateProductCartBody
) {
  const { quantity, inventory } = productUpdate;

  if (quantity === 0) {
    return deleteProduct(userId, inventory);
  }

  const foundPI = await inventoryService.getInventoryById(inventory);

  if (!foundPI) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Product not found');
  }

  if (quantity && quantity > foundPI.stock) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Quantity of product have been exceed stock');
  }

  const filter = {
    user: userId,
    'items.shop': foundPI.shop,
  };
  const set: { [key: string]: unknown } = {};
  Object.keys(productUpdate).forEach((key) => {
    set[`items.$[e1].products.$[e2].${key}`] = productUpdate[key as keyof typeof productUpdate];
  });
  const update = {
    $set: set,
  };
  const options = {
    arrayFilters: [
      { 'e1.shop': foundPI.shop },
      { 'e2.inventory': foundPI.id },
    ],
    new: true,
  };
  return Cart.findOneAndUpdate(filter, update, options);
}

/**
 * Add/Update to cart
 *
 * create cart, add item if user cart not exist
 *
 * cart exists add item into cart
 *
 * if cart exist, item cart not exist, add new item into cart
 *
 * if cart, item exist, add new product into item
 *
 */
async function addProduct(userId: ICart['user'], payload: IProductCart) {

  const inventoryInDB = await inventoryService.getInventoryById(payload.inventory);
  if (payload?.variant) {
    const variantInDB = await productService.getProductVariantById(payload.variant);
    log.debug('variant-in-db %o', variantInDB);
    if (
      !inventoryInDB || !variantInDB || !inventoryInDB?.product ||
      (variantInDB.product.toString() !== inventoryInDB.product.toString())
    ) {
      throw new ApiError(StatusCodes.BAD_REQUEST, 'Product is invalid');
    }
  }
  log.debug('inventory-in-db %o', inventoryInDB);

  if (!inventoryInDB) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Product not found');
  }
  if (payload.quantity > inventoryInDB.stock) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Quantity of product have been exceed stock');
  }

  const userCart = await getCartByUserId(userId);
  log.debug('user-cart %o', userCart);
  if (!userCart || !userCart.items.length) {
    log.info('none-user-cart');
    return createUserCart(userId, inventoryInDB.shop, payload);
  }

  const itemCart = userCart.items.find((item) => {
    if (item.shop && inventoryInDB.shop) {
      return item.shop.toString() === inventoryInDB.shop.toString();
    }
    return null;
  });
  log.debug('item-cart %o', itemCart);
  if (!itemCart) {
    return createUserCart(userId, inventoryInDB.shop, payload);
  }

  const productCart = itemCart.products.find((prod) => {
    return prod.inventory.toString() === inventoryInDB.id.toString();
  });
  log.debug('product-cart %o', productCart);
  if (!productCart) {
    return Cart.findOneAndUpdate(
      {
        user: userId,
        'items.shop': inventoryInDB.shop,
      },
      {
        $addToSet: {
          'items.$.products': payload,
        },
      }
    );
  }

  if ((payload.quantity + productCart.quantity) > inventoryInDB.stock) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Quantity of product have been exceed stock');
  }
  return userCart.update(
    {
      $inc: {
        'items.$[e1].products.$[e2].quantity': payload.quantity,
      },
    },
    {
      arrayFilters: [
        { 'e1.shop': inventoryInDB.shop },
        { 'e2.inventory': inventoryInDB.id },
      ],
    }
  );
}

async function minusQuantityProduct(
  userId: ICart['user'],
  payload: IMinusQtyProdCart,
  session: ClientSession
) {
  const { shop, inventory, quantity } = payload;
  if (quantity === 0) {
    return deleteProduct(userId, inventory);
  }

  const filter = {
    user: userId,
    'items.shop': shop,
  };
  const update = {
    $inc: {
      'items.$[e1].products.$[e2].quantity': quantity,
    },
  };
  const options = {
    arrayFilters: [
      { 'e1.shop': shop },
      { 'e2.inventory': inventory },
    ],
    new: true,
    session,
  };
  return Cart.findOneAndUpdate(filter, update, options);
}

export const cartService = {
  addProduct,
  getCartByUserId,
  minusQuantityProduct,
  deleteProduct,
  updateProduct,
  populateCart,
};
