import { Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { TokensResponse } from '@/interfaces/models/token';
import { IBodyRequest } from '@/interfaces/common/request';
import { transactionWrapper, catchAsync } from '@/utils';
import {
  emailService, authService, userService, tokenService
} from '@/services';
import { LoginPayload } from '@/interfaces/common/auth';
import { TOKEN_TYPES } from '@/config/enums/token';

const setCookie = (res: Response, tokens: TokensResponse) => {
  res.cookie(TOKEN_TYPES.ACCESS, tokens.access.token, {
    expires:  tokens.access.expires,
    httpOnly: true,
    secure:   true,
  });
  res.cookie(TOKEN_TYPES.REFRESH, tokens.refresh.token, {
    expires:  tokens.refresh.expires,
    httpOnly: true,
    secure:   true,
  });
};

const register = catchAsync(async (req, res) => {
  await transactionWrapper(async (session) => {
    const user = await userService.createUser(req.body, session);
    const tokens = await tokenService.generateAuthTokens(user, session);
    setCookie(res, tokens);
    res.status(StatusCodes.CREATED).send({ user });
  });
});

const login = catchAsync(async (req: IBodyRequest<LoginPayload>, res) => {
  const user = await authService.login(req.body);
  const tokens = await tokenService.generateAuthTokens(user);
  setCookie(res, tokens);
  res.send({ user });
});

const logout = catchAsync(async (req, res) => {
  await authService.logout(req.cookies[TOKEN_TYPES.REFRESH]);
  res.clearCookie(TOKEN_TYPES.ACCESS);
  res.clearCookie(TOKEN_TYPES.REFRESH);
  res.status(StatusCodes.NO_CONTENT).send();
});

const refreshTokens = catchAsync(async (req, res) => {
  const tokens = await authService.refreshAuth(req.cookies[TOKEN_TYPES.REFRESH]);
  setCookie(res, tokens);
  res.status(StatusCodes.NO_CONTENT).send();
});

const forgotPassword = catchAsync(async (req, res) => {
  const resetPasswordToken = await tokenService.generateResetPasswordToken(req.body.email);
  await emailService.sendResetPasswordEmail(req.body.email, resetPasswordToken);
  res.status(StatusCodes.NO_CONTENT).send();
});

const resetPassword = catchAsync(async (req, res) => {
  await authService.resetPassword(req.query['token'] as string, req.body.password);
  res.status(StatusCodes.NO_CONTENT).send();
});

const sendVerificationEmail = catchAsync(async (req, res) => {
  const verifyEmailToken = await tokenService.generateVerifyEmailToken(req.user);
  await emailService.sendVerificationEmail(req.user.email, verifyEmailToken);
  res.status(StatusCodes.NO_CONTENT).send();
});

const verifyEmail = catchAsync(async (req, res) => {
  await authService.verifyEmail(req.query['token'] as string);
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
};
