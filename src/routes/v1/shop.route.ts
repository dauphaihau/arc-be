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
    auth(),
    validate(shopValidation.createShop),
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
    auth('addMember'),
    validate(memberValidation.addMember),
    memberController.addMember
  )
  .get(
    validate(memberValidation.getMembers),
    memberController.getMembers
  );
router
  .route('/:shop_id/members/:user_id')
  .delete(
    auth('deleteMembers'),
    validate(memberValidation.deleteMember),
    memberController.deleteMember
  )
  .patch(
    auth('updateMembers'),
    validate(memberValidation.updateMember),
    memberController.updateMember
  );

// Product
router
  .route('/:shop_id/products')
  .post(
    auth('createProduct'),
    validate(productValidation.createProduct),
    productController.createProduct
  )
  .get(validate(productValidation.getProducts), productController.getProducts);

router
  .route('/:shop_id/products/:id')
  .patch(
    auth('updateProduct'),
    validate(productValidation.updateProduct),
    productController.updateProduct
  )
  .delete(
    auth('deleteProduct'),
    validate(productValidation.deleteProduct),
    productController.deleteProduct
  );

export default router;
