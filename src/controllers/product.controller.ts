import { Request } from 'express';
import { StatusCodes } from 'http-status-codes';
import { productService, inventoryService } from '@/services';
import { catchAsync, pick, transactionWrapper } from '@/utils';
import {
  CreateProductPayload,
  CreateProductParams,
  GetProductParams,
  DeleteProductParams,
  UpdateProductParams,
  UpdateProductPayload
} from '@/interfaces/models/product';
import { Inventory } from '@/models';
import { ApiError } from '@/utils';

const createProduct = catchAsync(async (
  req: Request<CreateProductParams, unknown, CreateProductPayload>,
  res
) => {
  const shop_id = req.params.shop_id as string;
  await transactionWrapper(async (session) => {
    const product = await productService.createProduct({
      ...req.body,
      shop_id,
      category: req.body.attributes.category,
    }, session);
    await inventoryService.insertInventory(
      {
        shop_id,
        product_id: product.id,
        stock: product.quantity,
      }, session
    );
    res.status(StatusCodes.CREATED).send({ product });
  });
});

const getProducts = catchAsync(async (
  req: Request<GetProductParams>,
  res
) => {
  const filter = pick(
    {
      ...req.query,
      shop_id: req.params.shop_id,
    },
    ['shop_id', 'price', 'name', 'category']
  );
  const options = pick(req.query, ['sortBy', 'limit', 'page']);
  options['select'] = { attributes: 0 };
  const result = await productService.queryProducts(filter, options);
  res.send(result);
});

const deleteProduct = catchAsync(async (
  req: Request<DeleteProductParams>,
  res
) => {
  const product_id = req.params.id;

  await transactionWrapper(async (session) => {
    await productService.deleteProductById(product_id, session);
    // delete all image aws s3

    // product.product_images.forEach((image) => {
    //   awsS3Service.deleteObject(image.url);
    // });

    await Inventory.deleteOne({ product_id }, { session });
    res.status(StatusCodes.NO_CONTENT).send();
  });
});

const updateProduct = catchAsync(async (
  req: Request<UpdateProductParams, unknown, UpdateProductPayload>,
  res
) => {
  const product_id = req.params.id;

  await transactionWrapper(async (session) => {
    const product = await productService.updateProduct(req.params.id, req.body);

    // update stock
    if (req.body?.quantity) {
      const updatedInv = await inventoryService.updateStock({
        shop_id: product.shop_id,
        product_id,
        stock: product.quantity,
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
  getProducts,
  deleteProduct,
  updateProduct,
};
