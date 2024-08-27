import { Schema, model } from 'mongoose';
import { toJSON } from '@/models/plugins';
import { ICategoryAttribute } from '@/interfaces/models/category-attribute';

// define Schema
const categoryAttributeSchema = new Schema<ICategoryAttribute>(
  {
    category: {
      type: Schema.Types.ObjectId,
      ref: 'Category',
      required: true,
    },
    name: {
      type: String,
      required: true,
    },
    options: {
      type: [Schema.Types.Mixed],
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
categoryAttributeSchema.plugin(toJSON);

export const CategoryAttribute = model<ICategoryAttribute>('category_attribute', categoryAttributeSchema);
