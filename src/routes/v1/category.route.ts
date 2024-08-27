import express from 'express';
import { validate } from '@/middlewares';
import { categoryValidation } from '@/validations/category.validation';
import { categoryController, categoryAttributeController } from '@/controllers';

const router = express.Router();

router
  .route('/')
  .get(
    validate(categoryValidation.getList),
    categoryController.getList
  )
  .delete(
    validate(categoryValidation.getSearchCategories),
    categoryController.getSearchCategories
  )
  .post(
    validate(categoryValidation.createCategory),
    categoryController.createRootOrSubCategory
  );

// Attributes
router
  .route('/:id/attributes')
  .post(
    categoryAttributeController.createAttribute
  )
  .get(
    categoryAttributeController.getAttributesByCategory
  );

export default router;
