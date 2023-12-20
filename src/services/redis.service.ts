import { redlock } from '@/config';

const maxWaitMs = 5000;

async function retrieveLock(key: string) {
  return redlock.acquire([key], maxWaitMs);
}

export const redisService = {
  retrieveLock,
};
