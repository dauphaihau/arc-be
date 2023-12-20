import { model, Schema } from 'mongoose';
import bcrypt from 'bcryptjs';
import validator from 'validator';
import { IUser, IUserMethods, IUserModel } from '@/interfaces/models/user';
import { toJSON } from '@/models/plugins';
import { USER_REG_PASSWORD } from '@/config/enums/user';

// define Schema.
const userSchema = new Schema<IUser, IUserModel, IUserMethods>(
  {
    name: {
      type: String,
      min: 3,
      max: 60,
      trim: true,
      required: true,
    },
    email: {
      type: String,
      min: 6,
      max: 254,
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
        if (!value.match(USER_REG_PASSWORD)) {
          throw new Error('password must contain at least 1 lower letter, 1 uppercase letter, 1 number and 1 special character');
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

// Plugins
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
  isPasswordMatch: async function (this: IUser, password) {
    return bcrypt.compare(password, this.password);
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
