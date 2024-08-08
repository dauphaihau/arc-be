import { Document, Schema, model } from 'mongoose';
import slugify from 'slugify';
import {
  PRODUCT_STATES,
  PRODUCT_REGEX_SLUG,
  PRODUCT_REGEX_NOT_URL,
  PRODUCT_CONFIG,
  PRODUCT_VARIANT_TYPES,
  PRODUCT_WHO_MADE
} from '@/config/enums/product';
import {
  IProductModel,
  IProductDoc,
  IProductImage,
  IProductAttribute,
  IProduct
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
    timestamps: {
      createdAt: 'created_at',
      updatedAt: 'updated_at',
    },
  }
);
imageSchema.plugin(toJSON);

// define attribute Schema
const productAttributeSchema = new Schema<IProductAttribute>(
  {
    attribute: {
      type: Schema.Types.ObjectId,
      ref: 'Attribute',
      required: true,
    },
    selected: {
      type: String,
    },
  }
);
productAttributeSchema.plugin(toJSON);

// define product Schema
const productSchema = new Schema<IProductDoc, IProductModel>(
  {
    shop: {
      type: Schema.Types.ObjectId,
      ref: 'Shop',
      required: true,
    },
    category: {
      type: Schema.Types.ObjectId,
      ref: 'Category',
    },
    inventory: {
      type: Schema.Types.ObjectId,
      ref: 'product_inventory',
      default: null,
    },
    shipping: {
      type: Schema.Types.ObjectId,
      ref: 'product_shipping',
      default: null,
    },
    variant_type: {
      type: String,
      enum: Object.values(PRODUCT_VARIANT_TYPES),
    },
    variant_group_name: {
      type: String,
      maxlength: PRODUCT_CONFIG.MAX_CHAR_VARIANT_GROUP_NAME,
      required: function (this: IProductDoc) {
        return this.variant_type === PRODUCT_VARIANT_TYPES.SINGLE ||
          this.variant_type === PRODUCT_VARIANT_TYPES.COMBINE;
      },
    },
    variant_sub_group_name: {
      type: String,
      maxlength: PRODUCT_CONFIG.MAX_CHAR_VARIANT_GROUP_NAME,
      required: function (this: IProductDoc) {
        return this.variant_type === PRODUCT_VARIANT_TYPES.COMBINE;
      },
    },
    variants: {
      type: [{ type: Schema.Types.ObjectId, ref: 'product_variant' }],
      default: [],
    },
    attributes: {
      type: [productAttributeSchema],
    },
    title: {
      type: String,
      min: PRODUCT_CONFIG.MIN_CHAR_TITLE,
      maxlength: PRODUCT_CONFIG.MAX_CHAR_TITLE,
      required: true,
    },
    description: {
      type: String,
      min: PRODUCT_CONFIG.MIN_CHAR_DESCRIPTION,
      maxlength: PRODUCT_CONFIG.MAX_CHAR_DESCRIPTION,
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
      default: [],
      validate(val: IProduct['tags']) {
        if (val) {
          if (val.length > PRODUCT_CONFIG.MAX_TAGS) {
            throw new Error('Cannot have more than ten tags');
          }
          if (val.some((tag) => tag.length > PRODUCT_CONFIG.MAX_CHAR_TAG)) {
            throw new Error('exceed max chars of tag');
          }
        }
      },
    },
    state: {
      type: String,
      enum: Object.values(PRODUCT_STATES),
      default: PRODUCT_STATES.ACTIVE,
    },
    who_made: {
      type: String,
      enum: Object.values(PRODUCT_WHO_MADE),
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
      validate(val: IProduct['images']) {
        if (val.length < PRODUCT_CONFIG.MIN_IMAGES || val.length > PRODUCT_CONFIG.MAX_IMAGES) {
          throw new Error('size is invalid');
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
  },
  {
    timestamps: {
      createdAt: 'created_at',
      updatedAt: 'updated_at',
    },
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

export const Product: IProductModel = model<IProductDoc, IProductModel>('Product', productSchema);
