import { z } from 'zod';
import { ICategory } from '@/interfaces/models/category';
import { attributeSchema } from '@/schemas';

export type IAttribute = z.infer<typeof attributeSchema>;

export type CreateAttributePayload = Pick<IAttribute, 'name' | 'options'>;
export type CreateAttributeParams = Partial<Pick<ICategory, 'id'>>;

export type GetAttributesByCategoryParams = Partial<Pick<ICategory, 'id'>>;
