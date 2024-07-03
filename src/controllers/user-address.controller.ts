import { Request } from 'express';
import { StatusCodes } from 'http-status-codes';
import { RequestParamsBody } from '@/interfaces/common/request';
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
  req: Request<GetUserAddressParams>,
  res
) => {
  const address = await userAddressService.getById(req.params.id as string);
  res.status(StatusCodes.OK).send({ address });
});

const getAddresses = catchAsync(async (req, res) => {
  const filter = { user: req.user.id };
  const options = pick(req.query, ['sortBy', 'limit', 'page', 'select', 'populate']);
  const result = await userAddressService.getList(filter, options);
  res.send(result);
});

const deleteAddress = catchAsync(async (
  req: Request<DeleteUserAddressParams>,
  res
) => {
  await userAddressService.deleteById(req.params.id as string);
  res.status(StatusCodes.NO_CONTENT).send();
});

const updateAddress = catchAsync(async (
  req: RequestParamsBody<UpdateUserAddressParams, UpdateUserAddressBody>,
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
