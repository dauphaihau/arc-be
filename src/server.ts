import app from './app';
import {
  env, log, mongoose, aws
} from './config';

mongoose.run();
aws.testConnectionS3();

const server = app.listen(env.port, () => {
  log.info(`Listening to port ${env.port}`);
});

const unexpectedErrorHandler = (error: unknown) => {
  log.error(error);
  if (server) {
    server.close(() => {
      log.info('Server closed');
    });
  }
};

process.on('uncaughtException', unexpectedErrorHandler);
process.on('unhandledRejection', unexpectedErrorHandler);

// ts-node-dev doesn't allow graceful shutdowns
// if (env.node === 'production') {
//   process.on('SIGTERM', () => {
//     log.info('SIGTERM signal received.');
//     log.info('Closing server.');
//     server.close(() => {
//       log.info('Server closed.');
//     });
//   });
// }
