import { z } from 'zod';
import { baseQueryGetListSchema } from '@/schemas/utils/query-options.schema';

export type BaseQueryGetList = z.infer<typeof baseQueryGetListSchema>;

export type RequestBaseQueryParamsGetList = Record<keyof BaseQueryGetList, string>;
