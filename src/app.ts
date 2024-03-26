import express, { Express } from 'express';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import compression from 'compression';
import cors from 'cors';
import { StatusCodes } from 'http-status-codes';
import passport from 'passport';
import routes from './routes/v1';
import { env, jwtStrategy } from '@/config';
import { authLimiter, errorConverter, errorHandler } from '@/middlewares';
import { ApiError } from '@/utils';
import webhookRoute from '@/routes/webhook.route';

const app: Express = express();

// used to secure this app by configuring the http-header
app.use(helmet());

// used to reduce the size of the response body
app.use(compression());

app.use('/webhook', webhookRoute);

// parse urlencoded request body
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// parse urlencoded request body
app.use(express.json({ limit: '10mb' }));

// parse Cookie header and populate req.cookies with an object keyed by the cookie names.
app.use(cookieParser());

app.use(
  cors({
    // origin is given a array if we want to have multiple origins later
    origin: String(env.cors_origin).split('|'),
    credentials: true,
  })
);

// jwt authentication
app.use(passport.initialize());
passport.use('jwt', jwtStrategy);

// limit repeated failed requests to auth endpoints
if (env.node === 'production') {
  app.use('/v1/auth', authLimiter);
}

// v1 api routes
app.use('/v1', routes);

// send back a 404 error for any unknown api request
app.use((_req, _res, next) => {
  next(new ApiError(StatusCodes.NOT_FOUND, 'Not found'));
});

// convert error to ApiError, if needed
app.use(errorConverter);

// handle error
app.use(errorHandler);

export default app;
