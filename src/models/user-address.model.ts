import { Schema, model, Document } from 'mongoose';
import { IUserAddress, IUserAddressModel } from '@/interfaces/models/user-address';
import { toJSON, paginate } from '@/models/plugins';

// define Schema
const userAddressSchema = new Schema<IUserAddress, IUserAddressModel>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    full_name: {
      type: String,
      max: 20,
      required: true,
    },
    address1: {
      type: String,
      max: 50,
      required: true,
    },
    address2: {
      type: String,
      max: 50,
    },
    city: {
      type: String,
      max: 20,
      required: true,
    },
    state: {
      type: String,
      max: 20,
      required: true,
    },
    zip: {
      type: String,
      max: 10,
      required: true,
    },
    country: {
      type: String,
      required: true,
    },
    phone: {
      type: String,
      max: 20,
      required: true,
    },
    is_primary: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Plugins
userAddressSchema.plugin(toJSON);
userAddressSchema.plugin(paginate);

userAddressSchema.post(['find', 'findOne', 'findOneAndUpdate'], function (res) {
  if (!this.mongooseOptions().lean) {
    return;
  }
  if (Array.isArray(res)) {
    res.forEach(transformDoc);
    return;
  }
  transformDoc(res);
});

function transformDoc(doc: Document) {
  doc.id = doc._id;
  delete doc._id;
  delete doc.__v;
}

export const UserAddress: IUserAddressModel = model<IUserAddress, IUserAddressModel>('user_address', userAddressSchema);
