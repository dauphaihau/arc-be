import { Request } from 'express';
import { StatusCodes } from 'http-status-codes';
import { COUPON_TYPES, COUPON_APPLIES_TO } from '@/config/enums/coupon';
import {
  PRODUCT_VARIANT_TYPES,
  PRODUCT_SORT_BY
} from '@/config/enums/product';
import {
  CreateProductBody,
  CreateProductParams,
  GetProductParams,
  DeleteProductParams,
  UpdateProductParams,
  UpdateProductBody,
  GetProductQueries,
  GetProductByShopParams,
  GetDetailProductByShopParams, IProduct, IProductVariant
} from '@/interfaces/models/product';
import { ProductInventory, Coupon } from '@/models';
import { ProductVariant } from '@/models/product-variant.model';
import {
  productService,
  awsS3Service,
  categoryService
} from '@/services';
import {
  catchAsync, pick, transactionWrapper, ApiError
} from '@/utils';

const createProductByShop = catchAsync(async (
  req: Request<CreateProductParams, unknown, CreateProductBody>,
  res
) => {
  const shopId = req.params.shop as IProduct['shop'];

  await transactionWrapper(async (session) => {
    const {
      new_variants, stock, price, sku, ...resBody
    } = req.body;

    const product = await productService.createProduct({
      ...resBody,
      shop: shopId,
    }, session);

    if (resBody.variant_type === PRODUCT_VARIANT_TYPES.NONE) {

      if (!price) throw new ApiError(StatusCodes.BAD_REQUEST);
      const inventoryCreated = await productService.generateProductVariantNone(product, {
        stock: stock || 0,
        price,
        sku,
      }, session);
      await product.update({
        inventory: inventoryCreated.id,
      }, { session });

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
      await product.update({
        variants: productVariantIds,
      }, { session });
    }

    res.status(StatusCodes.CREATED).send({ product });
  });
});

const getProductsByShop = catchAsync(async (
  req: Request<GetProductByShopParams, unknown, unknown>,
  res
) => {
  const filter = pick(
    {
      ...req.query,
      shop: req.params.shop,
    },
    ['shop', 'price', 'name', 'category']
  );
  const defaultPopulate = 'shop,inventory,variants/inventory+variant_options.inventory+variant_options.variant';
  const options = pick(req.query, ['sortBy', 'limit', 'page', 'populate', 'select']);
  options['populate'] = defaultPopulate;

  const result = await productService.queryProducts(filter, options);

  result.results = result.results.map((prod) => {
    prod.summary_inventory = {
      lowest_price: 0,
      highest_price: 0,
      stock: 0,
    };

    prod.variants && prod.variants.forEach((vari, idx) => {
      if (prod.variant_type === PRODUCT_VARIANT_TYPES.SINGLE && vari?.inventory?.price) {

        prod.summary_inventory.stock += vari.inventory.stock;

        if (idx === 0 || (vari.inventory.price < prod.summary_inventory.lowest_price)) {
          prod.summary_inventory.lowest_price = vari.inventory.price;
        }
        if (idx === 0 || (vari.inventory.price > prod.summary_inventory.highest_price)) {
          prod.summary_inventory.highest_price = vari.inventory.price;
        }
      }

      if (prod.variant_type === PRODUCT_VARIANT_TYPES.COMBINE) {
        vari.variant_options.forEach((varOpt) => {
          prod.summary_inventory.stock += varOpt.inventory?.stock;
          if (idx === 0 || (varOpt.inventory.price < prod.summary_inventory.lowest_price)) {
            prod.summary_inventory.lowest_price = varOpt.inventory.price;
          }
          if (idx === 0 || (varOpt.inventory.price > prod.summary_inventory.highest_price)) {
            prod.summary_inventory.highest_price = varOpt.inventory.price;
          }
        });
      }
    });

    return prod;
  });

  res.send(result);
});

const getDetailProductByShop = catchAsync(async (
  req: Request<GetDetailProductByShopParams>,
  res
) => {
  const { id, shop } = req.params;
  if (!id || !shop) throw new ApiError(StatusCodes.BAD_REQUEST);

  const product = await productService.getDetailProductByShop(id, shop, {
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

const deleteProductByShop = catchAsync(async (
  req: Request<DeleteProductParams>,
  res
) => {
  const product = req.params.id as string;

  await transactionWrapper(async (session) => {
    const result = await productService.deleteProductById(product, session);

    const images = result.images.map(img => img.relative_url);
    await awsS3Service.deleteMultiObject(images);

    await ProductVariant.deleteMany({ product }, { session });
    await ProductInventory.deleteMany({ product }, { session });

    res.status(StatusCodes.NO_CONTENT).send();
  });
});

const updateProductByShop = catchAsync(async (
  req: Request<UpdateProductParams, unknown, UpdateProductBody>,
  res
) => {
  const productId = req.params.id as string;

  await transactionWrapper(async (session) => {
    const product = await productService.updateProduct(productId, req.body, session);

    // update stock
    // if (req.body?.stock) {
    //   const updatedInv = await inventoryService.updateStock({
    //     // shop: product.shop as IPopulatedShop,
    //     shop: product.shop as string,
    //     product: productId,
    //     stock: req.body.stock,
    //   }, session);
    //   if (!updatedInv.modifiedCount) {
    //     throw new ApiError(StatusCodes.BAD_REQUEST, 'Update stock failed');
    //   }
    // }
    res.send({ product });
  });
});

const getProducts = catchAsync(async (
  req: Request<unknown, unknown, unknown, GetProductQueries>,
  res
) => {
  const filter = pick(req.query, ['shop', 'price', 'title', 'category', 'is_digial']);
  const options = pick(req.query, ['sortBy', 'limit', 'page', 'populate', 'select']);

  if (req.query?.category) {
    const categoryIds = await categoryService.getSubCategoriesByCategory(req.query.category);
    filter['category'] = {
      $in: categoryIds,
    };
  }

  if (req.query?.sortBy === PRODUCT_SORT_BY.DESC) {
    options['sortBy'] = 'createdAt';
  }

  if (req.query?.is_digital) {
    filter['is_digital'] = req.query.is_digital === 'true';
  }

  if (req.query?.title) {
    filter['title'] = new RegExp(req.query.title, 'i');
  }

  const result = await productService.queryProducts(filter, options);
  res.send(result);
});

const getProductsByCategory = catchAsync(async (
  req: Request<unknown, unknown, unknown, GetProductQueries>,
  res
) => {
  const defaultPopulate = 'shop,inventory,variants/inventory+variant_options.inventory';
  const defaultSelect = 'shop,title,variant_type,variants,images';

  const filter = pick(req.query, ['shop', 'price', 'title', 'category', 'is_digial']);
  const options = pick(req.query, ['sortBy', 'limit', 'page', 'populate', 'select']);

  options['populate'] = defaultPopulate;
  options['select'] = defaultSelect;

  if (req.query?.category) {
    const categoryIds = await categoryService.getSubCategoriesByCategory(req.query.category);
    filter['category'] = {
      $in: categoryIds,
    };
  }

  if (req.query?.sortBy === PRODUCT_SORT_BY.DESC) {
    options['sortBy'] = 'createdAt';
  }

  if (req.query?.is_digital) {
    filter['is_digital'] = req.query.is_digital === 'true';
  }

  if (req.query?.title) {
    filter['title'] = new RegExp(req.query.title, 'i');
  }

  const result = await productService.queryProducts(filter, options);

  let mapResult = [];
  mapResult = await Promise.all(
    result.results.map(async (prod) => {
      const obj = {
        id: '',
        shop_name: '',
        title: '',
        image_relative_url: '',
        summary_inventory: {
          lowest_price: 0,
          highest_price: 0,
          sale_price: 0,
          discount_types: [] as COUPON_TYPES[],
          percent_off: 0,
        },
      };
      obj.shop_name = prod.shop.shop_name;
      obj.title = prod.title;
      obj.id = prod.id as string;
      obj.image_relative_url = prod.images[0].relative_url;

      prod.variants && prod.variants.forEach((variant, indexVariant) => {
        if (prod.variant_type === PRODUCT_VARIANT_TYPES.SINGLE && variant?.inventory?.price) {
          // obj.summary_inventory.stock += variant.inventory.stock;
          if (indexVariant === 0 ||
            (variant.inventory.price < obj.summary_inventory.lowest_price)) {
            obj.summary_inventory.lowest_price = variant.inventory.price;
          }
          if (indexVariant === 0 ||
            (variant.inventory.price > obj.summary_inventory.highest_price)) {
            obj.summary_inventory.highest_price = variant.inventory.price;
          }
        }

        if (prod.variant_type === PRODUCT_VARIANT_TYPES.COMBINE) {
          variant.variant_options.forEach((varOpt, indexVarOpt) => {
            // obj.summary_inventory.stock += varOpt.inventory.stock;
            if (indexVarOpt === 0 ||
              (varOpt.inventory.price < obj.summary_inventory.lowest_price)) {
              obj.summary_inventory.lowest_price = varOpt.inventory.price;
            }
            if (indexVarOpt === 0 ||
              (varOpt.inventory.price > obj.summary_inventory.highest_price)) {
              obj.summary_inventory.highest_price = varOpt.inventory.price;
            }
          });
        }
      });

      if (prod.variant_type === PRODUCT_VARIANT_TYPES.NONE) {
        obj.summary_inventory.lowest_price = prod.inventory?.price;
        // prod.summary_inventory.stock = prod.inventory.stock;
      }

      const coupons = await Coupon.find({
        shop: prod.shop._id.toString(),
        is_auto_sale: true,
      });

      if (coupons) {
        coupons.forEach((coupon) => {
          if (coupon) {

            let isCouponSpecifyValid: boolean | undefined = false;
            if (coupon.applies_to === COUPON_APPLIES_TO.SPECIFIC) {
              isCouponSpecifyValid = coupon.applies_product_ids &&
                coupon.applies_product_ids.includes(prod.id);
            }

            if (coupon.applies_to === COUPON_APPLIES_TO.ALL || isCouponSpecifyValid) {
              const { lowest_price } = obj.summary_inventory;
              if (coupon.type) {
                obj.summary_inventory.discount_types.push(coupon.type);
              }
              if (coupon.type === COUPON_TYPES.FIXED_AMOUNT && coupon?.amount_off) {
                obj.summary_inventory.sale_price = lowest_price - coupon.amount_off;
                // obj.summary_inventory.percent_off = coupon.percent_off;
              }
              if (coupon.type === COUPON_TYPES.PERCENTAGE && coupon?.percent_off) {
                obj.summary_inventory.sale_price = lowest_price - (lowest_price * (coupon.percent_off / 100));
                obj.summary_inventory.percent_off = coupon.percent_off;
              }
            }
          }
        });
      }

      return obj;
    })
  );

  if (
    req.query?.sortBy &&
    (req.query?.sortBy === PRODUCT_SORT_BY.PRICE_ASC ||
      req.query?.sortBy === PRODUCT_SORT_BY.PRICE_DESC)
  ) {
    mapResult = mapResult.sort((a, b) => {
      if (req.query?.sortBy === PRODUCT_SORT_BY.PRICE_DESC) {
        return b.summary_inventory.lowest_price - a.summary_inventory.lowest_price;
      }
      return a.summary_inventory.lowest_price - b.summary_inventory.lowest_price;
    });
  }

  res.send({
    ...result,
    results: mapResult,
  });
});

const getDetailProduct = catchAsync(async (
  req: Request<GetProductParams>,
  res
) => {
  const product = await productService.getProductById(req.params.id as string);
  await product?.populate('shop', {
    shop_name: 1,
  });
  await product?.populate({
    path: 'variants',
    populate: [
      { path: 'inventory' },
      { path: 'variant_options.inventory' },
      { path: 'variant_options.variant', select: 'variant_name' },
    ],
  });
  await product?.populate('inventory');
  res.status(StatusCodes.OK).send({ product });
});

export const productController = {
  createProductByShop,
  getProductsByShop,
  getDetailProductByShop,
  updateProductByShop,
  deleteProductByShop,
  getProducts,
  getProductsByCategory,
  getDetailProduct,
};
