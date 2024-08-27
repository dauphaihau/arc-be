import { Schema, model, Document } from 'mongoose';
import { IUserAddressDoc, IUserAddressModel } from '@/interfaces/models/user-address';
import { toJSON, paginate } from '@/models/plugins';

// define Schema
const userAddressSchema = new Schema<IUserAddressDoc, IUserAddressModel>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    full_name: {
      type: String,
      maxlength: 20,
      required: true,
    },
    address1: {
      type: String,
      maxlength: 50,
      required: true,
    },
    address2: {
      type: String,
      maxlength: 50,
    },
    city: {
      type: String,
      maxlength: 20,
      required: true,
    },
    state: {
      type: String,
      maxlength: 20,
      required: true,
    },
    zip: {
      type: String,
      maxlength: 10,
      required: true,
    },
    country: {
      type: String,
      required: true,
    },
    phone: {
      type: String,
      maxlength: 20,
      required: true,
    },
    is_primary: {
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

export const UserAddress: IUserAddressModel = model<IUserAddressDoc, IUserAddressModel>('user_address', userAddressSchema);
