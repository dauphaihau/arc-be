import { Schema, model, SchemaTypes } from 'mongoose';
import { toJSON, paginate } from './plugins';
import { memberRoles } from '@/config/enums/shop';
import { IShopMember, IShopMemberModel } from '@/interfaces/models/shop-member';

// define Schema
const memberSchema = new Schema<IShopMember, IShopMemberModel>(
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
    timestamps: {
      createdAt: 'created_at',
      updatedAt: 'updated_at',
    },
  }
);

// Plugins
memberSchema.plugin(toJSON);
memberSchema.plugin(paginate);

export const ShopMember: IShopMemberModel = model<IShopMember, IShopMemberModel>('shop_member', memberSchema);
