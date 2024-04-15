import { model, Schema, SchemaTypes } from 'mongoose';
import bcrypt from 'bcryptjs';
import validator from 'validator';
import {
  MARKETPLACE_CONFIG,
  MARKETPLACE_LANGUAGES, MARKETPLACE_REGIONS, MARKETPLACE_CURRENCIES
} from '@/config/enums/marketplace';
import { IUser, IUserMethods, IUserModel } from '@/interfaces/models/user';
import { toJSON } from '@/models/plugins';
import { USER_REGEX_NAME, USER_CONFIG } from '@/config/enums/user';

// define Schema.
const userSchema = new Schema<IUser, IUserModel, IUserMethods>(
  {
    name: {
      type: String,
      min: USER_CONFIG.MIN_CHAR_NAME,
      max: USER_CONFIG.MAX_CHAR_NAME,
      trim: true,
      validate(value: string) {
        if (!value.match(USER_REGEX_NAME)) {
          throw new Error('name accept only the letters and space');
        }
      },
      required: true,
    },
    email: {
      type: String,
      min: USER_CONFIG.MIN_CHAR_EMAIL,
      max: USER_CONFIG.MAX_CHAR_EMAIL,
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
      min: USER_CONFIG.MIN_CHAR_PASSWORD,
      max: USER_CONFIG.MAX_CHAR_PASSWORD,
      // validate(value: string) {
      //   if (!value.match(USER_REGEX_PASSWORD)) {
      //     throw new Error('password must contain at least 1 lower letter, 1 uppercase letter, 1 number and 1 special character');
      //   }
      // },
      private: true, // used by the toJSON plugin
    },
    is_email_verified: {
      type: Boolean,
      default: false,
    },
    shop: {
      type: SchemaTypes.ObjectId,
      ref: 'Shop',
    },
    market_preferences: {
      region: {
        type: String,
        enum: Object.values(MARKETPLACE_REGIONS),
        default: MARKETPLACE_CONFIG.BASE_REGION,
      },
      language: {
        type: String,
        enum: Object.values(MARKETPLACE_LANGUAGES),
        default: MARKETPLACE_CONFIG.BASE_LANGUAGE,
      },
      currency: {
        type: String,
        enum: Object.values(MARKETPLACE_CURRENCIES),
        default: MARKETPLACE_CONFIG.BASE_CURRENCY,
      },
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
