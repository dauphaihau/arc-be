import { DeleteObjectCommand } from '@aws-sdk/client-s3';
import { copyObject, getListObjects } from '@/services/aws-s3.service';
import { env, awsS3Client } from '@/config';

export const copyFolderS3 = async (
  fromBucket: string,
  fromFolderKey: string,
  toBucket: string,
  toFolderKey: string
) => {
  try {
    const listObjectsResponse = await getListObjects({
      Bucket: fromBucket,
      Prefix: `${fromFolderKey}/`,
    });

    if (listObjectsResponse.Contents) {
      const fromObjectKeys = listObjectsResponse.Contents.map(content => content.Key);

      for (const fromObjectKey of fromObjectKeys) {
        const toObjectKey = fromObjectKey && fromObjectKey.replace(fromFolderKey, toFolderKey);

        await copyObject({
          Bucket: toBucket,
          CopySource: `${fromBucket}/${fromObjectKey}`,
          Key: toObjectKey,
        });
      }

    }

  } catch (error) {
    throw new Error(error);
  }
};


export const deleteFolderS3 = async (key: string) => {
  try {
    const listObjectsResponse = await getListObjects({
      Bucket: env.aws_s3.bucket,
      Prefix: key,
    });
    if (listObjectsResponse && listObjectsResponse?.Contents) {
      const { Contents } = listObjectsResponse;
      for (let index = 0; index < Contents.length; index++) {
        const element = Contents[index];
        await awsS3Client.send(
          new DeleteObjectCommand({
            Bucket: env.aws_s3.bucket,
            Key: element.Key,
          })
        );
      }
    }
    console.log(`Success. Folder ${key} deleted.`);
  } catch (err) {
    throw Error;
  }
};

export function getRandomInt(max: number) {
  return Math.floor(Math.random() * max);
}

export function capitalizeSentence(sentence: string) {
  return sentence.replace(
    /(^\w{1})|(\s+\w{1})/g,
      letter => letter.toUpperCase()
  );
}
