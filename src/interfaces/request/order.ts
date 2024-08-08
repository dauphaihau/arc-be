import { z } from 'zod';
import { IOrderDoc } from '@/interfaces/models/order';
import { AtLeastOne } from '@/interfaces/utils';
import {
  createOrderFromCartBodySchema,
  createOrderForBuyNowBodySchema
} from '@/schemas/request/order';

export type CreateOrderForBuyNowBody = z.infer<typeof createOrderForBuyNowBodySchema>;

export type CreateOrderFromCartBody = z.infer<typeof createOrderFromCartBodySchema>;

export type IUpdateOrderBody = AtLeastOne<Pick<IOrderDoc, 'status' | 'payment'>>;
