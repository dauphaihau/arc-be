import { Request } from 'express';
import { StatusCodes } from 'http-status-codes';
import {
  UpdateAddressPayload,
  UpdateAddressParams,
  GetAddressParams,
  DeleteAddressParams
} from '@/interfaces/models/address';
import { addressService } from '@/services';
import { catchAsync, pick } from '@/utils';

const createAddress = catchAsync(async (req, res) => {
  const address = await addressService.createAddress({
    ...req.body,
    user: req.user.id,
  });
  res.status(StatusCodes.CREATED).send({ address });
});

const getAddress = catchAsync(async (
  req: Request<GetAddressParams>,
  res
) => {
  const address = await addressService.getAddressById(req.params.id as string);
  res.status(StatusCodes.OK).send({ address });
});

const getAddresses = catchAsync(async (req, res) => {
  const filter = { user: req.user.id };
  const options = pick(req.query, ['sortBy', 'limit', 'page', 'select', 'populate']);
  const result = await addressService.queryAddresses(filter, options);
  res.send(result);
});

const deleteAddress = catchAsync(async (
  req: Request<DeleteAddressParams>,
  res
) => {
  await addressService.deleteAddressById(req.params.id as string);
  res.status(StatusCodes.NO_CONTENT).send();
});

const updateAddress = catchAsync(async (
  req: Request<UpdateAddressParams, unknown, UpdateAddressPayload>,
  res
) => {
  const address = await addressService.updateAddress(req.params.id as string, req.body);
  res.send({ address });
});

export const addressController = {
  createAddress,
  getAddress,
  getAddresses,
  deleteAddress,
  updateAddress,
};
