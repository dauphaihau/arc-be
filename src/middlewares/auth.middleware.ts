import { Response, NextFunction } from 'express';
import passport, { AuthenticateCallback } from 'passport';
import { StatusCodes } from 'http-status-codes';
import { IUserDoc } from '@/interfaces/models/user';
import { VerifyCbParams } from '@/interfaces/request/auth';
import { RequestParams } from '@/interfaces/express';
import { roleRights, SHOP_MEMBER_ROLES } from '@/config/enums/shop';
import { shopMemberService } from '@/services';
import { ApiError } from '@/utils/ApiError';

const verifyCallback = (
  req: RequestParams<VerifyCbParams>,
  resolve: (reason?: never) => void,
  reject: (reason?: unknown) => void,
  requiredRights: string[]
): AuthenticateCallback => {
  return async (err, user, info) => {
    if (err || info || !user) {
      return reject(new ApiError(StatusCodes.UNAUTHORIZED, 'Please authenticate'));
    }
    req.user = user as IUserDoc;

    const shopId = req.params.shop_id;
    if (requiredRights.length && shopId) {
      const member = await shopMemberService.findMemberShop(shopId, (user as IUserDoc).id);
      if (!member) {
        return reject(new ApiError(StatusCodes.UNAUTHORIZED, 'Please authenticate'));
      }
      if (member.role === SHOP_MEMBER_ROLES.OWNER) {
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
  return async (req: RequestParams<VerifyCbParams>, res: Response, next: NextFunction) => {
    // eslint-disable-next-line promise/avoid-new
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
