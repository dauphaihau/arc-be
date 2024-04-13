import { connect, connection } from 'mongoose';
import { env } from './env';
import { log } from './logger';

export const mongoose = {
  run: async () => {
    try {
      await connect(env.mongoose.url);
      log.info('Connected to MongoDB');
    }
    catch (error) {
      log.error(error);
      throw error;
    }
  },

  stop: async () => {
    try {
      return await connection.destroy();
    }
    catch (error) {
      log.error(error);
    }
  },
};
