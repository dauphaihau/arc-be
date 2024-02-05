import { StatusCodes } from 'http-status-codes';
import {
  IAddress,
  UpdateAddressPayload,
  CreateAddressPayload, IAddressModel
} from '@/interfaces/models/address';
import { Address } from '@/models';
import { ApiError } from '@/utils';

const getAddressById = async (id: IAddress['id']) => {
  return Address.findById(id);
};

const createAddress = async (payload: CreateAddressPayload) => {
  const { user, is_primary } = payload;
  if (is_primary) {
    const filter = { user, is_primary: true };
    const update = { is_primary: false };
    await Address.findOneAndUpdate(filter, update);
  }
  return Address.create(payload);
};

/**
 * Query for addresses
 * @param filter - Mongo filter
 * @param options - Query options
 * @param [options.sortBy] - Sort option in the format: sortField:(desc|asc)
 * @param [options.limit] - Maximum number of results per page (default = 10)
 * @param [options.page] - Current page (default = 1)
 * @returns {Promise<QueryResult>}
 */
const queryAddresses: IAddressModel['paginate'] = async (filter, options) => {
  return Address.paginate(filter, options);
};

const deleteAddressById = async (id: IAddress['id']) => {
  const address = await getAddressById(id);
  if (!address) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Address not found');
  }
  return address.remove();
};

const updateAddress = async (
  id: IAddress['id'],
  updateBody: UpdateAddressPayload
) => {
  const address = await getAddressById(id);
  if (!address) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Address not found');
  }
  Object.assign(address, updateBody);
  await address.save();
  return address;
};

export const addressService = {
  createAddress,
  getAddressById,
  queryAddresses,
  deleteAddressById,
  updateAddress,
};
