import { model, Schema } from 'mongoose';
import bcrypt from 'bcryptjs';
import validator from 'validator';
import { IUser, IUserModel } from '@/interfaces/models/user';
import { toJSON } from '@/models/plugins';

// Define schema.
const userSchema = new Schema<IUser, IUserModel>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      validate(value: string) {
        if (!validator.isEmail(value)) {
          throw new Error('Invalid email');
        }
      },
    },
    password: {
      type: String,
      required: true,
      trim: true,
      minlength: 8,
      validate(value: string) {
        if (!value.match(/\d/) || !value.match(/[a-zA-Z]/)) {
          throw new Error('Password must contain at least one letter and one number');
        }
      },
      private: true, // used by the toJSON plugin
    },
    is_email_verified: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// add plugin that converts mongoose to json
userSchema.plugin(toJSON);

// Validations
userSchema.path('name').required(true, 'User name cannot be blank.');

// Statics
userSchema.statics = {
  isEmailTaken: async function (email, excludeUserId) {
    const user = await this.findOne({ email, _id: { $ne: excludeUserId } });
    return !!user;
  },
};

// Methods
userSchema.methods = {
  isPasswordMatch: async function (password: string) {
    return bcrypt.compare(password, this['password']);
  },
};

// Middlewares
userSchema.pre('save', async function (next) {
  if (this.isModified('password')) {
    this.password = await bcrypt.hash(this.password, 8);
  }
  next();
});

export const User: IUserModel = model<IUser, IUserModel>('User', userSchema);
