import moment from 'moment';
import { userOne } from './user.fixture';
import { env } from '@/config';
import { TOKEN_TYPES } from '@/config/enums/token';
import { tokenService } from '@/services';

const accessTokenExpires = moment().add(env.jwt.accessExpirationMinutes, 'minutes');
export const userOneAccessToken = tokenService.generateToken(
  userOne._id, accessTokenExpires, TOKEN_TYPES.ACCESS
);
