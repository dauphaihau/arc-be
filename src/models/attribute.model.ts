import { Schema, model } from 'mongoose';
import { toJSON } from '@/models/plugins';
import { IAttribute } from '@/interfaces/models/attribute';

// define Schema
const attributeSchema = new Schema<IAttribute>(
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
    timestamps: true,
  }
);

// Plugins
attributeSchema.plugin(toJSON);

export const Attribute = model<IAttribute>('Attribute', attributeSchema);
