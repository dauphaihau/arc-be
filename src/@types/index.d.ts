import { IUser } from '@/interfaces/models/user';

declare module 'express-serve-static-core' {
  interface Request {
    user: IUser;
  }
}
