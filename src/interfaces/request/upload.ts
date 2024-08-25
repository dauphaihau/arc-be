import { CustomZodInfer } from '../utils';
import { RequestQueryParams } from '@/interfaces/express';
import { uploadValidation } from '@/validations';

export type FolderObjectS3 = 'user' | 'shop';

type GetPresignedUrl = CustomZodInfer<typeof uploadValidation.getPresignedUrl>;
export type RequestGetPresignedUrl = RequestQueryParams<GetPresignedUrl['query']>;
