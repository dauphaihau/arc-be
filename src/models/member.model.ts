import { Schema, model, SchemaTypes } from 'mongoose';
import { toJSON, paginate } from './plugins';
import { memberRoles } from '@/config/enums/member';
import { IMember, IMemberModel } from '@/interfaces/models/member';

// define Schema
const memberSchema = new Schema<IMember, IMemberModel>(
  {
    shop: {
      type: SchemaTypes.ObjectId,
      ref: 'Shop',
      required: true,
    },
    user: {
      type: SchemaTypes.ObjectId,
      ref: 'User',
      required: true,
    },
    role: {
      type: String,
      required: true,
      enum: memberRoles,
    },
  },
  {
    timestamps: true,
  }
);

// Plugins
memberSchema.plugin(toJSON);
memberSchema.plugin(paginate);

export const Member: IMemberModel = model<IMember, IMemberModel>('Shop_Member', memberSchema);
