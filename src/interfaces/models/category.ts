import { z } from 'zod';
import { Document } from 'mongoose';
import { RequestBaseQueryParamsGetList } from '@/interfaces/request/other';
import { categorySchema } from '@/schemas';

export type ICategory = z.infer<typeof categorySchema> & Document;

export type CreateCategoryBody =
  Pick<ICategory, 'name'> &
  Partial<Pick<ICategory, 'parent' | 'relative_url_image' | 'rank'>>;

export type GetCategoryQueryParams = Pick<ICategory, 'parent' | 'name'> & RequestBaseQueryParamsGetList;

export type ICategorySearch = {
  id: ICategory['id']
  lastNameCategory: ICategory['name']
  categoriesRelated: ICategory['name'][]
};
