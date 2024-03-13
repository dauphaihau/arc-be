import { z } from 'zod';
import { Document } from 'mongoose';
import { categorySchema } from '@/schemas';
import { BaseQueryParamsGetList } from '@/interfaces/common/request';

export type ICategory = z.infer<typeof categorySchema> & Document;

export type CreateCategoryPayload =
  Pick<ICategory, 'name'>
  & Partial<Pick<ICategory, 'parent'>>;

export type GetCategoryQueries = Partial<Pick<ICategory, 'parent' | 'name'> & BaseQueryParamsGetList>;


export type ICategorySearch = {
  id: ICategory['id']
  lastNameCategory: ICategory['name']
  categoriesRelated: ICategory['name'][]
};
