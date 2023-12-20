import { ClientSession } from 'mongoose';
import { StatusCodes } from 'http-status-codes';
import { CreateShopPayload, IShopModel } from '@/interfaces/models/shop';
import { Shop } from '@/models';
import { ApiError } from '@/utils';

/**
 * Create shop
 */
const createShop = async (payload: CreateShopPayload, session: ClientSession) => {
  if (await Shop.isNameShopTaken(payload.shop_name)) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Name of shop already taken');
  }
  const shop = await Shop.create([payload], { session });
  return shop[0];
};

/**
 * Query for shops
 * @param filter - Mongo filter
 * @param options - Query options
 * @param [options.sortBy] - Sort option in the format: sortField:(desc|asc)
 * @param [options.limit] - Maximum number of results per page (default = 10)
 * @param [options.page] - Current page (default = 1)
 * @returns {Promise<QueryResult>}
 */
const queryShops: IShopModel['paginate'] = async (filter, options) => {
  return Shop.paginate(filter, options);
};

export const shopService = {
  createShop,
  queryShops,
};
