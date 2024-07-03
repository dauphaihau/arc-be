import express from 'express';
import { userValidation } from '@/validations/user.validation';
import {
  cartValidation,
  orderValidation,
  userAddressValidation
} from '@/validations';
import {
  userAddressController,
  orderController,
  cartController,
  userController
} from '@/controllers';
import { auth, validate } from '@/middlewares';

const router = express.Router();

router
  .route('/')
  .patch(
    validate(userValidation.updateUser),
    auth(),
    userController.updateUser
  );

router
  .route('/me')
  .get(auth(), userController.getCurrentUser);

// Address
router
  .route('/addresses')
  .post(
    validate(userAddressValidation.create),
    auth(),
    userAddressController.createAddress
  )
  .get(
    auth(),
    validate(userAddressValidation.getList),
    userAddressController.getAddresses
  );

router
  .route('/addresses/:id')
  .patch(
    validate(userAddressValidation.update),
    auth(),
    userAddressController.updateAddress
  )
  .delete(
    validate(userAddressValidation.delete),
    auth(),
    userAddressController.deleteAddress
  )
  .get(
    validate(userAddressValidation.getDetail),
    auth(),
    userAddressController.getAddress
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
  .get(auth(), orderController.getOrderShopList);
router
  .route('/orders/:id')
  .get(auth(), orderController.getOrder);

router
  .route('/order/session')
  .get(
    validate(orderValidation.getOrderByCheckoutSession),
    auth(),
    orderController.getOrderByCheckoutSession
  );

export default router;
