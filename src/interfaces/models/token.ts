import { z } from 'zod';
import { Document, Model, ObjectId } from 'mongoose';
import { tokenSchema } from '@/schemas';

export type IToken = z.infer<typeof tokenSchema> & Document;

export interface ITokenModel extends Model<IToken, unknown> {
  isEmailTaken: (email: string, excludeTokenId?: ObjectId) => Promise<boolean>;
}

type TokenInCookie = Pick<IToken, 'token' | 'expires'>;

export type TokensResponse = Record<'access' | 'refresh', TokenInCookie>;
