import { z } from 'zod';
import { ICategory } from '@/interfaces/models/category';
import { categoryAttributeSchema } from '@/schemas';

export type ICategoryAttribute = z.infer<typeof categoryAttributeSchema>;

export type CreateCategoryAttributeBody = Pick<ICategoryAttribute, 'name' | 'options'>;

export type CreateCategoryAttributeParams = Partial<Pick<ICategory, 'id'>>;

export type GetAttributesByCategoryParams = Partial<Pick<ICategory, 'id'>>;
