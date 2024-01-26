import express from 'express';
import { productController } from '@/controllers';
// import { productValidation } from '@/validations/product.validation';
// import { validate } from '@/middlewares';

const router = express.Router();

// Product
router
  .route('/')
  .get(
    // validate(productValidation.getProducts),
    productController.getProducts
  );

router
  .route('/:id')
  .get(
    // validate(productValidation.getProduct),
    productController.getProduct
  );

export default router;
