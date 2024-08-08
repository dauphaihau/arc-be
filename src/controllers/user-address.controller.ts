import { StatusCodes } from 'http-status-codes';
import { UserAddress } from '@/models';
import { IBaseQueryOptions } from '@/models/plugins/paginate.plugin';
import {
  RequestParamsAndBody,
  RequestQueryParams, RequestParams
} from '@/interfaces/express';
import {
  UpdateUserAddressBody,
  UpdateUserAddressParams,
  GetUserAddressParams,
  DeleteUserAddressParams
} from '@/interfaces/models/user-address';
import { userAddressService } from '@/services';
import { catchAsync, pick } from '@/utils';

const createAddress = catchAsync(async (req, res) => {
  const address = await userAddressService.create({
    ...req.body,
    user: req.user.id,
  });
  res.status(StatusCodes.CREATED).send({ address });
});

const getAddress = catchAsync(async (
  req: RequestParams<GetUserAddressParams>,
  res
) => {
  const address = await userAddressService.getById(req.params.id as string);
  res.status(StatusCodes.OK).send({ address });
});

const getAddresses = catchAsync(async (
  req: RequestQueryParams<IBaseQueryOptions>,
  res
) => {
  const filter = { user: req.user.id };
  const options = pick(req.query, ['sortBy', 'limit', 'page', 'select', 'populate']);
  const result = await UserAddress.paginate(filter, options);
  res.send(result);
});

const deleteAddress = catchAsync(async (
  req: RequestParams<DeleteUserAddressParams>,
  res
) => {
  await userAddressService.deleteById(req.params.id as string);
  res.status(StatusCodes.NO_CONTENT).send();
});

const updateAddress = catchAsync(async (
  req: RequestParamsAndBody<UpdateUserAddressParams, UpdateUserAddressBody>,
  res
) => {
  const address = await userAddressService.update(req.params.id as string, req.body);
  res.send({ address });
});

export const userAddressController = {
  createAddress,
  getAddress,
  getAddresses,
  deleteAddress,
  updateAddress,
};
