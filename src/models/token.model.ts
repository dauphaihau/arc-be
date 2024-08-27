import { model, Schema, SchemaTypes } from 'mongoose';
import { tokenTypes } from '@/config/enums/token';
import { IToken, ITokenModel } from '@/interfaces/models/token';
import { toJSON } from '@/models/plugins';

// define Schema
const tokenSchema = new Schema<IToken, ITokenModel>(
  {
    token: {
      type: String,
      required: true,
      index: true,
    },
    user: {
      type: SchemaTypes.ObjectId,
      ref: 'User',
      required: true,
    },
    type: {
      type: String,
      enum: tokenTypes,
      required: true,
    },
    expires: {
      type: Date,
      required: true,
    },
    blacklisted: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: {
      createdAt: 'created_at',
      updatedAt: 'updated_at',
    },
  }
);

// Plugins
tokenSchema.plugin(toJSON);

export const Token = model<IToken, ITokenModel>('Token', tokenSchema);
