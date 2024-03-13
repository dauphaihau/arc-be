import express from 'express';
import { categoryController, attributeController } from '@/controllers';

const router = express.Router();

router
  .route('/')
  .get(
    categoryController.getCategories
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
    attributeController.createAttribute
  )
  .get(
    attributeController.getAttributesByCategory
  );

export default router;
