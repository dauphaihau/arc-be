// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import { Request } from 'express';
import { StatusCodes } from 'http-status-codes';
import { log } from '@/config';
import { PRODUCT_VARIANT_TYPES } from '@/config/enums/product';
import {
  CreateProductPayload,
  CreateProductParams,
  GetProductParams,
  DeleteProductParams,
  UpdateProductParams,
  UpdateProductPayload,
  GetProductsParams,
  IProductInventory
} from '@/interfaces/models/product';
import { Inventory } from '@/models';
import { productService, inventoryService, awsS3Service } from '@/services';
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
      variants, stock, price, ...resBody
    } = req.body;

    const product = await productService.createProduct({
      ...resBody,
      shop: shopId,
      category: req.body.attributes.category,
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
  await product?.populate({
    path: 'variants',
    populate: [
      {
        path: 'inventory',
      },
      {
        path: 'variant_options.inventory',
      },
    ],
  });
  await product?.populate('inventory');
  res.status(StatusCodes.OK).send({ product });
});

const getProductsByShop = catchAsync(async (
  req: Request<GetProductsParams>,
  res
) => {
  const filter = pick(
    {
      ...req.query,
      shop: req.params.shop,
    },
    ['shop', 'price', 'name', 'category']
  );
  const options = pick(req.query, ['sortBy', 'limit', 'page', 'populate', 'select']);
  const result = await productService.queryProducts(filter, options);
  res.send(result);
});

const getProducts = catchAsync(async (
  req: Request<GetProductsParams>,
  res
) => {
  const defaultPopulate = 'shop,inventory,variants/inventory+variant_options.inventory';
  const filter = pick(req.query, ['shop', 'price', 'name', 'category']);
  const options = pick(req.query, ['sortBy', 'limit', 'page', 'populate', 'select']);
  options['populate'] = defaultPopulate;
  // console.log('options', options);

  const result = await productService.queryProducts(filter, options);
  // console.log('result', result);

  result.results = result.results.map((prod) => {
    if (prod.variant_type === PRODUCT_VARIANT_TYPES.NONE) {
      return prod;
    }
    let variantLowestPrice: IProductInventory | undefined;
    prod.variants && prod.variants.forEach((vari, idx) => {
      if (prod.variant_type === PRODUCT_VARIANT_TYPES.SINGLE && vari?.inventory?.price) {
        if (idx === 0 ||
          (variantLowestPrice?.price && vari.inventory.price < variantLowestPrice.price)
        ) {
          variantLowestPrice = vari.inventory;
        }

      }

      if (prod.variant_type === PRODUCT_VARIANT_TYPES.COMBINE) {
        vari.variant_options.forEach((varOpt, index) => {
          if (index === 0 ||
            (variantLowestPrice?.price && varOpt.inventory.price < variantLowestPrice.price)
          ) {
            variantLowestPrice = varOpt.inventory;
          }
        });
      }
    });

    if (variantLowestPrice) {
      prod.inventory = variantLowestPrice;
    }
    return prod;
  });

  res.send(result);
});

const deleteProduct = catchAsync(async (
  req: Request<DeleteProductParams>,
  res
) => {
  const product_id = req.params.id as string;

  await transactionWrapper(async (session) => {
    const result = await productService.deleteProductById(product_id, session);

    result.images.forEach((image) => {
      awsS3Service.deleteObject(image.relative_url);
    });

    await Inventory.deleteOne({ product_id }, { session });
    res.status(StatusCodes.NO_CONTENT).send();
  });
});

const updateProduct = catchAsync(async (
  req: Request<UpdateProductParams, unknown, UpdateProductPayload>,
  res
) => {
  const product_id = req.params.id as string;

  await transactionWrapper(async (session) => {
    const product = await productService.updateProduct(product_id, req.body, session);

    // update stock
    if (req.body?.stock) {
      const updatedInv = await inventoryService.updateStock({
        shop: product.shop,
        product: product_id,
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
};
