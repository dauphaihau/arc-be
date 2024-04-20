import RedLock, { ResourceLockedError } from 'redlock';
import Redis from 'ioredis';
import { log, env } from '@/config';

export const redisClient = new Redis({
  host: env.redis.host,
  port: env.redis.port,
  username: env.redis.username || '',
  password: env.redis.password || '',
});

redisClient.on('connect', () => {
  log.info('Connected to redis');
});

export const redlock = new RedLock(
  [redisClient],
  {
    // The expected clock drift; for more details see:
    // http://redis.io/topics/distlock
    driftFactor: 0.01, // multiplied by lock ttl to determine drift time

    // The max number of times Redlock will attempt to lock a resource
    // before erroring.
    retryCount: 10,

    // the time in ms between attempts
    retryDelay: 200, // time in ms

    // the max time in ms randomly added to retries
    // to improve performance under high contention
    // see https://www.awsarchitectureblog.com/2015/03/backoff.html
    retryJitter: 200, // time in ms

    // The minimum remaining time on a lock before an extension is automatically
    // attempted with the `using` API.
    automaticExtensionThreshold: 500, // time in ms
  }
);

redlock.on('error', (error) => {
  if (error instanceof ResourceLockedError) {
    return;
  }
  log.error(error);
});
