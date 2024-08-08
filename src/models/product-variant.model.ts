import { Schema, model } from 'mongoose';
import { toJSON } from '@/models/plugins';
import {
  PRODUCT_REGEX_NOT_URL,
  PRODUCT_CONFIG
} from '@/config/enums/product';
import {
  IProductVariant,
  IProductVariantOpt
} from '@/interfaces/models/product';

// define Variant Option Schema
const productVariantOptSchema = new Schema<IProductVariantOpt>(
  {
    variant: {
      type: Schema.Types.ObjectId,
      ref: 'product_variant',
    },
    inventory: {
      type: Schema.Types.ObjectId,
      ref: 'product_inventory',
    },
  },
  {
    timestamps: {
      createdAt: 'created_at',
      updatedAt: 'updated_at',
    },
  }
);
productVariantOptSchema.plugin(toJSON);

// define Variant Schema
const productVariantSchema = new Schema<IProductVariant>(
  {
    product: {
      type: Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
    },
    inventory: {
      type: Schema.Types.ObjectId,
      ref: 'product_inventory',
    },
    variant_name: {
      type: String,
      maxlength: PRODUCT_CONFIG.MAX_CHAR_VARIANT_GROUP_NAME,
      required: true,
    },
    image_relative_url: {
      type: String,
      validate(value: string) {
        if (!value.match(PRODUCT_REGEX_NOT_URL)) {
          throw new Error('should not absolute url');
        }
      },
    },
    variant_options: {
      type: [productVariantOptSchema],
    },
  },
  {
    timestamps: {
      createdAt: 'created_at',
      updatedAt: 'updated_at',
    },
  }
);
productVariantSchema.plugin(toJSON);

export const ProductVariant = model<IProductVariant>('product_variant', productVariantSchema);
