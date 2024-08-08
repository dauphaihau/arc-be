import express from 'express';
import { shopValidation, shopMemberValidation, shopCouponValidation } from '@/validations';
import {
  shopController, memberController, couponController
} from '@/controllers';
import { auth, validate } from '@/middlewares';
import { shopProductController } from '@/controllers/shop-product.controller';

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
    validate(shopMemberValidation.addMember),
    auth('addMember'),
    memberController.addMember
  )
  .get(
    validate(shopMemberValidation.getMembers),
    memberController.getMembers
  );
router
  .route('/:shop_id/members/:user_id')
  .delete(
    validate(shopMemberValidation.deleteMember),
    auth('deleteMembers'),
    memberController.deleteMember
  )
  .patch(
    validate(shopMemberValidation.updateMember),
    auth('updateMembers'),
    memberController.updateMember
  );

// Product
router
  .route('/:shop_id/products')
  .post(
    validate(shopValidation.createProduct),
    auth('createProduct'),
    shopProductController.createProduct
  )
  .get(
    validate(shopValidation.getProducts),
    shopProductController.getProducts
  );

router
  .route('/:shop_id/products/:product_id')
  .get(
    auth('detailProduct'),
    validate(shopValidation.getDetailProduct),
    shopProductController.getDetailProduct
  )
  .patch(
    validate(shopValidation.updateProduct),
    auth('updateProduct'),
    shopProductController.updateProduct
  )
  .delete(
    validate(shopValidation.deleteProduct),
    auth('deleteProduct'),
    shopProductController.deleteProduct
  );

// Coupon
router
  .route('/:shop_id/coupons')
  .post(
    validate(shopCouponValidation.createCoupon),
    auth('createCoupon'),
    couponController.createCoupon
  )
  .get(
    validate(shopCouponValidation.getCoupons),
    couponController.getCouponsByShop
  );

router
  .route('/:shop_id/coupons/:coupon_id')
  .get(
    validate(shopCouponValidation.getDetailCoupon),
    couponController.getDetailCoupon
  )
  .patch(
    validate(shopCouponValidation.updateCoupon),
    auth('updateCoupon'),
    couponController.updateCoupon
  )
  .delete(
    validate(shopCouponValidation.deleteCoupon),
    auth('deleteCoupon'),
    couponController.deleteCoupon
  );

export default router;
