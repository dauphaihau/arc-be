import { StatusCodes } from 'http-status-codes';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import {
  PutObjectCommand,
  DeleteObjectCommand,
  CopyObjectCommand,
  ListObjectsCommandInput,
  ListObjectsCommand, CopyObjectCommandInput,
  GetObjectCommand, DeleteObjectsCommand, GetObjectCommandOutput
} from '@aws-sdk/client-s3';
import { v4 as uuidv4 } from 'uuid';
import { IUser } from '@/interfaces/models/user';
import { ApiError } from '@/utils';
import { awsS3Client, env, log } from '@/config';
import { FolderObjectS3 } from '@/interfaces/request/upload';

const Bucket = env.aws_s3.bucket;

async function getObject(Key: string): Promise<GetObjectCommandOutput> {
  try {
    const command = new GetObjectCommand({ Bucket, Key });
    const response = await awsS3Client.send(command);
    log.debug('response: %o', response);
    return response;
  }
  catch (err) {
    log.error(err);
    throw new ApiError(
      StatusCodes.INTERNAL_SERVER_ERROR,
      `AWS S3: get object by key: ${Key} failed`
    );
  }
}

async function getPresignedUrl(folder: FolderObjectS3, userId: IUser['id']) {
  const key = `${folder}/${userId}/${uuidv4()}.jpeg`;
  const command = new PutObjectCommand({
    Bucket,
    Key: key,
  });
  const presigned_url = await getSignedUrl(awsS3Client, command, { expiresIn: 3600 });
  return { key, presigned_url };
}

async function deleteObject(key: string) {
  try {
    await getObject(key);

    const command = new DeleteObjectCommand({
      Bucket,
      Key: key,
    });
    const response = await awsS3Client.send(command);
    log.debug('response: %o', response);
  }
  catch (err) {
    log.error(err);
    throw new ApiError(
      StatusCodes.INTERNAL_SERVER_ERROR,
      `AWS S3: Delete object by key: ${key} failed`
    );
  }
}

async function deleteMultiObject(keys: string[]) {
  try {
    log.debug('keys %o', keys);
    const command = new DeleteObjectsCommand({
      Bucket,
      Delete: {
        Objects: keys.map((Key) => ({ Key })),
      },
    });
    const response = await awsS3Client.send(command);
    log.debug('response deleted objects s3 %o', response);
  }
  catch (err) {
    log.error(err);
    throw new ApiError(
      StatusCodes.INTERNAL_SERVER_ERROR,
      'AWS S3: Delete object by keys failed'
    );
  }
}

export const getListObjects = async (input: ListObjectsCommandInput) => {
  const command = new ListObjectsCommand(input);
  return awsS3Client.send(command);
};

export const copyObject = async (input: CopyObjectCommandInput) => {
  const command = new CopyObjectCommand(input);
  return awsS3Client.send(command);
};

export const awsS3Service = {
  getPresignedUrl,
  getObject,
  deleteObject,
  deleteMultiObject,
};
