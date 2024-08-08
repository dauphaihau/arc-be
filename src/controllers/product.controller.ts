import { StatusCodes } from 'http-status-codes';
import mongoose, { PipelineStage } from 'mongoose';
import { ProductShipping } from '@/models/product-shipping.model';
import { IShop } from '@/interfaces/models/shop';
import {
  GetProductsQueryParams,
  ResponseMarketGetProducts,
  ResponseMarketGetDetailProduct, CouponAggregate, ProductCustomFields
} from '@/interfaces/request/product';
import {
  RequestQueryParams,
  RequestParams,
  ResponseCustom
} from '@/interfaces/express';
import { COUPON_TYPES, COUPON_APPLIES_TO } from '@/config/enums/coupon';
import {
  PRODUCT_VARIANT_TYPES, PRODUCT_SORT_BY
} from '@/config/enums/product';
import { IProductDoc } from '@/interfaces/models/product';
import {
  ProductInventory, Product, Shop, Coupon
} from '@/models';
import { ProductVariant } from '@/models/product-variant.model';
import {
  categoryService
} from '@/services';
import {
  catchAsync, ApiError, roundNumAndFixed, pick
} from '@/utils';
import { ICouponDoc } from '@/interfaces/models/coupon';
import { ElementType } from '@/interfaces/utils';

const getProducts = catchAsync(async (
  req: RequestQueryParams<GetProductsQueryParams>,
  res: ResponseCustom<ResponseMarketGetProducts>
) => {
  const { limit, page } = req.query;

  const limitDefault = 10;
  const pageDefault = 1;
  const limitNum = limit && parseInt(limit) > 0 ? parseInt(limit) : limitDefault;
  const pageNum = page && parseInt(page) > 0 ? parseInt(page) : pageDefault;

  //region filter
  let filter: mongoose.FilterQuery<IProductDoc> = {};

  if (req.query.category) {
    const categoryIds = await categoryService.getSubCategoriesByCategory(req.query.category);
    filter.category = {
      $in: categoryIds.map(c => new mongoose.Types.ObjectId(c)),
    };
  }

  if (req.query?.s) {
    filter = {
      ...filter,
      $or: [
        { title: { $regex: req.query.s, $options: 'i' } },
        { description: { $regex: req.query.s, $options: 'i' } },
      ],
    };
  }

  if (req.query?.title) {
    filter.title = { $regex: req.query.title, $options: 'i' };
  }

  if (req.query?.is_digital) {
    filter.is_digital = req.query.is_digital === 'true';
  }
  //endregion

  const totalProducts = await Product.countDocuments(filter);
  const totalPages = Math.ceil(totalProducts / limitNum);

  //region select
  let $project = {
    _id: 0, // shop_id
    shop: {
      id: '$data.shop._id',
      shop_name: '$data.shop.shop_name',
    },
    id: '$data._id',
    category: '$data.category',
    title: '$data.title',
    image_relative_url: '$data.image.relative_url',
    variant_type: '$data.variant_type',
    inventory: {
      price: '$data.inventory.price',
      stock: '$data.inventory.stock',
      sku: '$data.inventory.sku',
    },
    created_at: '$data.created_at',
  };
  type KeyProject = keyof typeof $project;
  if (req.query.select) {
    const select = req.query.select.split(',');
    if (select.some(key => !$project[key as KeyProject])) {
      throw new ApiError(StatusCodes.BAD_REQUEST, 'select is invalid');
    }
    const exclude: KeyProject[] = ['_id', 'id'];
    $project = pick($project, exclude.concat(select as KeyProject[]));
  }
  //endregion

  //region product aggregate
  const productAggregate: PipelineStage[] = [
    { $match: filter },
    {
      $lookup: {
        from: Shop.collection.name,
        localField: 'shop',
        foreignField: '_id',
        as: 'shop',
      },
    },
    {
      $lookup: {
        from: ProductInventory.collection.name,
        localField: 'inventory',
        foreignField: '_id',
        as: 'inventory',
      },
    },
    {
      $lookup: {
        from: ProductVariant.collection.name,
        let: { variants: '$variants' },
        as: 'variants',
        pipeline: [
          { $match: { $expr: { $in: ['$_id', '$$variants'] } } },
        ],
      },
    },
    {
      $lookup: {
        from: ProductInventory.collection.name,
        localField: 'variants.inventory',
        foreignField: '_id',
        as: 'inv_variant_single',
        pipeline: [
          { $sort: { price: 1 } },
          { $limit: 1 },
        ],
      },
    },
    {
      $lookup: {
        from: ProductInventory.collection.name,
        localField: 'variants.variant_options.inventory',
        foreignField: '_id',
        as: 'inv_variant_combine',
        pipeline: [
          { $sort: { price: 1 } },
          { $limit: 1 },
        ],
      },
    },
    {
      $addFields: {
        inventory: {
          $switch: {
            branches: [
              {
                case: { $eq: ['$variant_type', PRODUCT_VARIANT_TYPES.SINGLE] },
                then: { $arrayElemAt: ['$inv_variant_single', 0] },
              },
              {
                case: { $eq: ['$variant_type', PRODUCT_VARIANT_TYPES.COMBINE] },
                then: { $arrayElemAt: ['$inv_variant_combine', 0] },
              },
              {
                case: { $eq: ['$variant_type', PRODUCT_VARIANT_TYPES.NONE] },
                then: { $arrayElemAt: ['$inventory', 0] },
              },
            ],
            default: null, // No inventory found
          },
        },
        shop: { $arrayElemAt: ['$shop', 0] },
        image: {
          $arrayElemAt: ['$images', 0],
        },
      },
    },
    {
      $sort: {
        'inventory.price': 1,
      },
    },
    {
      $group: {
        _id: '$shop._id',
        data: { $first: '$$ROOT' },
      },
    },
    { $project },
    { $skip: (pageNum - 1) * limitNum },
    { $limit: limitNum },
  ];

  const sortBy: mongoose.PipelineStage.Sort['$sort'] = {};
  if (req.query?.order) {
    switch (req.query.order) {
      case 'newest':
        sortBy['created_at'] = -1;
        break;
      case 'price_asc':
        sortBy['inventory.price'] = 1;
        break;
      case 'price_desc':
        sortBy['inventory.price'] = -1;
        break;
    }
    productAggregate.push({ $sort: sortBy });
  }

  const products = await Product.aggregate(productAggregate);
  //endregion

  if (!$project.shop) {
    res.json({
      results: products,
      page: pageNum,
      limit: limitNum,
      totalPages,
      totalResults: totalProducts,
    });
    return;
  }

  //region apply run sale
  const shopProductMap = new Map<IShop['id'], ElementType<ResponseMarketGetProducts['results']>>(
    products.map(prod => [prod.shop.id.toString(), {
      ...prod,
      inventory: {
        ...prod.inventory,
        sale_price: 0,
      },
    }])
  );

  const shopIds = Array.from(shopProductMap.keys());

  const shopCoupons = await Coupon.aggregate<CouponAggregate>([
    {
      $match: {
        shop: {
          $in: shopIds.map(c => new mongoose.Types.ObjectId(c)),
        },
        is_auto_sale: true,
        is_active: true,
        $or: [
          { type: COUPON_TYPES.PERCENTAGE },
          { type: COUPON_TYPES.FREE_SHIP },
        ],
        start_date: {
          $lt: new Date(),
        },
        end_date: {
          $gt: new Date(),
        },
      },
    },
    {
      $group: {
        _id: '$shop',
        coupons: { $push: '$$ROOT' },
      },
    },
    {
      $project: {
        _id: 1,
        coupons: {
          type: 1,
          percent_off: 1,
          applies_product_ids: 1,
          applies_to: 1,
          start_date: 1,
          end_date: 1,
        },
      },
    },
  ]);

  for (const shopCouponsElement of shopCoupons) {
    const shopId = shopCouponsElement._id.toString();
    const shopProduct = shopProductMap.get(shopId);
    if (!shopProduct) {
      throw new ApiError(StatusCodes.UNPROCESSABLE_ENTITY);
    }

    let maxPercentOff = 0;

    let percentCoupon: ProductCustomFields['percent_coupon'] | undefined;
    let freeShipCoupon: ProductCustomFields['free_ship_coupon'] | undefined;

    for (const coupon of shopCouponsElement.coupons) {
      if (coupon.type === COUPON_TYPES.PERCENTAGE) {
        const conditionApplySpecific = coupon.applies_to === COUPON_APPLIES_TO.SPECIFIC &&
          coupon.applies_product_ids && coupon.applies_product_ids.includes(shopProduct.id.toString());

        if (conditionApplySpecific || coupon.applies_to === COUPON_APPLIES_TO.ALL) {
          if (coupon.percent_off > maxPercentOff) {
            maxPercentOff = coupon.percent_off;
            percentCoupon = coupon;
          }
        }
      }
      else if (coupon.type === COUPON_TYPES.FREE_SHIP && !freeShipCoupon) {
        const conditionApplySpecific = coupon.applies_to === COUPON_APPLIES_TO.SPECIFIC &&
          coupon.applies_product_ids && coupon.applies_product_ids.includes(shopProduct.id.toString());

        if (conditionApplySpecific || coupon.applies_to === COUPON_APPLIES_TO.ALL) {
          freeShipCoupon = pick(coupon, ['type', 'start_date', 'end_date']);
          shopProduct.free_ship_coupon = freeShipCoupon;
        }
      }
    }

    if (percentCoupon && percentCoupon.percent_off) {
      const originPrice = shopProduct.inventory.price;
      shopProduct.inventory.sale_price = roundNumAndFixed(
        originPrice - (originPrice * (percentCoupon.percent_off / 100))
      );
      percentCoupon = pick(percentCoupon, ['type', 'percent_off', 'start_date', 'end_date']);
      shopProduct.percent_coupon = percentCoupon;
    }

  }
  //endregion

  let shopProducts = Array.from(shopProductMap.values());

  // sort after apply sale
  if (req.query?.order) {
    if (req.query.order === PRODUCT_SORT_BY.PRICE_ASC) {
      shopProducts = shopProducts.sort((a, b) => {
        return a.inventory.price - b.inventory.price;
      });
    }
    if (req.query.order === PRODUCT_SORT_BY.PRICE_DESC) {
      shopProducts = shopProducts.sort((a, b) => {
        return b.inventory.price - a.inventory.price;
      });
    }
  }

  res.json({
    results: shopProducts,
    page: pageNum,
    limit: limitNum,
    totalPages,
    totalResults: totalProducts,
  });
});

const getDetailProduct = catchAsync(async (
  req: RequestParams<{ product_id: string }>,
  res: ResponseCustom<ResponseMarketGetDetailProduct>
) => {
  const productId = req.params.product_id;
  if (!productId) throw new ApiError(StatusCodes.BAD_REQUEST);

  const productAggregate = await Product.aggregate<ResponseMarketGetDetailProduct['product']>([
    {
      $match: {
        _id: new mongoose.Types.ObjectId(productId),
      },
    },
    {
      $lookup: {
        from: Shop.collection.name,
        localField: 'shop',
        foreignField: '_id',
        as: 'shop',
      },
    },
    {
      $lookup: {
        from: ProductShipping.collection.name,
        localField: 'shipping',
        foreignField: '_id',
        as: 'shipping',
        pipeline: [
          {
            $project: {
              _id: 0, id: '$_id', country: 1, process: 1,
            },
          },
        ],
      },
    },
    {
      $lookup: {
        from: ProductVariant.collection.name,
        let: { variants: '$variants' },
        as: 'variants',
        pipeline: [
          { $match: { $expr: { $in: ['$_id', '$$variants'] } } },
        ],
      },
    },
    {
      $lookup: {
        from: ProductInventory.collection.name,
        localField: 'inventory',
        foreignField: '_id',
        as: 'inventory',
        pipeline: [
          {
            $project: {
              _id: 0, id: '$_id', variant: 1, price: 1, stock: 1, sku: 1,
            },
          },
        ],
      },
    },
    {
      $lookup: {
        from: ProductInventory.collection.name,
        localField: 'variants.inventory',
        foreignField: '_id',
        as: 'inv_variant_single',
        pipeline: [
          {
            $project: {
              _id: 0, id: '$_id', variant: 1, price: 1, stock: 1, sku: 1,
            },
          },
          { $sort: { price: 1 } },
        ],
      },
    },
    {
      $lookup: {
        from: ProductInventory.collection.name,
        localField: 'variants.variant_options.inventory',
        foreignField: '_id',
        as: 'inv_variant_combine',
        pipeline: [
          {
            $project: {
              _id: 0, id: '$_id', variant: 1, price: 1, stock: 1, sku: 1,
            },
          },
          { $sort: { price: 1 } },
        ],
      },
    },
    {
      $addFields: {
        inventories: {
          $switch: {
            branches: [
              {
                case: { $eq: ['$variant_type', PRODUCT_VARIANT_TYPES.SINGLE] },
                then: '$inv_variant_single',
              },
              {
                case: { $eq: ['$variant_type', PRODUCT_VARIANT_TYPES.COMBINE] },
                then: '$inv_variant_combine',
              },
              {
                case: { $eq: ['$variant_type', PRODUCT_VARIANT_TYPES.NONE] },
                then: '$inventory',
              },
            ],
            default: null, // No inventory found
          },
        },
        shop: { $arrayElemAt: ['$shop', 0] },
        shipping: { $arrayElemAt: ['$shipping', 0] },
      },
    },
    {
      $project: {
        _id: 0,
        id: '$_id',
        shop: {
          id: '$shop._id',
          shop_name: 1,
        },
        shipping: 1,
        variant_group_name: 1,
        variant_sub_group_name: 1,
        variant_type: 1,
        category: 1,
        inventories: 1,
        title: 1,
        description: 1,
        images: {
          relative_url: 1,
          rank: 1,
        },
      },
    },
    { $limit: 1 },
  ]);

  if (!productAggregate[0]) throw new ApiError(StatusCodes.NOT_FOUND);
  const product = productAggregate[0];

  const response: ResponseMarketGetDetailProduct = {
    product,
  };

  //region apply sale
  const couponAggregate = await Coupon.aggregate<{
    _id: ICouponDoc['type'],
    coupons: ICouponDoc[]
  }>([
    {
      $match: {
        shop: new mongoose.Types.ObjectId(product.shop.id),
        is_auto_sale: true,
        is_active: true,
        $or: [
          { type: COUPON_TYPES.PERCENTAGE },
          { type: COUPON_TYPES.FREE_SHIP },
        ],
        start_date: {
          $lt: new Date(),
        },
        end_date: {
          $gt: new Date(),
        },
      },
    },
    {
      $group: {
        _id: '$type',
        coupons: { $push: '$$ROOT' },
      },
    },
    {
      $project: {
        _id: 1,
        coupons: {
          type: 1,
          applies_to: 1,
          applies_product_ids: 1,
          percent_off: 1,
          start_date: 1,
          end_date: 1,
        },
      },
    },
  ]);

  for (const couponAggregateEle of couponAggregate) {
    const typeCoupon = couponAggregateEle._id;

    if (typeCoupon === COUPON_TYPES.PERCENTAGE) {
      let maxPercentOff = 0;

      for (const percenCoupon of couponAggregateEle.coupons) {
        const productIds = percenCoupon.applies_product_ids.map(String);

        const conditionApplySpecific =
          percenCoupon.applies_to === COUPON_APPLIES_TO.SPECIFIC && productIds.includes(productId);

        if (percenCoupon.applies_to === COUPON_APPLIES_TO.ALL || conditionApplySpecific) {
          if (percenCoupon.percent_off > maxPercentOff) {
            maxPercentOff = percenCoupon.percent_off;
            response.percent_coupon = percenCoupon;
          }
        }
      }

    }
    else if (typeCoupon === COUPON_TYPES.FREE_SHIP && !response.free_ship_coupon) {
      const freeShipCoupon = couponAggregateEle.coupons[0];
      const productIds = freeShipCoupon.applies_product_ids.map(String);

      const conditionApplySpecific =
        freeShipCoupon.applies_to === COUPON_APPLIES_TO.SPECIFIC && productIds.includes(productId);

      if (freeShipCoupon.applies_to === COUPON_APPLIES_TO.ALL || conditionApplySpecific) {
        response.free_ship_coupon = freeShipCoupon;
      }
    }
  }
  if (response.percent_coupon) {
    response.percent_coupon = pick(response.percent_coupon, ['percent_off', 'start_date', 'end_date']);
    for (const inv of response.product.inventories) {
      const originPrice = inv.price;
      inv.sale_price = roundNumAndFixed(
        originPrice - (originPrice * (response.percent_coupon.percent_off / 100))
      );
    }
  }
  if (response.free_ship_coupon) {
    response.free_ship_coupon = pick(response.free_ship_coupon, ['start_date', 'end_date']);
  }
  //endregion

  res.json(response);
});

export const productController = {
  getProducts,
  getDetailProduct,
};
