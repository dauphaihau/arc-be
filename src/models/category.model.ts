import { Document, Schema, model } from 'mongoose';
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
      maxlength: CATEGORY_CONFIG.MAX_CHAR_NAME,
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
    timestamps: {
      createdAt: 'created_at',
      updatedAt: 'updated_at',
    },
  }
);

categorySchema.post(['find', 'findOne', 'findOneAndUpdate'], function (res) {
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
categorySchema.plugin(toJSON);

function transformDoc(doc: Document) {
  doc.id = doc._id;
  delete doc._id;
  delete doc.__v;
}

export const Category = model<ICategory>('Category', categorySchema);
