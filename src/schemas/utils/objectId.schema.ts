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
