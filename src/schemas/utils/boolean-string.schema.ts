import { z } from 'zod';

export const booleanStringSchema = z.preprocess(
  (val) => val === 'true', z.boolean()
).default(false);
