import { Document, Model, ObjectId } from 'mongoose';
import { TOKEN_TYPES } from '@/config/enums/token';

export interface IToken extends Document {
  user_id: ObjectId;
  token: string;
  type: TOKEN_TYPES;
  expires: Date;
  blacklisted: boolean;
}

export interface ITokenMethods {
  isPasswordMatch: (password: string) => Promise<boolean>;
}

export interface ITokenModel extends Model<IToken, unknown, ITokenMethods> {
  isEmailTaken: (email: string, excludeTokenId?: ObjectId) => Promise<boolean>;
}
