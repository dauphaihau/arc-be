import { IUserDoc } from '@/interfaces/models/user';

declare module 'express-serve-static-core' {
  interface Request {
    user: IUserDoc;
  }
}
