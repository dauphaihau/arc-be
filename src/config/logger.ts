import { format, transports, createLogger } from 'winston';
import { env } from './env';

const enumerateErrorFormat = format((info) => {
  if (info instanceof Error) {
    Object.assign(info, { message: info.stack });
  }
  return info;
});

export const log = createLogger({
  level: env.node === 'development' ? 'debug' : 'info',
  format: format.combine(
    enumerateErrorFormat(),
    env.node === 'development' ? format.colorize() : format.uncolorize(),
    format.splat(),
    format.printf(({ level, message }) => `${level}: ${message}`)
  ),
  transports: [
    new transports.Console(
      { stderrLevels: ['error'] }
    ),
  ],
});
