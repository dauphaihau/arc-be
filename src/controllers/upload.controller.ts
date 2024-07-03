import { StatusCodes } from 'http-status-codes';
import { RequestQuery } from '@/interfaces/common/request';
import { awsS3Service } from '@/services';
import { catchAsync } from '@/utils';
import { FolderObjectS3, GetPresignedUrlQueries } from '@/interfaces/common/upload';

const getPresignedUrl = catchAsync(async (
  req: RequestQuery<GetPresignedUrlQueries>,
  res
) => {
  let folder: FolderObjectS3 = 'user';
  let id = req.user.id;

  if (req.query.shop) {
    folder = 'shop';
    id = req.query.shop;
  }
  const result = await awsS3Service.getPresignedUrl(folder, id);
  res.status(StatusCodes.OK).send(result);
});

export const uploadController = {
  getPresignedUrl,
};
