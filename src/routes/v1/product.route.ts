import express from 'express';
import { productController } from '@/controllers';
// import { validate } from '@/middlewares';

const router = express.Router();

router
  .route('/')
  .get(
    // validate(),
    productController.getProducts
  )
  .delete(
    // validate(),
    productController.getProductsByCategory
  );

router
  .route('/:id')
  .get(
    // validate(),
    productController.getProduct
  );

export default router;
