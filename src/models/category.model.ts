import { Schema, model } from 'mongoose';
import { CATEGORY_CONFIG } from '@/config/enums/category';
import { toJSON } from '@/models/plugins';
import { ICategory } from '@/interfaces/models/category';

// define Schema
const categorySchema = new Schema<ICategory>(
  {
    parent: {
      type: Schema.Types.ObjectId,
      default: null,
      ref: 'Category',
    },
    name: {
      type: String,
      max: CATEGORY_CONFIG.MAX_CHAR_NAME,
      required: true,
    },
    rank: {
      type: Number,
      min: 1,
      required: true,
    },
    relative_url_image: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

// Plugins
categorySchema.plugin(toJSON);

export const Category = model<ICategory>('Category', categorySchema);
