import { StatusCodes } from 'http-status-codes';
import mongoose from 'mongoose';
import { IShop } from '@/interfaces/models/shop';
import {
  RequestParamsAndBody,
  RequestParams, RequestParamsAndQueryParams
} from '@/interfaces/express';
import { ProductShipping } from '@/models/product-shipping.model';
import {
  PRODUCT_VARIANT_TYPES
} from '@/config/enums/product';
import {
  IProductVariant,
  IProductDoc
} from '@/interfaces/models/product';
import {
  CreateProductBody,
  UpdateProductParams,
  UpdateProductBody,
  GetDetailProductByShopParams, GetProductByShopQueryParams
} from '@/interfaces/request/product';
import { ProductInventory, Product } from '@/models';
import { ProductVariant } from '@/models/product-variant.model';
import {
  productService,
  awsS3Service
} from '@/services';
import {
  catchAsync, transactionWrapper, ApiError
} from '@/utils';
import { log } from '@/config';

const createProduct = catchAsync(async (
  req: RequestParamsAndBody<{ shop_id: IShop['id'] }, CreateProductBody>,
  res
) => {
  const shopId = req.params.shop_id;
  if (!shopId) throw new ApiError(StatusCodes.BAD_REQUEST);

  await transactionWrapper(async (session) => {
    const {
      new_variants, shipping, stock, price, sku, ...resBody
    } = req.body;

    const product = await productService.createProduct({
      ...resBody,
      shop: shopId,
    }, session);

    const productShipping = await ProductShipping.create({
      product: product.id,
      shop: shopId,
      ...shipping,
    });

    if (!resBody.variant_type) throw new ApiError(StatusCodes.BAD_REQUEST);

    if (resBody.variant_type === PRODUCT_VARIANT_TYPES.NONE) {

      if (!price) throw new ApiError(StatusCodes.BAD_REQUEST);
      const inventoryCreated = await productService.generateProductVariantNone(product, {
        stock: stock || 0,
        price,
        sku,
      }, session);
      const productUpdated = await Product.findOneAndUpdate(
        { _id: product.id },
        {
          inventory: inventoryCreated.id,
          shipping: productShipping.id,
        }, { new: true, session });
      res.status(StatusCodes.CREATED).send({ product: productUpdated });
    }
    else {

      // case single & combine variant
      if (!new_variants) throw new ApiError(StatusCodes.BAD_REQUEST);
      let productVariantIds: IProductVariant['id'][] = [];

      if (resBody.variant_type === PRODUCT_VARIANT_TYPES.SINGLE) {
        productVariantIds = await productService.generateSingleVariantProducts(
          product, new_variants, session
        );
      }
      if (resBody.variant_type === PRODUCT_VARIANT_TYPES.COMBINE) {
        productVariantIds = await productService.generateCombineVariantProducts(
          product, new_variants, session
        );
      }
      const productUpdated = await Product.findOneAndUpdate(
        { _id: product.id },
        {
          variants: productVariantIds,
          shipping: productShipping.id,
        }, { new: true, session }
      );
      res.status(StatusCodes.CREATED).send({ product: productUpdated });
    }
  });
});

const getProducts = catchAsync(async (
  req: RequestParamsAndQueryParams<{ shop_id: IShop['id'] }, GetProductByShopQueryParams>,
  res
) => {
  const { limit, page } = req.query;

  const limitDefault = 10;
  const pageDefault = 1;
  const limitNum = limit && parseInt(limit) > 0 ? parseInt(limit) : limitDefault;
  const pageNum = page && parseInt(page) > 0 ? parseInt(page) : pageDefault;

  const filter: mongoose.FilterQuery<IProductDoc> = {
    shop: new mongoose.Types.ObjectId(req.params.shop_id),
  };

  if (req.query?.title) {
    filter.title = { $regex: req.query.title, $options: 'i' };
  }

  const totalProducts = await Product.countDocuments(filter);
  const totalPages = Math.ceil(totalProducts / limitNum);
  log.debug(`totalProducts: ${totalProducts}`);

  const products = await Product.aggregate([
    { $match: filter },
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
      },
    },
    {
      $lookup: {
        from: ProductInventory.collection.name,
        localField: 'variants.variant_options.inventory',
        foreignField: '_id',
        as: 'inv_variant_combine',
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
        image: {
          $arrayElemAt: ['$images', 0],
        },
      },
    },
    {
      $project: {
        id: '$_id',
        _id: 0,
        title: 1,
        variant_type: 1,
        image_relative_url: '$image.relative_url',
        // inv_variant_single: 1,
        // inv_variant_combine: 1,
        // variants: 1,
        // inventory: 1,
        // inventories: 1,
        'inventories.variant': 1,
        'inventories.price': 1,
        'inventories.stock': 1,
        'inventories.sku': 1,
      },
    },
    { $skip: (pageNum - 1) * limitNum },
    { $limit: limitNum },
  ]);
  log.debug('products %o', products);

  res.json({
    results: products,
    page: pageNum,
    limit: limitNum,
    totalPages,
    totalResults: totalProducts,
  });
});

const getDetailProduct = catchAsync(async (
  req: RequestParams<GetDetailProductByShopParams>,
  res
) => {
  const { product_id, shop_id } = req.params;
  if (!product_id || !shop_id) throw new ApiError(StatusCodes.BAD_REQUEST);

  const product = await productService.getDetailProductByShop(product_id, shop_id, {
    shop: 0,
    views: 0,
    rating_average: 0,
  });
  if (!product) throw new ApiError(StatusCodes.NOT_FOUND, 'product not found');

  await product.populate('category', 'name');

  switch (product.variant_type) {
    case PRODUCT_VARIANT_TYPES.NONE:
      await product.populate('inventory', 'price stock sku');
      break;
    case PRODUCT_VARIANT_TYPES.SINGLE:
    case PRODUCT_VARIANT_TYPES.COMBINE:
      await product.populate({
        path: 'variants',
        populate: [
          { path: 'inventory' },
          {
            path: 'variant_options.inventory',
            select: { price: 1, stock: 1, sku: 1 },
          },
          { path: 'variant_options.variant', select: 'variant_name' },
        ],
      });
      break;
  }

  res.status(StatusCodes.OK).send({ product });
});

const deleteProduct = catchAsync(async (
  req: RequestParams<{ product_id: IProductDoc['id'] }>,
  res
) => {
  const productId = req.params.product_id;
  if (!productId) throw new ApiError(StatusCodes.BAD_REQUEST);

  await transactionWrapper(async (session) => {
    const result = await productService.deleteProductById(productId, session);

    const images = result.images.map(img => img.relative_url);
    await awsS3Service.deleteMultiObject(images);

    await ProductVariant.deleteMany({ product: productId }, { session });
    await ProductInventory.deleteMany({ product: productId }, { session });

    res.status(StatusCodes.NO_CONTENT).send();
  });
});

const updateProduct = catchAsync(async (
  req: RequestParamsAndBody<UpdateProductParams, UpdateProductBody>,
  res
) => {
  const productId = req.params.product_id;
  if (!productId) throw new ApiError(StatusCodes.BAD_REQUEST);

  await transactionWrapper(async (session) => {
    const product = await productService.updateProduct(productId, req.body, session);
    res.send({ product });
  });
});

export const shopProductController = {
  createProduct,
  getProducts,
  getDetailProduct,
  updateProduct,
  deleteProduct,
};
