import httpStatus from 'http-status-codes';
import { ClientSession } from 'mongoose';
import { tokenService, userService } from '@/services';
import { transactionWrapper } from '@/utils';
import { Token } from '@/models';
import { ApiError } from '@/utils/ApiError';
import { TOKEN_TYPES } from '@/config/enums/token';
import { LoginPayload } from '@/interfaces/common/auth';

/**
 * Login with username ( email ) and password
 */
const login = async ({ email, password }: LoginPayload) => {
  const user = await userService.getUserByEmail(email);
  if (!user || !(await user.isPasswordMatch(password))) {
    throw new ApiError(httpStatus.UNAUTHORIZED, 'Incorrect email or password');
  }
  return user.populate('shop', 'shop_name _id');
};

/**
 * Logout, remove refresh token
 */
const logout = async (refreshToken: string) => {
  const refreshTokenDoc = await Token.findOne({
    token: refreshToken,
    type: TOKEN_TYPES.REFRESH,
    blacklisted: false,
  });
  if (!refreshTokenDoc) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Not found');
  }
  await refreshTokenDoc.remove();
};

/**
 * Refresh auth tokens
 */
const refreshAuth = async (refreshToken: string) => {
  try {
    const refreshTokenDoc = await tokenService.verifyToken(refreshToken, TOKEN_TYPES.REFRESH);
    const user = await userService.getUserById(refreshTokenDoc.user_id);
    if (!user) {
      throw new Error();
    }
    await refreshTokenDoc.remove();
    return tokenService.generateAuthTokens(user);
  }
  catch (error) {
    throw new ApiError(httpStatus.UNAUTHORIZED, 'Please authenticate');
  }
};

/**
 * Reset password
 */
const resetPassword = async (
  resetPasswordToken: string,
  newPassword: string,
  session: ClientSession
) => {
  try {
    const resetPasswordTokenDoc = await tokenService.verifyToken(
      resetPasswordToken,
      TOKEN_TYPES.RESET_PASSWORD
    );
    const user = await userService.getUserById(resetPasswordTokenDoc.user_id);
    if (!user) {
      throw new Error();
    }
    const userUpdated = await userService.updateUserById(
      user.id, { password: newPassword }, session
    );
    const deleted = await Token.deleteMany({
      user_id: user.id,
      type: TOKEN_TYPES.RESET_PASSWORD,
    }, { session });
    if (!deleted.deletedCount) throw new Error();
    return userUpdated;
  }
  catch (error) {
    throw new ApiError(httpStatus.UNAUTHORIZED, 'Password reset failed');
  }
};

/**
 * Verify email
 */
const verifyEmail = async (verifyEmailToken: string) => {
  await transactionWrapper(async (session) => {
    try {
      const verifyEmailTokenDoc = await tokenService.verifyToken(
        verifyEmailToken,
        TOKEN_TYPES.VERIFY_EMAIL
      );
      const user = await userService.getUserById(verifyEmailTokenDoc.user_id);
      if (!user) {
        throw new Error();
      }
      const deleted = await Token.deleteMany({
        user_id: user.id,
        type: TOKEN_TYPES.VERIFY_EMAIL,
      }, { session });
      if (!deleted.deletedCount) throw new Error();
      await userService.updateUserById(user.id, { is_email_verified: true }, session);
    }
    catch (error) {
      throw new ApiError(httpStatus.UNAUTHORIZED, 'Email verification failed');
    }
  });
};

export const authService = {
  login,
  logout,
  refreshAuth,
  resetPassword,
  verifyEmail,
};
