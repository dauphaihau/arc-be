import { StatusCodes } from 'http-status-codes';
import mongoose, { FacetPipelineStage, PipelineStage } from 'mongoose';
import { COUPON_TYPES, COUPON_APPLIES_TO } from '@/config/enums/coupon';
import { PRODUCT_VARIANT_TYPES, PRODUCT_SORT_BY, PRODUCT_STATES } from '@/config/enums/product';
import {
  ResponseCustom
} from '@/interfaces/express';
import { ICouponDoc } from '@/interfaces/models/coupon';
import { IProductDoc } from '@/interfaces/models/product';
import { IShopDoc } from '@/interfaces/models/shop';
import {
  GetProductsAggregate,
  GetProductsAggregate_Product,
  ResponseGetProducts,
  ResponseGetDetailProduct,
  ResponseGetDetailProduct_Product
} from '@/interfaces/controllers/product';
import { zParse } from '@/middlewares/zod-validate.middleware';
import {
  ProductInventory, Product, Shop, Coupon 
} from '@/models';
import { ProductShipping } from '@/models/product-shipping.model';
import { ProductVariant } from '@/models/product-variant.model';
import { categoryService, couponService } from '@/services';
import {
  catchAsync, ApiError, roundNumAndFixed, pick 
} from '@/utils';
import { productValidation } from '@/validations/product.validation';
import { RequestGetDetailProduct } from '@/interfaces/request/product';

const getProducts = catchAsync(async (
  req,
  res: ResponseCustom<ResponseGetProducts>
) => {
  const { query } = await zParse(productValidation.getProducts, req);

  const limitDefault = 10;
  const pageDefault = 1;
  const limit = query.limit ? query.limit : limitDefault;
  const page = query.page ? query.page : pageDefault;

  //region filter
  let filter: mongoose.FilterQuery<IProductDoc> = {
    state: PRODUCT_STATES.ACTIVE,
  };

  if (query.category_id) {
    const categoryIds = await categoryService.getSubCategoriesByCategory(query.category_id);
    filter.category = {
      $in: categoryIds.map(c => new mongoose.Types.ObjectId(c)),
    };
  }
  if (query?.s) {
    filter = {
      ...filter,
      $or: [
        { title: { $regex: query.s, $options: 'i' } },
        { description: { $regex: query.s, $options: 'i' } },
      ],
    };
  }
  if (query?.title) {
    filter.title = { $regex: query.title, $options: 'i' };
  }
  if (query?.is_digital) {
    filter.is_digital = query.is_digital;
  }
  if (query?.who_made) {
    filter.who_made = query.who_made;
  }
  //endregion

  //region select results fields
  let $projectResults = {
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
  type KeyProject = keyof typeof $projectResults;
  if (query.select) {
    const selects = query.select.split(',');
    if (selects.some(key => !$projectResults[key as KeyProject])) {
      throw new ApiError(StatusCodes.BAD_REQUEST, 'select is invalid');
    }
    const exclude: KeyProject[] = ['_id', 'id'];
    $projectResults = pick($projectResults, exclude.concat(selects as KeyProject[]));
  }
  //endregion

  let resultsFacetPipelineStage: FacetPipelineStage[] = [
    { $project: $projectResults },
  ];

  const sortBy: mongoose.PipelineStage.Sort['$sort'] = {};
  if (query?.order) {
    switch (query.order) {
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
    resultsFacetPipelineStage.push({ $sort: sortBy });
  }

  resultsFacetPipelineStage = [...resultsFacetPipelineStage, ...[
    { $skip: (page - 1) * limit },
    { $limit: limit },
  ]];

  //region product aggregate
  const productPipelineStage: PipelineStage[] = [
    { $match: filter },
    {
      $lookup: {
        from: Shop.collection.name,
        localField: 'shop',
        foreignField: '_id',
        as: 'shop_docs',
      },
    },
    {
      $lookup: {
        from: ProductInventory.collection.name,
        localField: 'inventory',
        foreignField: '_id',
        as: 'inventory_docs',
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
        as: 'inv_variant_single_docs',
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
        as: 'inv_variant_combine_docs',
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
                then: { $arrayElemAt: ['$inv_variant_single_docs', 0] },
              },
              {
                case: { $eq: ['$variant_type', PRODUCT_VARIANT_TYPES.COMBINE] },
                then: { $arrayElemAt: ['$inv_variant_combine_docs', 0] },
              },
              {
                case: { $eq: ['$variant_type', PRODUCT_VARIANT_TYPES.NONE] },
                then: { $arrayElemAt: ['$inventory_docs', 0] },
              },
            ],
            default: null, // No inventory found
          },
        },
        shop: { $arrayElemAt: ['$shop_docs', 0] },
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
    {
      $facet: {
        results: resultsFacetPipelineStage,
        summary: [
          { $count: 'total_results' },
        ],
      },
    },
    {
      $addFields: {
        summary: { $arrayElemAt: ['$summary', 0] },
      },
    },
    {
      $project: {
        results: 1,
        total_pages: { $ceil: { $divide: ['$summary.total_results', limit] } },
        total_results: '$summary.total_results',
      },
    },
  ];

  const productAggregate = await Product.aggregate<GetProductsAggregate>(productPipelineStage);

  const productAggregateElement = productAggregate[0];
  //endregion

  let results = productAggregateElement.results;

  //region apply run sale
  if ($projectResults.shop) {
    const shopProductMap = new Map<IShopDoc['id'], GetProductsAggregate_Product>(
      productAggregateElement.results.map(prod => [prod.shop.id.toString(), {
        ...prod,
        inventory: {
          ...prod.inventory,
          sale_price: 0,
        },
      }])
    );

    const shopIds = Array.from(shopProductMap.keys());

    const shopCoupons = await couponService.getSaleCouponByShopIds(shopIds);

    for (const shopCouponsElement of shopCoupons) {
      const shopId = shopCouponsElement._id.toString();
      const shopProduct = shopProductMap.get(shopId);
      if (!shopProduct) {
        throw new ApiError(StatusCodes.UNPROCESSABLE_ENTITY);
      }

      let maxPercentOff = 0;

      let percentCoupon: GetProductsAggregate_Product['percent_coupon'] | undefined;
      let freeShipCoupon: GetProductsAggregate_Product['free_ship_coupon'] | undefined;

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
            freeShipCoupon = pick(coupon, ['start_date', 'end_date']);
            shopProduct.free_ship_coupon = freeShipCoupon;
          }
        }
      }

      if (percentCoupon && percentCoupon.percent_off) {
        const originPrice = shopProduct.inventory.price;
        shopProduct.inventory.sale_price = roundNumAndFixed(
          originPrice - (originPrice * (percentCoupon.percent_off / 100))
        );
        percentCoupon = pick(percentCoupon, ['percent_off', 'start_date', 'end_date']);
        shopProduct.percent_coupon = percentCoupon;
      }

    }

    results = Array.from(shopProductMap.values());

    // sort after apply sale
    if (query?.order) {
      if (query.order === PRODUCT_SORT_BY.PRICE_ASC) {
        results = results.sort((a, b) => {
          return a.inventory.price - b.inventory.price;
        });
      }
      if (query.order === PRODUCT_SORT_BY.PRICE_DESC) {
        results = results.sort((a, b) => {
          return b.inventory.price - a.inventory.price;
        });
      }
    }
  }
  //endregion

  res.json({
    results,
    page,
    limit,
    total_pages: productAggregateElement.total_pages,
    total_results: productAggregateElement.total_results,
  });
});

const getDetailProduct = catchAsync(async (
  req: RequestGetDetailProduct,
  res: ResponseCustom<ResponseGetDetailProduct>
) => {
  const productId = req.params.product_id;

  const productAggregate = await Product.aggregate<ResponseGetDetailProduct_Product>([
    {
      $match: {
        _id: new mongoose.Types.ObjectId(productId),
        state: PRODUCT_STATES.ACTIVE,
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
              _id: 0, id: '$_id', country: 1, process_time: 1,
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

  const response: ResponseGetDetailProduct = {
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
