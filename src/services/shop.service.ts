import { StatusCodes } from 'http-status-codes';
import { ClientSession } from 'mongoose';
import { CreateShopBody, IShopModel } from '@/interfaces/models/shop';
import { Shop } from '@/models';
import { ApiError } from '@/utils';

const create = async (payload: CreateShopBody, session: ClientSession) => {
  if (await Shop.isNameShopTaken(payload.shop_name)) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Name of shop already taken');
  }
  const shop = await Shop.create([payload], { session });
  return shop[0];
};

const getList: IShopModel['paginate'] = async (filter, options) => {
  return Shop.paginate(filter, options);
};

export const shopService = {
  create,
  getList,
};
