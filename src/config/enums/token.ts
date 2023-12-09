export enum TOKEN_TYPES {
  ACCESS = 'access',
  REFRESH = 'refresh',
  RESET_PASSWORD = 'resetPassword',
  VERIFY_EMAIL = 'verifyEmail'
}

export const tokenTypes = Object.values(TOKEN_TYPES);
