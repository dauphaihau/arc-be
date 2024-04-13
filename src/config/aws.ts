import * as AWS from '@aws-sdk/client-s3';
import { env, log } from '@/config';

const Bucket = env.aws_s3.bucket;

export const awsS3Client = new AWS.S3({
  credentials: env.aws_s3.credentials,
  region: env.aws_s3.region,
});

export const aws = {
  testConnectionS3: (): void => {
    awsS3Client.headBucket({ Bucket }, (err) => {
      if (err) {
        log.error(err);
        log.error(`Connect to bucket ${Bucket} on AWS S3 failed`);
      }
      else {
        log.info(`Connected to bucket ${Bucket} on AWS S3`);
      }
    });
  },
};
