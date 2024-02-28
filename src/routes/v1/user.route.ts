import express from 'express';
import {
  cartValidation,
  orderValidation,
  addressValidation
} from '@/validations';
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
  .post(
    auth(),
    validate(addressValidation.createAddress),
    addressController.createAddress
  )
  .get(
    auth(),
    validate(addressValidation.getAddresses),
    addressController.getAddresses
  );

router
  .route('/addresses/:id')
  .patch(
    auth(),
    validate(addressValidation.updateAddress),
    addressController.updateAddress
  )
  .delete(
    auth(),
    validate(addressValidation.deleteAddress),
    addressController.deleteAddress
  )
  .get(
    auth(),
    validate(addressValidation.getAddress),
    addressController.getAddress
  );

// Cart
router
  .route('/cart')
  .post(
    validate(cartValidation.addProduct),
    auth(),
    cartController.addProduct
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
  .put(
    auth(),
    cartController.getCartWithCoupons
  )
  .delete(
    validate(cartValidation.deleteProduct),
    auth(),
    cartController.deleteProduct
  );

// Order
router
  .route('/orders')
  .delete(
    validate(orderValidation.getSummaryOrder),
    auth(),
    orderController.getSummaryOrder
  )
  .post(
    validate(orderValidation.createOrderFromCart),
    auth(),
    orderController.createOrderFromCart
  )
  .put(
    validate(orderValidation.createOrderForBuyNow),
    auth(),
    orderController.createOrderForBuyNow
  )
  .get(auth(), orderController.getListOrders);
router
  .route('/orders/:id')
  .get(auth(), orderController.getOrder);

export default router;
