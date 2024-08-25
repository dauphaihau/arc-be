import { StatusCodes } from 'http-status-codes';
import mongoose, { ClientSession } from 'mongoose';
import { log } from '@/config';
import {
  COUPON_TYPES,
  COUPON_APPLIES_TO,
  COUPONS_MAX_USE_PER_ORDER,
  COUPON_MIN_ORDER_TYPES
} from '@/config/enums/coupon';
import { PERCENT_SHIPPING_FEE_STANDARD } from '@/config/enums/order';
import {
  ICartDoc,
  IShopCart,
  IProductCart,
  ICart
} from '@/interfaces/models/cart';
import { IProduct } from '@/interfaces/models/product';
import { IShopDoc } from '@/interfaces/models/shop';
import {
  ProductCartToAdd,
  RequestAddProductCart,
  RequestUpdateCart
} from '@/interfaces/request/cart';
import {
  GetCartAggregate,
  ShopCart, GetCartFilter, SummaryOrder, AdditionInfoShopCart
} from '@/interfaces/services/cart';
import { GetSaleCouponByShopIdsAggregate } from '@/interfaces/services/coupon';
import { ElementType } from '@/interfaces/utils';
import {
  Cart, ProductInventory, Product, Shop, Coupon
} from '@/models';
import { couponService } from '@/services/coupon.service';
import { productInventoryService } from '@/services/product-inventory.service';
import { ApiError, roundNumAndFixed, pick } from '@/utils';

const getCartByUserId = async (userId: ICartDoc['user']) => {
  return Cart.findOne({ user: userId });
};

const getById = async (id: ICart['id']) => {
  return Cart.findById(id);
};

async function createUserCart(
  userId: ICartDoc['user'],
  shopId: IShopCart['shop'],
  productCart: ProductCartToAdd,
  otherOptions?: mongoose.QueryOptions
) {
  const filter = { user: userId };
  const updateOrInsert = {
    $addToSet: {
      items: {
        shop: shopId,
        products: [productCart],
      },
    },
  };
  const options = { upsert: true, ...otherOptions };
  return Cart.findOneAndUpdate(filter, updateOrInsert, options);
}

async function deleteProduct(
  userId: ICartDoc['user'],
  inventoryId?: IProductCart['inventory']
) {
  const inventoryInDB = await ProductInventory.findById(inventoryId);
  if (!inventoryInDB || !inventoryInDB.shop) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Product not found');
  }
  const filter = {
    user: userId,
    is_temp: false,
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
  if (!cartUpdated) {
    throw new ApiError(StatusCodes.UNPROCESSABLE_ENTITY, 'Delete product cart failed');
  }

  const itemCart = cartUpdated.items.find((item) => {
    if (item.shop && inventoryInDB.shop) {
      return item.shop.toString() === inventoryInDB.shop.toString();
    }
    return null;
  });
  if (itemCart && !itemCart.products.length) {
    // log.info('pull item-shop cause by products is empty');
    const update = {
      $pull: {
        items: {
          shop: inventoryInDB.shop.toString(),
        },
      },
    };
    await Cart.findOneAndUpdate({ user: userId }, update);
  }
}

async function updateProduct(
  userId: ICartDoc['user'],
  productUpdate: RequestUpdateCart['body']
) {
  const productUpdatePickEd = pick(productUpdate, ['quantity', 'inventory_id', 'is_select_order']);
  const { quantity, inventory_id } = productUpdatePickEd;

  if (quantity === 0) {
    await deleteProduct(userId, inventory_id);
    return;
  }

  const inventory = await productInventoryService.getById(inventory_id);

  if (!inventory) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Product not found');
  }

  if (quantity && quantity > inventory.stock) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Quantity of product have been exceed stock');
  }

  const filter = {
    user: userId,
    is_temp: false,
    'items.shop': inventory.shop,
  };
  const set: { [key: string]: unknown } = {};
  Object.keys(productUpdatePickEd).forEach((key) => {
    set[`items.$[e1].products.$[e2].${key}`] = productUpdatePickEd[key as keyof typeof productUpdatePickEd];
  });
  const update = {
    $set: set,
  };
  const options = {
    arrayFilters: [
      { 'e1.shop': inventory.shop },
      { 'e2.inventory': inventory.id },
    ],
  };
  // return Cart.findOneAndUpdate(filter, update, options);
  const updated = await Cart.findOneAndUpdate(filter, update, options);
  log.debug('updated %o', updated);
  if (!updated) {
    throw new ApiError(StatusCodes.UNPROCESSABLE_ENTITY, 'Update product cart failed');
  }
}

async function updateProductTempCart(
  cartId: ICart['id'],
  quantity: number
) {
  const tempCart = await getById(cartId);
  if (!tempCart) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Cart not found');
  }
  const productCart = tempCart.items[0].products[0];
  const inventory = await productInventoryService.getById(productCart.inventory);

  if (quantity === 0) {
    throw new ApiError(StatusCodes.UNPROCESSABLE_ENTITY);
  }
  if (!inventory) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Product not found');
  }

  if (quantity && quantity > inventory.stock) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Quantity of product have been exceed stock');
  }

  const filter = {
    _id: cartId,
    'items.shop': inventory.shop,
  };
  const update = {
    $set: {
      'items.$[e1].products.$[e2].quantity': quantity,
    },
  };
  const options = {
    arrayFilters: [
      { 'e1.shop': inventory.shop },
      { 'e2.inventory': inventory.id },
    ],
  };
  return Cart.findOneAndUpdate(filter, update, options);
}

/**
 * Adds or updates a product to the user's cart.
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
async function addProduct(
  userId: ICartDoc['user'],
  body: RequestAddProductCart['body']
) {
  const inventoryInDB = await productInventoryService.getById(body.inventory_id);

  if (!inventoryInDB) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Product not found');
  }

  const productCart: ProductCartToAdd = {
    quantity: body.quantity,
    inventory: inventoryInDB.id,
    product: inventoryInDB.product,
  };

  if (body.quantity > inventoryInDB.stock) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Quantity of product have been exceed stock');
  }

  const userCart = await getCartByUserId(userId);
  if (!userCart || !userCart.items.length) {
    log.info('case not found user cart');
    return createUserCart(userId, inventoryInDB.shop, productCart);
  }

  const shopCart = userCart.items.find((item) => {
    if (item.shop && inventoryInDB.shop) {
      return item.shop.toString() === inventoryInDB.shop.toString();
    }
    return null;
  });
  if (!shopCart) {
    log.info('case not found shop cart');
    return createUserCart(userId, inventoryInDB.shop, productCart);
  }

  const productCartInDB = shopCart.products.find((prod) => {
    return prod.inventory.toString() === inventoryInDB.id.toString();
  });
  if (!productCartInDB) {
    log.info('case not found product cart');
    return Cart.findOneAndUpdate(
      {
        user: userId,
        'items.shop': inventoryInDB.shop,
      },
      {
        $addToSet: {
          'items.$.products': productCart,
        },
      }
    );
  }

  if ((body.quantity + productCartInDB.quantity) > inventoryInDB.stock) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Quantity of product have been exceed stock');
  }
  log.info('case update qty product cart');
  return Cart.findOneAndUpdate(
    {
      user: userId,
    },
    {
      $inc: {
        'items.$[e1].products.$[e2].quantity': body.quantity,
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

async function clearProductCartSelected(
  cartId: ICart['id'],
  session: ClientSession
) {
  const cart = await getById(cartId);
  if (!cart) {
    log.error('cart not found');
    return;
  }
  if (cart.is_temp) {
    await cart.remove({ session });
    return;
  }
  const cartJSON = cart.toJSON<ICartDoc>();
  const newShopCarts: IShopCart[] = [];
  cartJSON.items.forEach(item => {
    const products = item.products.filter(product => !product.is_select_order);
    if (products.length > 0) {
      newShopCarts.push({ ...item, products });
    }
  });
  log.debug('new-shop-carts %o', newShopCarts);
  await cart.update({
    items: newShopCarts,
  }, { session });
}

async function createTempUserCart(
  userId: ICartDoc['user'],
  body: RequestAddProductCart['body']
) {
  const { inventory_id, quantity } = body;
  const inventoryInDB = await productInventoryService.getById(inventory_id);
  if (!inventoryInDB) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Product not found');
  }

  const tempCart = await Cart.create({
    user: userId,
    items: [
      {
        shop: inventoryInDB.shop,
        products: [{
          product: inventoryInDB.product,
          inventory: inventoryInDB,
          quantity,
        }],
      },
    ],
    is_temp: true,
  });

  return tempCart.toJSON<ICartDoc>();
}

const getCart = async (
  filter: GetCartFilter
) => {
  const shopCartLimit = 6;

  const matchShopCarts: mongoose.PipelineStage.Match = {
    $match: {
      $or: [
        { product_cart_selected: true },
        { product_cart_selected: false },
      ],
    },
  };
  const matchCart: mongoose.PipelineStage.Match = {
    $match: {},
  };

  if (filter.product_cart_selected) {
    matchShopCarts.$match['product_cart_selected'] = filter.product_cart_selected;
  }

  if (filter.cart_id) {
    matchCart.$match = {
      _id: new mongoose.Types.ObjectId(filter.cart_id),
    };
  }
  else {
    matchCart.$match = {
      user: new mongoose.Types.ObjectId(filter.user_id),
      is_temp: false,
    };
  }

  const cartAgg = await Cart.aggregate<GetCartAggregate>([
    matchCart,
    { $unwind: '$items' },
    { $unwind: '$items.products' },
    {
      $lookup: {
        from: ProductInventory.collection.name,
        localField: 'items.products.inventory',
        foreignField: '_id',
        as: 'inventory_docs',
        pipeline: [
          {
            $project: {
              _id: 0,
              id: '$_id',
              product: 1,
              variant: 1,
              price: 1,
              stock: 1,
              sku: 1,
            },
          },
          {
            $addFields: {
              sale_price: 0,
            },
          },
        ],
      },
    },
    {
      $lookup: {
        from: Product.collection.name,
        localField: 'items.products.product',
        foreignField: '_id',
        as: 'product_docs',
        pipeline: [
          {
            $addFields: {
              image: { $arrayElemAt: ['$images', 0] },
            },
          },
          {
            $project: {
              _id: 0,
              id: {
                $toString: '$_id',
              },
              title: 1,
              variant_type: 1,
              variant_group_name: 1,
              variant_sub_group_name: 1,
              image: {
                relative_url: 1,
              },
            },
          },
        ],
      },
    },
    {
      $addFields: {
        product_cart_qty: '$items.products.quantity',
        product_cart_selected: '$items.products.is_select_order',
        inventory_doc: { $arrayElemAt: ['$inventory_docs', 0] },
        product_doc: { $arrayElemAt: ['$product_docs', 0] },
      },
    },
    {
      $facet: {
        products_recent_update: [
          {
            $sort: { 'items.products.updated_at': -1 },
          },
          {
            $project: {
              _id: 0,
              quantity: '$items.products.quantity',
              inventory: {
                variant: '$inventory_doc.variant',
              },
              product: {
                id: '$product_doc.id',
                title: '$product_doc.title',
                image: '$product_doc.image',
              },
            },
          },
          { $limit: 3 },
        ],
        shop_carts: [
          matchShopCarts,
          {
            $sort: { 'items.products.updated_at': -1 },
          },
          {
            $lookup: {
              from: Shop.collection.name,
              localField: 'items.shop',
              foreignField: '_id',
              as: 'shop_docs',
              pipeline: [
                {
                  $project: {
                    _id: 0,
                    id: {
                      $toString: '$_id',
                    },
                    shop_name: 1,
                  },
                },
              ],
            },
          },
          {
            $addFields: {
              'product_cart.product': '$product_doc',
              'product_cart.inventory': '$inventory_doc',
              'product_cart.quantity': '$product_cart_qty',
              'product_cart.is_select_order': '$product_cart_selected',
              'product_cart.price': {
                $multiply: ['$inventory_doc.price', '$product_cart_qty'],
              },
              'product_cart.percent_coupon': null,
              'product_cart.freeship_coupon': null,
            },
          },
          {
            $group: {
              _id: '$items.shop',
              updated_at: { $first: '$items.updated_at' },
              shop_docs: {
                $first: '$shop_docs',
              },
              products: {
                $push: '$product_cart',
              },
              subtotal_price: {
                $sum: {
                  $cond: [
                    { $eq: ['$product_cart_selected', true] },
                    { $multiply: ['$inventory_doc.price', '$product_cart_qty'] },
                    0,
                  ],
                },
              },
            },
          },
          {
            $sort: {
              updated_at: -1,
            },
          },
          {
            $project: {
              _id: 0,
              shop: {
                $arrayElemAt: ['$shop_docs', 0],
              },
              subtotal_price: 1,
              total_price: '$subtotal_price',
              products: 1,
            },
          },
          {
            $addFields: {
              total_discount: 0,
              total_shipping_fee: 0,
            },
          },
          {
            $limit: shopCartLimit,
          },
        ],
        summary_cart: [
          {
            $group: {
              _id: null,
              cart_id: { $first: '$_id' },
              user_id: { $first: '$user' },
              total_products: { $count: {} },
              shop_ids: {
                $push: '$items.shop',
              },
              total_products_selected: {
                $sum: {
                  $cond: [{ $eq: ['$product_cart_selected', true] }, 1, 0],
                },
              },
              subtotal_price: {
                $sum: {
                  $cond: [
                    { $eq: ['$product_cart_selected', true] },
                    { $multiply: ['$inventory_doc.price', '$product_cart_qty'] },
                    0,
                  ],
                },
              },
            },
          },
        ],
      },
    },
    {
      $set: {
        summary_cart: {
          $ifNull: [
            { $arrayElemAt: ['$summary_cart', 0] },
            null,
          ],
        },
      },
    },
    {
      $project: {
        cart_id: '$summary_cart.cart_id',
        user_id: '$summary_cart.user_id',
        products_recent_update: 1,
        shop_carts: 1,
        summary_cart: {
          total_products: 1,
          total_products_selected: 1,
          subtotal_price: 1,
          shop_ids: 1,
        },
      },
    },
  ]);
  if (cartAgg.length === 0) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Cart not found');
  }
  const cart = cartAgg[0];
  // log.debug('cart %o', cart);
  if (cart.shop_carts.length > 0) {
    return cart;
  }
  return null;
};

async function applySaleCoupons(
  cart: GetCartAggregate,
  summary_order: SummaryOrder
) {
  const shops = await couponService.getSaleCouponByShopIds(cart.summary_cart.shop_ids);
  if (shops.length === 0) return;

  const shopsMap = new Map<IShopDoc['id'], GetSaleCouponByShopIdsAggregate['coupons']>(
    shops.map(shop => [shop._id.toString(), shop.coupons])
  );

  const subtotalPriceShopCartsMap = new Map<IShopDoc['id'], ShopCart['subtotal_price']>(
    cart.shop_carts.map(sc => [sc.shop.id, sc.subtotal_price])
  );

  type SaleCoupon = ElementType<GetSaleCouponByShopIdsAggregate['coupons']>;

  for (const shopCart of cart.shop_carts) {
    const shopId = shopCart.shop.id;
    const coupons = shopsMap.get(shopId);
    if (!coupons || coupons.length === 0) continue;

    // region map coupons
    let percentCouponAppliesAll: SaleCoupon | undefined = undefined;
    const productPercentCouponSpecificMap = new Map<IProduct['id'], SaleCoupon>();

    let freeShipCouponAppliesAll: SaleCoupon | undefined = undefined;
    const productFreeShipCouponSpecificMap = new Map<IProduct['id'], SaleCoupon>();

    for (const coupon of coupons) {
      if (coupon.type === COUPON_TYPES.PERCENTAGE) {

        // assign if coupon undefined or current percent coupon < next percent coupon
        if (coupon.applies_to === COUPON_APPLIES_TO.ALL) {
          if (!percentCouponAppliesAll || (coupon.percent_off > percentCouponAppliesAll.percent_off)) {
            percentCouponAppliesAll = coupon;
          }
        }
        else if (coupon.applies_to === COUPON_APPLIES_TO.SPECIFIC && coupon.applies_product_ids) {
          for (const productId of coupon.applies_product_ids) {
            const productPercentCoupon = productPercentCouponSpecificMap.get(productId.toString());
            if (
              !productPercentCoupon ||
                (productPercentCoupon && coupon.percent_off > productPercentCoupon.percent_off)
            ) {
              productPercentCouponSpecificMap.set(productId.toString(), coupon);
            }
          }
        }
      }
      else if (coupon.type === COUPON_TYPES.FREE_SHIP && !freeShipCouponAppliesAll) {
        if (coupon.applies_to === COUPON_APPLIES_TO.ALL) {
          freeShipCouponAppliesAll = coupon;
        }
        else if (coupon.applies_to === COUPON_APPLIES_TO.SPECIFIC && coupon.applies_product_ids) {
          for (const prodId of coupon.applies_product_ids) {
            productFreeShipCouponSpecificMap.set(prodId.toString(), coupon);
          }
        }
      }
    }
    // endregion

    // plus up when product cart have free ship coupon
    let tempSubtotalPriceShopCart = 0;

    log.debug('product-percent-coupon-specific-map %o', productPercentCouponSpecificMap);
    log.debug('percent-coupon-applies-all %o', percentCouponAppliesAll);

    for (const productCart of shopCart.products) {
      const productId = productCart.product.id;

      // region set percent coupon, calc total_discount summary_order & shop_cart
      log.debug('product-id %o', productId);
      const percentCouponSpecify = productPercentCouponSpecificMap.get(productId);
      log.debug('percent-coupon-specify %o', percentCouponSpecify);
      let percentCoupon = percentCouponAppliesAll ?? percentCouponSpecify;

      if (percentCouponSpecify && percentCouponAppliesAll) {
        percentCoupon = percentCouponAppliesAll.percent_off > percentCouponSpecify.percent_off ?
          percentCouponAppliesAll :
          percentCouponSpecify;
      }

      if (percentCoupon) {
        productCart.percent_coupon = pick(percentCoupon, ['id', 'percent_off', 'start_date', 'end_date']);

        const originPrice = productCart.inventory.price;
        productCart.inventory.sale_price = originPrice - (
          originPrice * (percentCoupon.percent_off / 100)
        );

        const originPriceXQuantity = productCart.price;
        const salePriceXQuantity = originPriceXQuantity - (
          originPriceXQuantity * (percentCoupon.percent_off / 100)
        );
        const discount = originPriceXQuantity - salePriceXQuantity;

        if (productCart.is_select_order) {
          shopCart.total_discount = (shopCart.total_discount || 0) + discount;
          summary_order.total_discount += discount;
        }
      }
      // endregion

      // region set freeship coupon, calc tempSubtotalPriceShopCart
      if (freeShipCouponAppliesAll) {
        productCart.freeship_coupon = pick(freeShipCouponAppliesAll, ['id', 'start_date', 'end_date']);
      }
      else {
        const freeShipCoupon = productFreeShipCouponSpecificMap.get(productId);
        log.debug('free-ship-coupon %o', freeShipCoupon);
        if (freeShipCoupon) {
          productCart.freeship_coupon = pick(freeShipCoupon, ['id', 'start_date', 'end_date']);
          if (productCart.is_select_order) {
            tempSubtotalPriceShopCart += productCart.price;
          }
        }
      }
      // endregion
    }

    // region calc total_shipping_fee shop_cart
    const subtotalPriceShopCart = subtotalPriceShopCartsMap.get(shopId);
    if (subtotalPriceShopCart === undefined) {
      log.error('subtotalPriceShopCart be undefined', subtotalPriceShopCart);
      throw new ApiError(StatusCodes.UNPROCESSABLE_ENTITY);
    }

    if (freeShipCouponAppliesAll || subtotalPriceShopCart === tempSubtotalPriceShopCart) {
      shopCart.total_shipping_fee -= (subtotalPriceShopCart * PERCENT_SHIPPING_FEE_STANDARD);
    }
    else if (tempSubtotalPriceShopCart > 0 && subtotalPriceShopCart > tempSubtotalPriceShopCart) {
      shopCart.total_shipping_fee -= (tempSubtotalPriceShopCart * PERCENT_SHIPPING_FEE_STANDARD);
    }
    // endregion
  }
}

async function applyAdditionsInfoShopCart(
  cart: GetCartAggregate,
  summary_order: SummaryOrder,
  additionInfoShopCarts?: AdditionInfoShopCart[]
) {
  if (!additionInfoShopCarts || additionInfoShopCarts.length === 0) return;

  const shopCartsMap = new Map<IShopDoc['id'], ShopCart>(
    cart.shop_carts.map((sc) => [sc.shop.id, sc])
  );

  for (const additionInfoShopCart of additionInfoShopCarts) {
    const { shop_id, promo_codes, note } = additionInfoShopCart;

    const shopCart = shopCartsMap.get(shop_id);
    if (!shopCart) {
      throw new ApiError(StatusCodes.BAD_REQUEST, `shop_id ${shop_id} is invalid`);
    }

    if (note) {
      shopCart.note = note;
    }

    if (promo_codes && promo_codes.length > 0) {

      if (promo_codes.length > COUPONS_MAX_USE_PER_ORDER) {
        throw new ApiError(
          StatusCodes.UNPROCESSABLE_ENTITY,
          `Only ${COUPONS_MAX_USE_PER_ORDER} coupons use at same time`
        );
      }

      const coupons = await Coupon.find({
        shop: shop_id,
        is_auto_sale: false,
        code: {
          $in: promo_codes,
        },
      });
      if (coupons.length !== promo_codes.length) {
        throw new ApiError(StatusCodes.UNPROCESSABLE_ENTITY, 'Some coupon not found');
      }

      if (
        promo_codes.length === COUPONS_MAX_USE_PER_ORDER &&
          !coupons.some(cp => cp.type === COUPON_TYPES.FREE_SHIP)
      ) {
        throw new ApiError(StatusCodes.UNPROCESSABLE_ENTITY, 'The only coupon that can be used with another coupon is Free Shipping');
      }
      shopCart.coupons = [];

      for (const coupon of coupons) {

        if (!coupon.is_active) {
          throw new ApiError(StatusCodes.UNPROCESSABLE_ENTITY, 'Coupon not active');
        }

        if (coupon.start_date > new Date()) {
          throw new ApiError(StatusCodes.UNPROCESSABLE_ENTITY,
            `Coupon ${coupon.code} start in ${coupon.start_date}`);
        }

        if (coupon.end_date < new Date()) {
          throw new ApiError(StatusCodes.UNPROCESSABLE_ENTITY, `Coupon ${coupon.code} ended`);
        }

        if (coupon.uses_count && coupon.uses_count >= coupon.max_uses) {
          throw new ApiError(StatusCodes.UNPROCESSABLE_ENTITY, `Coupon ${coupon.code} reach max count use`);
        }

        if (
          coupon.min_order_type === COUPON_MIN_ORDER_TYPES.ORDER_TOTAL &&
            shopCart.total_price < (coupon.min_order_value)
        ) {
          throw new ApiError(
            StatusCodes.UNPROCESSABLE_ENTITY,
            `Shop ${shopCart.shop?.shop_name} require order total must be large than
             ${coupon.min_order_value}`
          );
        }
        if (
          coupon.min_order_type === COUPON_MIN_ORDER_TYPES.NUMBER_OF_PRODUCTS &&
            shopCart.products.length < (coupon.min_products)
        ) {
          throw new ApiError(
            StatusCodes.UNPROCESSABLE_ENTITY,
            `Coupon ${coupon.code} require order must
            be at least ${coupon.min_products} products`
          );
        }

        let count_user_used_cp = 0;
        coupon.users_used && coupon.users_used.forEach((user_used_coupon_id) => {
          if (user_used_coupon_id === cart.user_id) {
            count_user_used_cp += 1;
          }
        });
        if (count_user_used_cp >= coupon.max_uses_per_user) {
          throw new ApiError(
            StatusCodes.BAD_REQUEST,
            `User has reach limit use coupon ${coupon.code}`
          );
        }

        switch (coupon.type) {
          case COUPON_TYPES.FIXED_AMOUNT:
            summary_order.total_discount += coupon.amount_off;
            shopCart.total_discount += coupon.amount_off;
            break;
          case COUPON_TYPES.PERCENTAGE: {
            const discount = shopCart.total_price * (coupon.percent_off / 100);
            summary_order.total_discount += discount;
            shopCart.total_discount += discount;
          }
            break;
          case COUPON_TYPES.FREE_SHIP:
            shopCart.total_shipping_fee = 0;
            break;
        }
        shopCart.coupons.push(coupon.id);
      }
    }
  }
}

const getSummaryOrder = async (
  cart: GetCartAggregate | null,
  additionInfoShopCarts?: AdditionInfoShopCart[]
) => {
  if (!cart) {
    throw new ApiError(StatusCodes.UNPROCESSABLE_ENTITY, 'Cart be undefined');
  }
  const summary_order: SummaryOrder = {
    subtotal_price: cart.summary_cart.subtotal_price,
    total_discount: 0,
    subtotal_applies_total_discount: 0,
    total_shipping_fee: 0,
    total_price: 0,
    total_products: cart.summary_cart.total_products_selected,
  };

  // calc total_shipping_fee each shop cart
  cart.shop_carts.forEach((sc) => {
    sc.total_shipping_fee = roundNumAndFixed(sc.subtotal_price * PERCENT_SHIPPING_FEE_STANDARD);
  });

  await applySaleCoupons(cart, summary_order);

  await applyAdditionsInfoShopCart(cart, summary_order, additionInfoShopCarts);

  cart.shop_carts.forEach((sc) => {
    summary_order.total_shipping_fee += (sc.total_shipping_fee > 0 ? sc.total_shipping_fee : 0);
    sc.total_discount = roundNumAndFixed(sc.total_discount);
    sc.total_price = roundNumAndFixed(
      sc.subtotal_price - sc.total_discount + sc.total_shipping_fee
    );
  });

  summary_order.subtotal_applies_total_discount = summary_order.subtotal_price - summary_order.total_discount;

  // eslint-disable-next-line @stylistic/max-len
  summary_order.total_price = summary_order.subtotal_price - summary_order.total_discount + summary_order.total_shipping_fee;

  Object.keys(summary_order).forEach((key) => {
    const num = summary_order[key as keyof SummaryOrder];
    summary_order[key as keyof SummaryOrder] = num < 0 ? 0 : roundNumAndFixed(num);
  });

  return summary_order;
};

export const cartService = {
  addProduct,
  getCartByUserId,
  deleteProduct,
  updateProduct,
  clearProductCartSelected,
  getCart,
  getSummaryOrder,
  createTempUserCart,
  updateProductTempCart,
};
