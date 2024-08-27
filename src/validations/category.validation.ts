import { z } from 'zod';
import { objectIdHttpSchema } from '@/schemas/utils/objectId.schema';
import {
  baseQueryGetListSchema
} from '@/schemas/utils/common-query-params.schema';
import { categorySchema } from '@/schemas';

export const categoryValidation = {
  getList: z.object({
    query: z.object({
      parent: objectIdHttpSchema.optional(),
    }).strict(),
  }),
  getSearchCategories: z.object({
    query: z.object({
      name: categorySchema.shape.name,
      limit: baseQueryGetListSchema.shape.limit.optional(),
    }).strict(),
  }),
  createCategory: z.object({
    body: z.object({
      name: categorySchema.shape.name,
      rank: categorySchema.shape.rank.optional(),
      parent: objectIdHttpSchema.optional(),
      relative_url_image: categorySchema.shape.relative_url_image.optional(),
    }).strict(),
  }),
};
