import { StatusCodes } from 'http-status-codes';
import {
  UpdateUserAddressBody,
  CreateUserAddressPayload, IUserAddressModel, IUserAddress
} from '@/interfaces/models/user-address';
import { UserAddress } from '@/models';
import { ApiError } from '@/utils';

const getById = async (id?: IUserAddress['id']) => {
  if (!id) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'user_address_id is undefined');
  }
  return UserAddress.findById(id);
};

const getPrimaryAddressByUser = async (userId: IUserAddress['user']) => {
  return UserAddress.findOne({
    user: userId,
    is_primary: true,
  });
};

const create = async (payload: CreateUserAddressPayload) => {
  const { user, is_primary } = payload;
  if (is_primary) {
    const filter = { user, is_primary: true };
    const update = { is_primary: false };
    await UserAddress.findOneAndUpdate(filter, update);
  }
  return UserAddress.create(payload);
};

const getList: IUserAddressModel['paginate'] = async (filter, options) => {
  return UserAddress.paginate(filter, options);
};

const deleteById = async (id: IUserAddress['id']) => {
  const address = await getById(id);
  if (!address) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Address not found');
  }
  return address.remove();
};

const update = async (
  id: IUserAddress['id'],
  updateBody: UpdateUserAddressBody
) => {
  const address = await getById(id);
  if (!address) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Address not found');
  }
  if (updateBody.is_primary) {
    const filter = { user: address.user, is_primary: true };
    const update = { is_primary: false };
    await UserAddress.findOneAndUpdate(filter, update);
  }
  Object.assign(address, updateBody);
  await address.save();
  return address;
};

export const userAddressService = {
  create,
  getById,
  getList,
  deleteById,
  update,
  getPrimaryAddressByUser,
};
