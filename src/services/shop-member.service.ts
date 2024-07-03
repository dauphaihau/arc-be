import { StatusCodes } from 'http-status-codes';
import { ClientSession } from 'mongoose';
import { IShop } from '@/interfaces/models/shop';
import { IUser } from '@/interfaces/models/user';
import {
  AddShopMemberBody,
  IShopMemberModel,
  UpdateShopMemberBody
} from '@/interfaces/models/shop-member';
import { ShopMember } from '@/models';
import { ApiError } from '@/utils';

const addMember = async (payload: AddShopMemberBody, session?: ClientSession) => {
  const member = await ShopMember.create([payload], { session });
  return member[0];
};

const findMemberShop = async (shopId: IShop['id'], userId: IUser['id']) => {
  return ShopMember.findOne({
    shop_id: shopId,
    user_id: userId,
  });
};

const getListMember: IShopMemberModel['paginate'] = async (filter, options) => {
  return ShopMember.paginate(filter, options);
};

const deleteMember = async (shopId: IShop['id'], userId: IUser['id']) => {
  const memberExist = await findMemberShop(shopId, userId);
  if (!memberExist) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Member is not exist');
  }
  await memberExist.remove();
  return memberExist;
};

const updateMember = async (
  shopId: IShop['id'],
  userId: IUser['id'],
  updateBody: UpdateShopMemberBody
) => {
  const memberExist = await findMemberShop(shopId, userId);
  if (!memberExist) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Member is not exist');
  }
  Object.assign(memberExist, updateBody);
  await memberExist.save();
  return memberExist;
};

export const shopMemberService = {
  addMember,
  getListMember,
  findMemberShop,
  deleteMember,
  updateMember,
};
