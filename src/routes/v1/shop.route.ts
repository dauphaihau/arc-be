import express from 'express';
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
    validate(shopValidation.createProductByShop),
    auth('createProduct'),
    productController.createProductByShop
  )
  .get(validate(shopValidation.getProductsByShop), productController.getProductsByShop);

router
  .route('/:shop/products/:id')
  .get(
    auth('detailProduct'),
    validate(shopValidation.getDetailProductByShop),
    productController.getDetailProductByShop
  )
  .patch(
    validate(shopValidation.updateProductByShop),
    auth('updateProduct'),
    productController.updateProductByShop
  )
  .delete(
    validate(shopValidation.deleteProductByShop),
    auth('deleteProduct'),
    productController.deleteProductByShop
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
