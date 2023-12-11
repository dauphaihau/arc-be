import { StatusCodes } from 'http-status-codes';
import { ClientSession } from 'mongoose';
import { CreateShopPayload } from '@/interfaces/models/shop';
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

export const shopService = {
  createShop,
};
