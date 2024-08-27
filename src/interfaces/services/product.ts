import { z } from 'zod';
import { baseCreateProductSchema } from '@/schemas/services/product';

export type BaseCreateProduct = z.infer<typeof baseCreateProductSchema>;
