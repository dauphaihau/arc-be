import { IProductDoc } from '@/interfaces/models/product';

export type FolderObjectS3 = 'user' | 'shop';

export type GetPresignedUrlQueries = Pick<IProductDoc, 'shop'>;
