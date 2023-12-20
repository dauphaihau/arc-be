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
  const user = await addressService.createAddress({ ...req.body, user_id: req.user.id });
  res.status(StatusCodes.CREATED).send(user);
});

const getAddress = catchAsync(async (
  req: Request<GetAddressParams>,
  res
) => {
  const address = await addressService.getAddressById(req.params.id as string);
  res.status(StatusCodes.OK).send({ address });
});

const getAddresses = catchAsync(async (req, res) => {
  const filter = { user_id: req.user.id };
  const options = pick(req.query, ['sortBy', 'limit', 'page', 'select', 'populate']);
  options['select'] = { attributes: 0 };
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
