import httpStatus from 'http-status-codes';
import { ClientSession, ObjectId } from 'mongoose';
import jwt from 'jsonwebtoken';
import moment from 'moment';
import { ApiError } from '@/utils';
import { TOKEN_TYPES } from '@/config/enums/token';
import { env, log } from '@/config';
import { userService } from '@/services';
import { Token } from '@/models';
import { IUser } from '@/interfaces/models/user';

const generateToken = (
  userId: ObjectId,
  expires: moment.Moment,
  type: string,
  secret = env.jwt.secret
) => {
  const payload = {
    sub: userId,
    iat: moment().unix(),
    exp: expires.unix(),
    type,
  };
  return jwt.sign(payload, secret);
};

/**
 * Save a token
 */
const saveToken = async (
  token: string,
  userId: ObjectId,
  expires: moment.Moment,
  type: string,
  blacklisted = false,
  session?: ClientSession
) => {
  await Token.create(
    [
      {
        token,
        user_id: userId,
        expires: expires.toDate(),
        type,
        blacklisted,
      },
    ],
    { session }
  );
};

/**
 * Verify token and return token doc (or throw an error if it is not valid)
 */
const verifyToken = async (token: string, type: string) => {
  try {
    const payload = jwt.verify(token, env.jwt.secret);
    const tokenDoc = await Token.findOne({
      token,
      type,
      user_id: payload.sub,
      blacklisted: false,
    });
    if (!tokenDoc) {
      throw new Error('Token not found');
    }
    return tokenDoc;
  }
  catch (error) {
    throw new ApiError(httpStatus.UNAUTHORIZED, 'Token is invalid');
  }
};

/**
 * Generate auth tokens
 */
const generateAuthTokens = async (user: IUser, session?: ClientSession) => {
  const accessTokenExpires = moment().add(env.jwt.accessExpirationMinutes, 'minutes');
  const accessToken = generateToken(user.id, accessTokenExpires, TOKEN_TYPES.ACCESS);

  const refreshTokenExpires = moment().add(env.jwt.refreshExpirationDays, 'days');
  const refreshToken = generateToken(user.id, refreshTokenExpires, TOKEN_TYPES.REFRESH);
  await saveToken(refreshToken, user.id, refreshTokenExpires, TOKEN_TYPES.REFRESH, false, session);

  return {
    access: {
      token: accessToken,
      expires: accessTokenExpires.toDate(),
    },
    refresh: {
      token: refreshToken,
      expires: refreshTokenExpires.toDate(),
    },
  };
};

/**
 * Generate reset password token
 */
const generateResetPasswordToken = async (email: string) => {
  const user = await userService.getByEmail(email);
  if (!user) {
    log.error('No users found with this email');
    // throw new ApiError(StatusCodes.NOT_FOUND, 'No users found with this email');
    return null;
  }
  const expires = moment().add(env.jwt.resetPasswordExpirationMinutes, 'minutes');
  const resetPasswordToken = generateToken(user.id, expires, TOKEN_TYPES.RESET_PASSWORD);
  await saveToken(resetPasswordToken, user.id, expires, TOKEN_TYPES.RESET_PASSWORD);
  return resetPasswordToken;
};

/**
 * Generate verify email token
 */
const generateVerifyEmailToken = async (user: IUser) => {
  const expires = moment().add(env.jwt.verifyEmailExpirationMinutes, 'minutes');
  const verifyEmailToken = generateToken(user.id, expires, TOKEN_TYPES.VERIFY_EMAIL);
  await saveToken(verifyEmailToken, user.id, expires, TOKEN_TYPES.VERIFY_EMAIL);
  return verifyEmailToken;
};

export const tokenService = {
  generateToken,
  verifyToken,
  generateAuthTokens,
  generateResetPasswordToken,
  generateVerifyEmailToken,
};
