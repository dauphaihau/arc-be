import express from 'express';
import { cartController } from '@/controllers';
import { cartValidation } from '@/validations';
import { validate } from '@/middlewares';

const router = express.Router();

router
  .route('/')
  .post(
    validate(cartValidation.addProduct),
    cartController.addProduct
  )
  .get(
    cartController.getCart
  )
  .delete(
    validate(cartValidation.deleteProduct),
    cartController.deleteProduct
  );

export default router;
