import express from 'express';
import { productValidation } from '@/validations/product.validation';
import { validate } from '@/middlewares';
import { productController } from '@/controllers';

const router = express.Router();

router
  .route('/')
  .get(
    validate(productValidation.getProducts),
    productController.getProducts
  );

router
  .route('/:product_id')
  .get(
    validate(productValidation.getDetailProduct),
    productController.getDetailProduct
  );

export default router;
