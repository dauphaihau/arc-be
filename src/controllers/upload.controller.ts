import { StatusCodes } from 'http-status-codes';
import { awsS3Service } from '@/services';
import { catchAsync } from '@/utils';
import {
  FolderObjectS3,
  RequestGetPresignedUrl
} from '@/interfaces/request/upload';

const getPresignedUrl = catchAsync(async (
  req: RequestGetPresignedUrl,
  res
) => {
  let folder: FolderObjectS3 = 'user';
  let id = req.user.id;

  if (req.query.shop_id) {
    folder = 'shop';
    id = req.query.shop_id;
  }
  const result = await awsS3Service.getPresignedUrl(folder, id);
  res.status(StatusCodes.OK).send(result);
});

export const uploadController = {
  getPresignedUrl,
};
