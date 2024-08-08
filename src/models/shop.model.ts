import { model, Schema, SchemaTypes } from 'mongoose';
import { IShop, IShopModel } from '@/interfaces/models/shop';
import { toJSON, paginate } from '@/models/plugins';

// define Schema.
const shopSchema = new Schema<IShop, IShopModel>(
  {
    shop_name: {
      type: String,
      required: true,
      maxLength: 20,
      unique: true,
      minlength: 6,
    },
    user: {
      type: SchemaTypes.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    timestamps: {
      createdAt: 'created_at',
      updatedAt: 'updated_at',
    },
  }
);

// Statics
shopSchema.statics = {
  isNameShopTaken: async function (shop_name, excludeUserId) {
    const shop = await this.findOne({ shop_name, _id: { $ne: excludeUserId } });
    return !!shop;
  },
};

// Plugins
shopSchema.plugin(toJSON);
shopSchema.plugin(paginate);

export const Shop: IShopModel = model<IShop, IShopModel>('Shop', shopSchema);
