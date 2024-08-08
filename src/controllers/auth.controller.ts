import { Response } from 'express';
import httpStatus, { StatusCodes } from 'http-status-codes';
import { IUserDoc } from '@/interfaces/models/user';
import { TokensResponse } from '@/interfaces/models/token';
import { RequestBody, RequestQueryParams } from '@/interfaces/express';
import { transactionWrapper, catchAsync, ApiError } from '@/utils';
import {
  emailService, authService, userService, tokenService
} from '@/services';
import {
  LoginBody,
  VerifyTokenQueryParams,
  VerifyEmailQueryParams
} from '@/interfaces/request/auth';
import { TOKEN_TYPES } from '@/config/enums/token';

const setCookieTokens = (res: Response, tokens: TokensResponse) => {
  res.cookie(TOKEN_TYPES.ACCESS, tokens.access.token, {
    expires: tokens.access.expires,
    httpOnly: true,
    secure: true,
  });
  res.cookie(TOKEN_TYPES.REFRESH, tokens.refresh.token, {
    expires: tokens.refresh.expires,
    httpOnly: true,
    secure: true,
  });
};

const register = catchAsync(async (req, res) => {
  await transactionWrapper(async (session) => {
    const user = await userService.create(req.body, session);
    const tokens = await tokenService.generateAuthTokens(user, session);
    setCookieTokens(res, tokens);
    res.status(StatusCodes.CREATED).send({ user });
  });
});

const login = catchAsync(async (req: RequestBody<LoginBody>, res) => {
  const user = await authService.login(req.body);
  await user.populate('shop', 'shop_name _id');
  const tokens = await tokenService.generateAuthTokens(user);
  setCookieTokens(res, tokens);
  res.send({ user });
});

const logout = catchAsync(async (req, res) => {
  await authService.logout(req.cookies[TOKEN_TYPES.REFRESH]);
  res.clearCookie(TOKEN_TYPES.ACCESS);
  res.clearCookie(TOKEN_TYPES.REFRESH);
  res.status(StatusCodes.OK).send();
});

const refreshTokens = catchAsync(async (req, res) => {
  const tokens = await authService.refreshAuth(req.cookies[TOKEN_TYPES.REFRESH]);
  setCookieTokens(res, tokens);
  res.status(StatusCodes.OK).send();
});

const forgotPassword = catchAsync(async (
  req: RequestBody<{ email: IUserDoc['email'] }>,
  res
) => {
  const resetPasswordToken = await tokenService.generateResetPasswordToken(req.body.email);
  if (!resetPasswordToken) {
    res.status(StatusCodes.OK).send();
    return;
  }
  await emailService.sendResetPasswordEmail(req.body.email, resetPasswordToken);
  res.status(StatusCodes.OK).send();
});

const resetPassword = catchAsync(async (
  req: RequestQueryParams<{ token: string }>,
  res
) => {
  await transactionWrapper(async (session) => {
    if (!req.query.token) {
      throw new ApiError(httpStatus.BAD_REQUEST);
    }
    const user = await authService.resetPassword(req.query.token, req.body.password, session);
    const tokens = await tokenService.generateAuthTokens(user, session);
    setCookieTokens(res, tokens);
    res.send({ user });
  });
});

const sendVerificationEmail = catchAsync(async (req, res) => {
  const verifyEmailToken = await tokenService.generateVerifyEmailToken(req.user);
  await emailService.sendVerificationEmail(req.user.email, verifyEmailToken);
  res.status(StatusCodes.NO_CONTENT).send();
});

const verifyToken = catchAsync(async (
  req: RequestQueryParams<VerifyTokenQueryParams>,
  res
) => {
  if (!req.query.token || !req.query.type) {
    throw new ApiError(httpStatus.BAD_REQUEST);
  }
  await tokenService.verifyToken(req.query.token, req.query.type);
  res.status(StatusCodes.OK).send();
});

const verifyEmail = catchAsync(async (
  req: RequestQueryParams<VerifyEmailQueryParams>,
  res
) => {
  if (!req.query.token) {
    throw new ApiError(httpStatus.BAD_REQUEST);
  }
  await authService.verifyEmail(req.query.token);
  res.status(StatusCodes.NO_CONTENT).send();
});

export const authController = {
  register,
  login,
  logout,
  refreshTokens,
  forgotPassword,
  resetPassword,
  sendVerificationEmail,
  verifyEmail,
  verifyToken,
};
