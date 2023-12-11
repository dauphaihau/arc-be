declare namespace Express {
  type User = import('./src/interfaces/models/user').User;

  interface Request {
    user: User;
  }
}
