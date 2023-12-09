import mongoose from 'mongoose';
import { env } from '@/config';

export const setupTestDB = () => {
  beforeAll(async () => {
    await mongoose.connect(env.mongoose.url);
  });

  beforeEach(async () => {
    await Promise.all(Object.values(mongoose.connection.collections)
      .map(async (collection) => collection.deleteMany()));
  });

  afterAll(async () => {
    await mongoose.disconnect();
  });
};
