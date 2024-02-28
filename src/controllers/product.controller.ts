import { Request } from 'express';
import { StatusCodes } from 'http-status-codes';
import { log } from '@/config';
import { PRODUCT_VARIANT_TYPES, PRODUCT_SORT_BY } from '@/config/enums/product';
import {
  CreateProductPayload,
  CreateProductParams,
  GetProductParams,
  DeleteProductParams,
  UpdateProductParams,
  UpdateProductPayload,
  GetProductQueries,
  GetProductByShopParams
} from '@/interfaces/models/product';
import { ProductInventory } from '@/models';
import { ProductVariant } from '@/models/product-variant.model';
import {
  productService,
  inventoryService,
  awsS3Service,
  categoryService
} from '@/services';
import {
  catchAsync, pick, transactionWrapper, ApiError
} from '@/utils';

const createProduct = catchAsync(async (
  req: Request<CreateProductParams, unknown, CreateProductPayload>,
  res
) => {
  const shopId = req.params.shop as string;

  await transactionWrapper(async (session) => {
    const {
      variants, stock, price, sku, ...resBody
    } = req.body;

    const product = await productService.createProduct({
      ...resBody,
      shop: shopId,
    }, session);

    let variantType = PRODUCT_VARIANT_TYPES.NONE;

    // case have variants
    if (variants && variants.length > 0) {
      const prodVariantsIds: string[] = [];

      if (variants[0].sub_variant_group_name) {
        log.info('case combine variants');
        await Promise.all(
          variants.map(async (vari) => {
            await Promise.all(
              vari.variant_options.map(async (subVar) => {
                const invProdVar = await inventoryService.insertInventory(
                  {
                    shop: shopId,
                    product: product.id,
                    variant: vari.variant_name + '-' + subVar.variant_name,
                    price: subVar.price || 0,
                    stock: subVar.stock || 0,
                    sku: subVar.sku,
                  },
                  session
                );
                subVar.inventory = invProdVar.id;
              })
            );
            const prodVar = await productService.createProductVariant(
              {
                product: product.id,
                variant_group_name: vari.variant_group_name,
                sub_variant_group_name: vari.sub_variant_group_name,
                variant_name: vari.variant_name,
                variant_options: vari.variant_options,
              },
              session
            );
            prodVariantsIds.push(prodVar.id);
          })
        );
        variantType = PRODUCT_VARIANT_TYPES.COMBINE;
      } else {
        log.info('case single variant');
        await Promise.all(
          variants.map(async (vari) => {
            const invProdVar = await inventoryService.insertInventory({
              shop: shopId,
              product: product.id,
              variant: vari.variant_name,
              stock: vari.stock || 0,
              price: vari.price || 0,
              sku: vari.sku,
            }, session);

            const prodVar = await productService.createProductVariant({
              product: product.id,
              inventory: invProdVar.id,
              variant_group_name: vari.variant_group_name,
              variant_name: vari.variant_name,
              variant_options: [],
            }, session);
            prodVariantsIds.push(prodVar.id);
          })
        );
        variantType = PRODUCT_VARIANT_TYPES.SINGLE;
      }

      await product.update({
        variants: prodVariantsIds,
        variant_type: variantType,
      }, { session });

      res.status(StatusCodes.CREATED).send({ product });
      return;
    }

    // case non-variant
    const inventory = await inventoryService.insertInventory(
      {
        shop: shopId,
        product: product.id,
        stock: stock || 0,
        price: price || 0,
        sku,
      }, session
    );
    await product.update({
      inventory: inventory.id,
      variant_type: variantType,
    }, { session });
    res.status(StatusCodes.CREATED).send({ product });
  });
});

const getProduct = catchAsync(async (
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
    ],
  });
  await product?.populate('inventory');
  res.status(StatusCodes.OK).send({ product });
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
  const defaultPopulate = 'shop,inventory,variants/inventory+variant_options.inventory';
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
          prod.summary_inventory.stock += varOpt.inventory.stock;
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
    // filter['title'] = {
    //   $regex: '.*' + req.query.title + '.*',
    // };
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
    // filter['title'] = {
    //   $regex: '.*' + req.query?.title + '.*',
    // };
    filter['title'] = new RegExp(req.query.title, 'i');
  }

  const result = await productService.queryProducts(filter, options);

  let mapResult = [];

  mapResult = result.results.map((prod) => {
    const obj = {
      id: '',
      shop_name:'',
      title:'',
      image_relative_url:'',
      summary_inventory: {
        lowest_price: 0,
        highest_price: 0,
      },
    };
    obj.shop_name = prod.shop.shop_name;
    obj.title = prod.title;
    obj.id = prod.id as string;
    obj.image_relative_url = prod.images[0].relative_url;

    if (prod.variant_type === PRODUCT_VARIANT_TYPES.NONE) {
      obj.summary_inventory.lowest_price = prod.inventory.price;
      // prod.summary_inventory.stock = prod.inventory.stock;
    }

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
    return obj;
  });

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


const deleteProduct = catchAsync(async (
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

const updateProduct = catchAsync(async (
  req: Request<UpdateProductParams, unknown, UpdateProductPayload>,
  res
) => {
  const productId = req.params.id as string;

  await transactionWrapper(async (session) => {
    const product = await productService.updateProduct(productId, req.body, session);

    // update stock
    if (req.body?.stock) {
      const updatedInv = await inventoryService.updateStock({
        // shop: product.shop as IPopulatedShop,
        shop: product.shop as string,
        product: productId,
        stock: req.body.stock,
      }, session);
      if (!updatedInv.modifiedCount) {
        throw new ApiError(StatusCodes.BAD_REQUEST, 'Update stock failed');
      }
    }
    res.send({ product });
  });
});

export const productController = {
  createProduct,
  getProduct,
  getProducts,
  deleteProduct,
  updateProduct,
  getProductsByShop,
  getProductsByCategory,
};
