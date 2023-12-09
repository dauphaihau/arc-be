declare namespace Express {
  interface Request {
    user: import('./src/interfaces/models/user').IUser;
  }
}
