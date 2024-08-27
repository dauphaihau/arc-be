import { StatusCodes } from 'http-status-codes';
import mongoose from 'mongoose';
import { ProductShipping } from '@/models/product-shipping.model';
import { ICategoryAttribute } from '@/interfaces/models/category-attribute';
import { BaseCreateProduct } from '@/interfaces/services/product';
import { productVariantService } from '@/services/product-variant.service';
import { productShippingService } from '@/services/product-shipping.service';
import {
  RequestCreateProduct,
  RequestDeleteProduct,
  RequestGetDetailProduct,
  RequestUpdateProduct
} from '@/interfaces/request/shop-product';
import { zParse } from '@/middlewares/zod-validate.middleware';
import { shopValidation } from '@/validations';
import {
  PRODUCT_VARIANT_TYPES
} from '@/config/enums/product';
import {
  IProductDoc, IProductVariant
} from '@/interfaces/models/product';
import { ProductInventory, Product, CategoryAttribute } from '@/models';
import { ProductVariant } from '@/models/product-variant.model';
import {
  productService,
  awsS3Service,
  categoryService, productInventoryService
} from '@/services';
import {
  catchAsync, transactionWrapper, ApiError, pick
} from '@/utils';

const createProduct = catchAsync(async (req: RequestCreateProduct, res) => {
  const shopId = req.params.shop_id;
  await transactionWrapper(async (session) => {
    const category = await categoryService.getById(req.body.category_id);
    if (!category) throw new ApiError(StatusCodes.NOT_FOUND, 'category not found');

    const attributes: BaseCreateProduct['attributes'] = [];
    if (req.body?.attributes && req.body.attributes.length > 0) {
      const categoryAttributeIds: ICategoryAttribute['id'][] = [];
      req.body.attributes.forEach((attr) => {
        attributes.push({
          attribute: attr.attribute_id,
          selected: attr.selected,
        });
        categoryAttributeIds.push(attr.attribute_id);
      });
      const count = await CategoryAttribute.countDocuments({
        _id: { $in: categoryAttributeIds },
        category: category.id,
      });
      if (count !== req.body.attributes.length) {
        throw new ApiError(StatusCodes.UNPROCESSABLE_ENTITY, 'attributes is invalid');
      }
    }

    const body: BaseCreateProduct = {
      ...pick(req.body, [
        'title', 'description', 'slug',
        'tags', 'state', 'is_digital',
        'who_made', 'non_taxable',
        'variant_type', 'images',
      ]),
      attributes,
      category: category.id,
      shop: shopId,
    };
    if (req.body.variant_type === PRODUCT_VARIANT_TYPES.SINGLE) {
      body.variant_group_name = req.body.variant_group_name;
    }
    else if (req.body.variant_type === PRODUCT_VARIANT_TYPES.COMBINE) {
      body.variant_group_name = req.body.variant_group_name;
      body.variant_sub_group_name = req.body.variant_sub_group_name;
    }
    const product = await productService.createProduct(body, session);

    const productShipping = await productShippingService.create({
      product: product.id,
      shop: shopId,
      ...req.body.shipping,
    }, session);

    if (req.body.variant_type === PRODUCT_VARIANT_TYPES.NONE) {
      if (!req.body.price) throw new ApiError(StatusCodes.BAD_REQUEST);
      const inventoryCreated = await productInventoryService.insertInventory({
        shop: shopId,
        product: product.id,
        stock: req.body.stock || 0,
        price: req.body.price,
        sku: req.body.sku,
      }, session);
      const productUpdated = await Product.findOneAndUpdate(
        { _id: product.id },
        {
          inventory: inventoryCreated.id,
          shipping: productShipping.id,
        },
        { new: true, session }
      );
      res.status(StatusCodes.CREATED).send({ product: productUpdated });
    }
    else {
      // case single & combine variant
      let productVariantIds: IProductVariant['id'][] = [];

      if (req.body.variant_type === PRODUCT_VARIANT_TYPES.SINGLE) {
        productVariantIds = await productVariantService.generateSingleVariantProducts(
          product, req.body.variant_options, session
        );
      }
      if (req.body.variant_type === PRODUCT_VARIANT_TYPES.COMBINE) {
        productVariantIds = await productVariantService.generateCombineVariantProducts(
          product, req.body.variant_options, session
        );
      }
      const productUpdated = await Product.findOneAndUpdate(
        { _id: product.id },
        {
          variants: productVariantIds,
          shipping: productShipping.id,
        },
        { new: true, session }
      );
      res.status(StatusCodes.CREATED).send({ product: productUpdated });
    }
  });
});

const getProducts = catchAsync(async (req, res) => {
  const { query, params } = await zParse(shopValidation.getProducts, req);

  const limitDefault = 10;
  const pageDefault = 1;
  const limit = query.limit ? query.limit : limitDefault;
  const page = query.page ? query.page : pageDefault;

  const filter: mongoose.FilterQuery<IProductDoc> = {
    shop: new mongoose.Types.ObjectId(params.shop_id),
  };

  if (query?.title) {
    filter.title = { $regex: query.title, $options: 'i' };
  }

  const totalProducts = await Product.countDocuments(filter);
  const total_pages = Math.ceil(totalProducts / limit);

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
    { $sort: { created_at: -1 } },
    {
      $project: {
        id: '$_id',
        _id: 0,
        title: 1,
        variant_type: 1,
        image_relative_url: '$image.relative_url',
        'inventories.variant': 1,
        'inventories.price': 1,
        'inventories.stock': 1,
        'inventories.sku': 1,
      },
    },
    { $skip: (page - 1) * limit },
    { $limit: limit },
  ]);

  res.json({
    results: products,
    page,
    limit,
    total_pages,
    total_results: totalProducts,
  });
});

const getDetailProduct = catchAsync(async (req: RequestGetDetailProduct, res) => {
  const { product_id, shop_id } = req.params;

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

  product.attributes = product.attributes?.map((attr) => {
    return {
      attribute: attr.attribute,
      selected: attr.selected,
    };
  });
  res.status(StatusCodes.OK).send({ product });
});

const deleteProduct = catchAsync(async (req: RequestDeleteProduct, res) => {
  const productId = req.params.product_id;

  await transactionWrapper(async (session) => {
    const result = await productService.deleteProductById(productId, session);

    const images = result.images.map(img => img.relative_url);
    await awsS3Service.deleteMultiObject(images);

    await ProductVariant.deleteMany({ product: productId }, { session });
    await ProductShipping.deleteMany({ product: productId }, { session });
    await ProductInventory.deleteMany({ product: productId }, { session });

    res.status(StatusCodes.NO_CONTENT).send();
  });
});

const updateProduct = catchAsync(async (req: RequestUpdateProduct, res) => {
  await transactionWrapper(async (session) => {
    const product = await productService.updateProduct(req.params.product_id, req.body, session);
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
