import express from 'express';
import { uploadValidation } from '@/validations';
import { auth, validate } from '@/middlewares';
import { uploadController } from '@/controllers';

const router = express.Router();

router.get('/',
  validate(uploadValidation.getPresignedUrl),
  auth(),
  uploadController.getPresignedUrl
);

export default router;
