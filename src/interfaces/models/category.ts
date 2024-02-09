import { z } from 'zod';
import { categorySchema } from '@/schemas';

export type ICategory = z.infer<typeof categorySchema>;

export type CreateCategoryPayload =
  Pick<ICategory, 'name'>
  & Partial<Pick<ICategory, 'parent'>>;

export type GetCategoryQueries = Partial<Pick<ICategory, 'parent'>>;
