import express from 'express';
import { categoryController, categoryAttributeController } from '@/controllers';

const router = express.Router();

router
  .route('/')
  .get(
    categoryController.getList
  )
  .delete(
    categoryController.getSearchCategories
  )
  .post(
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
