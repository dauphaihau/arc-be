import { Schema, model } from 'mongoose';
import slugify from 'slugify';
import { toJSON, paginate } from '@/models/plugins';
import {
  productStates,
  PRODUCT_STATES,
  productWhoMade,
  productCategories,
  PRODUCT_MAX_IMAGES,
  PRODUCT_MAX_PRICE,
  PRODUCT_REG_SLUG,
  PRODUCT_REG_NOT_URL,
  PRODUCT_MAX_QUANTITY
} from '@/config/enums/product';
import {
  IProductModel,
  IProduct,
  IProductImage
} from '@/interfaces/models/product';

// define Schema
const imageSchema = new Schema<IProductImage>(
  {
    relative_url: {
      type: String,
      validate(value: string) {
        if (!value.match(PRODUCT_REG_NOT_URL)) {
          throw new Error('should not absolute url');
        }
      },
      required: true,
    },
    rank: {
      type: Number,
      default: 1,
    },
  }, {
    timestamps: true,
  }
);
imageSchema.plugin(toJSON);

const productSchema = new Schema<IProduct, IProductModel>(
  {
    shop_id: {
      type: Schema.Types.ObjectId,
      ref: 'Shop',
      required: true,
    },
    title: {
      type: String,
      min: 2,
      max: 140,
      required: true,
    },
    description: {
      type: String,
      min: 20,
      max: 140,
      required: true,
    },
    price: {
      type: Number,
      min: 1,
      max: PRODUCT_MAX_PRICE,
      required: true,
    },
    quantity: {
      type: Number,
      max: PRODUCT_MAX_QUANTITY,
      required: true,
    },
    views: {
      type: Number,
      required: true,
      default: 0,
    },
    slug: {
      type: String,
      validate(value: string) {
        if (!value.match(PRODUCT_REG_SLUG)) {
          throw new Error('invalid slug type');
        }
      },
    },
    tags: {
      type: [String],
      default: [],
    },
    state: {
      type: String,
      enum: productStates,
      default: PRODUCT_STATES.ACTIVE,
    },
    category: {
      type: String,
      enum: productCategories,
      required: true,
    },
    attributes: {
      type: Schema.Types.Mixed,
      required: true,
    },
    who_made: {
      type: String,
      enum: productWhoMade,
      required: true,
    },
    is_digital: {
      type: Boolean,
      default: false,
    },
    non_taxable: {
      type: Boolean,
      default: false,
    },
    images: {
      type: [imageSchema],
      default: [],
      min: 1,
      validate(value: object[]) {
        if (value.length > PRODUCT_MAX_IMAGES) {
          throw new Error(`exceeds the limit of ${PRODUCT_MAX_IMAGES}`);
        }
      },
      required: true,
    },
    rating_average: {
      type: Number,
      default: 0,
      min: [0, 'Rating must be more than 0'],
      max: [5, 'Rating must be equal or less than 5.0'],
      set: (val: number) => Math.round(val * 10) / 10,
    },
    sku: String,
  },
  {
    timestamps: true,
  }
);

// Middlewares
productSchema.pre('save', function (next) {
  this.slug = slugify(this.title, { lower: true });
  next();
});

// Plugins
productSchema.plugin(toJSON);
productSchema.plugin(paginate);

export const Product: IProductModel = model<IProduct, IProductModel>('Product', productSchema);
