import { z } from 'zod';
import { Document } from 'mongoose';
import { categorySchema } from '@/schemas';
import { BaseQueryParamsGetList } from '@/interfaces/common/request';

export type ICategory = z.infer<typeof categorySchema> & Document;

export type CreateCategoryBody =
  Pick<ICategory, 'name'>
  & Partial<Pick<ICategory, 'parent'>>;

export type GetCategoryQueries = Pick<ICategory, 'parent' | 'name'> & BaseQueryParamsGetList;

export type ICategorySearch = {
  id: ICategory['id']
  lastNameCategory: ICategory['name']
  categoriesRelated: ICategory['name'][]
};
