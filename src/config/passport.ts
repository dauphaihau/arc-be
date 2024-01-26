import { Request } from 'express';
import { JwtPayload } from 'jsonwebtoken';
import { Strategy as JwtStrategy, VerifiedCallback } from 'passport-jwt';
import { env } from './env';
import { TOKEN_TYPES } from './enums/token';
import { User } from '@/models';

const cookieExtractor = (req: Request) => {
  let token = null;
  if (req && req.cookies) {
    token = req.cookies[TOKEN_TYPES.ACCESS];
  }
  return token;
};

const jwtOptions = {
  secretOrKey: env.jwt.secret,
  jwtFromRequest: cookieExtractor,
};

const jwtVerify = async (payload: JwtPayload, done: VerifiedCallback) => {
  try {
    if (payload['type'] !== TOKEN_TYPES.ACCESS) {
      throw new Error('Invalid token type');
    }
    const user = await User
      .findOne({ _id: payload.sub })
      .populate('shop', 'shop_name _id');
    if (!user) {
      return done(null, false);
    }
    done(null, user);
  } catch (error) {
    done(error, false);
  }
};

export const jwtStrategy = new JwtStrategy(jwtOptions, jwtVerify);
