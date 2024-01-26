import { Document, Schema, model } from 'mongoose';
import slugify from 'slugify';
import {
  productStates,
  PRODUCT_STATES,
  productWhoMade,
  productCategories,
  PRODUCT_REGEX_SLUG,
  PRODUCT_REGEX_NOT_URL,
  PRODUCT_CONFIG,
  PRODUCT_VARIANT_TYPES
} from '@/config/enums/product';
import {
  IProductModel,
  IProduct,
  IProductImage
} from '@/interfaces/models/product';
import { toJSON, paginate } from '@/models/plugins';

// define image Schema
const imageSchema = new Schema<IProductImage>(
  {
    relative_url: {
      type: String,
      validate(value: string) {
        if (!value.match(PRODUCT_REGEX_NOT_URL)) {
          throw new Error('should not absolute url');
        }
      },
      required: true,
    },
    rank: {
      type: Number,
      min: PRODUCT_CONFIG.MIN_IMAGES,
      max: PRODUCT_CONFIG.MAX_IMAGES,
      default: 1,
    },
  }, {
    timestamps: true,
  }
);
imageSchema.plugin(toJSON);

// define product Schema
const productSchema = new Schema<IProduct, IProductModel>(
  {
    shop: {
      type: Schema.Types.ObjectId,
      ref: 'Shop',
      required: true,
    },
    title: {
      type: String,
      min: PRODUCT_CONFIG.MIN_CHAR_TITLE,
      max: PRODUCT_CONFIG.MAX_CHAR_TITLE,
      required: true,
    },
    description: {
      type: String,
      min: PRODUCT_CONFIG.MIN_CHAR_DESCRIPTION,
      max: PRODUCT_CONFIG.MAX_CHAR_DESCRIPTION,
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
        if (!value.match(PRODUCT_REGEX_SLUG)) {
          throw new Error('invalid slug type');
        }
      },
    },
    tags: {
      type: [String],
      min: PRODUCT_CONFIG.MIN_TAGS,
      max: PRODUCT_CONFIG.MAX_TAGS,
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
      min: PRODUCT_CONFIG.MIN_IMAGES,
      max: PRODUCT_CONFIG.MAX_IMAGES,
      validate(value: object[]) {
        if (value.length > PRODUCT_CONFIG.MAX_IMAGES) {
          throw new Error(`exceeds the limit of ${PRODUCT_CONFIG.MAX_IMAGES}`);
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
    variant_type: {
      type: String,
      enum: Object.values(PRODUCT_VARIANT_TYPES),
      default: PRODUCT_VARIANT_TYPES.NONE,
    },
    variants: {
      type: [{ type: Schema.Types.ObjectId, ref: 'product_variant' }],
    },
    inventory: {
      type: Schema.Types.ObjectId,
      ref: 'product_inventory',
    },
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

productSchema.post(['find', 'findOne', 'findOneAndUpdate'], function (res) {
  if (!this.mongooseOptions().lean) {
    return;
  }
  if (Array.isArray(res)) {
    res.forEach(transformDoc);
    return;
  }
  transformDoc(res);
});


// Plugins
productSchema.plugin(toJSON);
productSchema.plugin(paginate);

function transformDoc(doc: Document) {
  doc.id = doc._id;
  delete doc._id;
  delete doc.__v;
}

export const Product: IProductModel = model<IProduct, IProductModel>('Product', productSchema);
