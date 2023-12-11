import express from 'express';
import { shopValidation, memberValidation } from '@/validations';
import { shopController, memberController } from '@/controllers';
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

export default router;
