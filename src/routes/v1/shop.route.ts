import express from 'express';
import { productValidation } from '@/validations/product.validation';
import { shopValidation, memberValidation } from '@/validations';
import { productController, shopController, memberController } from '@/controllers';
import { auth, validate } from '@/middlewares';

const router = express.Router();

// Shop
router
  .route('/')
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
  .route('/:shop_id/products')
  .post(
    validate(productValidation.createProduct),
    auth('createProduct'),
    productController.createProduct
  )
  .get(validate(productValidation.getProducts), productController.getProducts);

router
  .route('/:shop_id/products/:id')
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

export default router;
