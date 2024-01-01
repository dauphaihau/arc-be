import express from 'express';
import { cartValidation, orderValidation } from '@/validations';
import {
  addressController,
  orderController,
  cartController,
  userController
} from '@/controllers';
import { auth, validate } from '@/middlewares';

const router = express.Router();

router
  .route('/me')
  .get(auth(), userController.me);

// Address
router
  .route('/addresses')
  .post(auth(), addressController.createAddress)
  .get(auth(), addressController.getAddresses);

router
  .route('/addresses/:id')
  .patch(auth(), addressController.updateAddress)
  .delete(auth(), addressController.deleteAddress)
  .get(auth(), addressController.getAddress);

// Cart
router
  .route('/cart')
  .post(
    validate(cartValidation.addOrUpdateProduct),
    auth(),
    cartController.addOrUpdateProduct
  )
  .patch(
    validate(cartValidation.updateProduct),
    auth(),
    cartController.updateProduct
  )
  .get(
    auth(),
    cartController.getCart
  )
  .delete(
    validate(cartValidation.deleteProduct),
    auth(),
    cartController.deleteProduct
  );

// Order
router
  .route('/order/review')
  .post(
    validate(orderValidation.reviewOrder),
    auth(),
    orderController.reviewOrder
  );
router
  .route('/orders')
  .post(
    validate(orderValidation.createOrder),
    auth(),
    orderController.createOrder
  )
  .get(auth(), orderController.getListOrders);
router
  .route('/orders/:id')
  .get(auth(), orderController.getOrder);

export default router;
