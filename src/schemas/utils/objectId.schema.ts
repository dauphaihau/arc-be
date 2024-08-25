import mongoose from 'mongoose';
import { z } from 'zod';

export const objectIdSchema = z.union(
  [
    z.instanceof(mongoose.Types.ObjectId),
    z.string().refine((val) => {
      return mongoose.Types.ObjectId.isValid(val);
    }, {
      message: 'should match objectId type',
    }),
  ]
);

// use this if the data is coming from an HTTP request,
export const objectIdHttpSchema = z.string().regex(/^[0-9a-f]{24}$/);
