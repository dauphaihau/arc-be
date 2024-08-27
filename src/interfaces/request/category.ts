import { z } from 'zod';
import { RequestBody } from '@/interfaces/express';
import { categoryValidation } from '@/validations/category.validation';

type CreateCategory = z.infer<typeof categoryValidation.createCategory>;
export type RequestCreateCategory = RequestBody<CreateCategory['body']>;
