// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import { Schema } from 'mongoose';

/**
 * A mongoose schemas plugin which applies the following in the toJSON transform call:
 *  - removes __v, createdAt, updatedAt, and any path that has private: true
 *  - replaces _id with id
 */

export const toJSON = (schema: Schema) => {
  if (!schema.options.toJSON) schema.options.toJSON = {};
  schema.options.toJSON = {
    transform(_doc, ret) {
      Object.keys(schema.paths).forEach((path) => {
        if (schema.paths[path].options && schema.paths[path].options['private']) {
          delete ret[path];
        }
      });

      if (ret?._id) {
        ret.id = ret._id.toString();
      }
      delete ret._id;
      delete ret.__v;
      delete ret.created_at;
      delete ret.updated_at;
    },
  };
};
