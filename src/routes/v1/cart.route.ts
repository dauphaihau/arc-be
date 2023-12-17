import express from 'express';
import { cartController } from '@/controllers';
import { cartValidation } from '@/validations';
import { auth, validate } from '@/middlewares';

const router = express.Router();

router
  .route('/')
  .post(
    validate(cartValidation.addOrUpdateToCart),
    auth(),
    cartController.addOrUpdateToCart
  )
  .get(
    auth(),
    cartController.getCart
  )
  .delete(
    validate(cartValidation.deleteProductInCart),
    auth(),
    cartController.deleteProductInCart
  );

export default router;
