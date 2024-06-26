import { IProduct } from '@/interfaces/models/product';

export type FolderObjectS3 = 'user' | 'shop';

export type GetPresignedUrlQueries = Partial<Pick<IProduct, 'shop'>>;
