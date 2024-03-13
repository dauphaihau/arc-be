import express from 'express';
import { productValidation } from '@/validations/product.validation';
import { productController } from '@/controllers';
import { validate } from '@/middlewares';

const router = express.Router();

router
  .route('/')
  .get(
    validate(productValidation.getProducts),
    productController.getProducts
  )
  .delete(
    validate(productValidation.getProductsByCategory),
    productController.getProductsByCategory
  );

router
  .route('/:id')
  .get(
    validate(productValidation.getDetailProduct),
    productController.getDetailProduct
  );

export default router;
