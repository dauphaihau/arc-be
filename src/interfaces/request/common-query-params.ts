import { z } from 'zod';
import {
  baseQueryGetListSchema
} from '@/schemas/utils/common-query-params.schema';

export type BaseQueryGetList = z.infer<typeof baseQueryGetListSchema>;

export interface BaseResponseGetList<T> {
  results: T[]
  page: number
  limit: number
  total_results: number
  total_pages: number
}
