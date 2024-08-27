import { z } from 'zod';
import { Document } from 'mongoose';
import { categorySchema } from '@/schemas';

export type ICategory = z.infer<typeof categorySchema> & Document;

export type ICategorySearch = {
  id: ICategory['id']
  lastNameCategory: ICategory['name']
  categoriesRelated: ICategory['name'][]
};
