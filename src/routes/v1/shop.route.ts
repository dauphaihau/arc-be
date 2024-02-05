import express from 'express';
import { productValidation } from '@/validations/product.validation';
import { shopValidation, memberValidation, couponValidation } from '@/validations';
import {
  productController, shopController, memberController, couponController
} from '@/controllers';
import { auth, validate } from '@/middlewares';

const router = express.Router();

// Shop
router
  .route('/')
  .get(
    validate(shopValidation.getShops),
    shopController.getListShops
  )
  .post(
    validate(shopValidation.createShop),
    auth(),
    shopController.createShop
  )
  .delete(
    auth('deleteShop'),
    shopController.deleteShop
  );

// Members
router
  .route('/:shop_id/members')
  .post(
    validate(memberValidation.addMember),
    auth('addMember'),
    memberController.addMember
  )
  .get(
    validate(memberValidation.getMembers),
    memberController.getMembers
  );
router
  .route('/:shop_id/members/:user_id')
  .delete(
    validate(memberValidation.deleteMember),
    auth('deleteMembers'),
    memberController.deleteMember
  )
  .patch(
    validate(memberValidation.updateMember),
    auth('updateMembers'),
    memberController.updateMember
  );

// Product
router
  .route('/:shop/products')
  .post(
    // validate(productValidation.createProduct),
    auth('createProduct'),
    productController.createProduct
  )
  .get(validate(productValidation.getProducts), productController.getProductsByShop);

router
  .route('/:shop/products/:id')
  .get(
    validate(productValidation.getProduct),
    productController.getProduct
  )
  .patch(
    validate(productValidation.updateProduct),
    auth('updateProduct'),
    productController.updateProduct
  )
  .delete(
    validate(productValidation.deleteProduct),
    auth('deleteProduct'),
    productController.deleteProduct
  );

// Coupon
router
  .route('/:shop/coupons')
  .post(
    validate(couponValidation.createCoupon),
    auth('createCoupon'),
    couponController.createCoupon
  )
  .get(validate(couponValidation.getCoupons), couponController.getCouponsByShop);

router
  .route('/:shop/coupons/:id')
  .get(
    validate(couponValidation.getCoupon),
    couponController.getCoupon
  )
  .patch(
    validate(couponValidation.updateCoupon),
    auth('updateProduct'),
    couponController.updateCoupon
  )
  .delete(
    validate(couponValidation.deleteCoupon),
    auth('deleteProduct'),
    couponController.deleteCoupon
  );

export default router;
