import { StatusCodes } from 'http-status-codes';
import { ObjectId } from 'mongoose';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import {
  PutObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand, DeleteObjectsCommand
} from '@aws-sdk/client-s3';
import { v4 as uuidv4 } from 'uuid';
import { ApiError } from '@/utils';
import { awsS3Client, env, log } from '@/config';
import { FolderObjectS3 } from '@/interfaces/common/upload';

const Bucket = env.aws_s3.bucket;

async function getObject(Key: string) {
  const command = new GetObjectCommand({ Bucket, Key });

  try {
    const response = await awsS3Client.send(command);
    log.debug('response: %o', response);
  } catch (err) {
    log.error(err);
    throw new ApiError(
      StatusCodes.INTERNAL_SERVER_ERROR,
      `AWS S3: get object by key: ${Key} failed`
    );
  }
}

async function getPresignedUrl(folder: FolderObjectS3, objectId: ObjectId) {
  const key = `${folder}/${objectId}/${uuidv4()}.jpeg`;
  const command = new PutObjectCommand({
    Bucket: env.aws_s3.bucket,
    Key: key,
  });
  const presignedUrl = await getSignedUrl(awsS3Client, command, { expiresIn: 3600 });
  return { key, presignedUrl };
}

async function deleteObject(key: string) {
  await getObject(key);

  const command = new DeleteObjectCommand({
    Bucket: env.aws_s3.bucket,
    Key: key,
  });

  try {
    const response = await awsS3Client.send(command);
    log.debug('response: %o', response);
  } catch (err) {
    log.error(err);
    throw new ApiError(
      StatusCodes.INTERNAL_SERVER_ERROR,
      `AWS S3: Delete object by key: ${key} failed`
    );
  }
}

async function deleteMultiObject(keys: string[]) {
  log.debug('keys %o', keys);
  const command = new DeleteObjectsCommand({
    Bucket,
    Delete: {
      Objects: keys.map((Key) => ({ Key })),
    },
  });

  try {
    const response = await awsS3Client.send(command);
    log.debug('response deleted objects s3 %o', response);
  } catch (err) {
    log.error(err);
    throw new ApiError(
      StatusCodes.INTERNAL_SERVER_ERROR,
      'AWS S3: Delete object by keys failed'
    );
  }
}

export const awsS3Service = {
  getPresignedUrl,
  getObject,
  deleteObject,
  deleteMultiObject,
};
