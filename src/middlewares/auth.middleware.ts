import { Response, NextFunction } from 'express';
import passport, { AuthenticateCallback } from 'passport';
import { StatusCodes } from 'http-status-codes';
import { VerifyCbParams } from '@/interfaces/common/auth';
import { IParamsRequest } from '@/interfaces/common/request';
import { roleRights, MEMBER_ROLES } from '@/config/enums/member';
import { memberService } from '@/services';
import { ApiError } from '@/utils/ApiError';

const verifyCallback = (
  req: IParamsRequest<VerifyCbParams>,
  resolve: (reason?: never) => void,
  reject: (reason?: unknown) => void,
  requiredRights: string[]
): AuthenticateCallback => {
  return async (err, user, info) => {
    if (err || info || !user) {
      return reject(new ApiError(StatusCodes.UNAUTHORIZED, 'Please authenticate'));
    }
    req.user = user;

    const shopId = req.params.shop;
    if (requiredRights.length && shopId) {
      const member = await memberService.findMemberShop(shopId, user.id);
      if (!member) {
        return reject(new ApiError(StatusCodes.UNAUTHORIZED, 'Please authenticate'));
      }
      if (member.role === MEMBER_ROLES.OWNER) {
        return resolve();
      }

      const userRights = roleRights.get(member.role);
      if (!userRights) {
        return reject(new ApiError(StatusCodes.FORBIDDEN, 'Forbidden'));
      }

      const hasRequiredRights = requiredRights.every((requiredRight) => {
        userRights.includes(requiredRight);
      });
      if (!hasRequiredRights) {
        return reject(new ApiError(StatusCodes.FORBIDDEN, 'Forbidden'));
      }
    }
    resolve();
  };
};

export const auth = (...requiredRights: string[]) => {
  return async (req: IParamsRequest<VerifyCbParams>, res: Response, next: NextFunction) => {
    return new Promise((resolve, reject) => {
      passport.authenticate(
        'jwt',
        { session: false },
        verifyCallback(req, resolve, reject, requiredRights)
      )(req, res, next);
    })
      .then(() => setImmediate(() => next()))
      .catch((err) => setImmediate(() => next(err)));
  };
};
