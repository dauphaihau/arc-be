import { model, Schema, SchemaTypes } from 'mongoose';
import { IShop, IShopModel } from '@/interfaces/models/shop';
import { toJSON } from '@/models/plugins';

const shopSchema = new Schema<IShop, IShopModel>(
  {
    shop_name: {
      type: String,
      required: true,
      maxLength: 20,
      unique: true,
      minlength: 6,
    },
    user_id: {
      type: SchemaTypes.ObjectId,
      ref: 'User',
      required: true,
    },
    // members: {
    //   type: Schema.Types.Mixed,
    // },
  },
  {
    timestamps: true,
  }
);

// add plugin that converts mongoose to json
shopSchema.plugin(toJSON);

/**
 * Check if name is taken
 */
shopSchema.statics = {
  isNameShopTaken: async function (shop_name, excludeUserId) {
    const shop = await this.findOne({ shop_name, _id: { $ne: excludeUserId } });
    return !!shop;
  },
};

/**
 * @typedef Shop
 */
export const Shop: IShopModel = model<IShop, IShopModel>('Shop', shopSchema);
