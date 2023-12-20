import { ClientSession } from 'mongoose';
import { StatusCodes } from 'http-status-codes';
import {
  AddMemberPayload,
  IMemberModel,
  UpdateMemberPayload
} from '@/interfaces/models/member';
import { Member } from '@/models';
import { ApiError } from '@/utils';

const addMember = async (payload: AddMemberPayload, session?: ClientSession) => {
  const member = Member.create([payload], { session });
  return member;
};

const findMemberShop = async <T>(shopId: T, userId: T) => {
  return Member.findOne({
    shop_id: shopId,
    user_id: userId,
  });
};

/**
 * Query for members
 * @param  filter - Mongo filter
 * @param  options - Query options
 * @param [options.sortBy] - Sort option in the format: sortField:(desc|asc)
 * @param [options.limit] - Maximum number of results per page (default = 10)
 * @param [options.page] - Current page (default = 1)
 * @returns {Promise<QueryResult>}
 */
const queryMembers: IMemberModel['paginate'] = async (filter, options) => {
  const members = await Member.paginate(filter, options);
  return members;
};

const deleteMember = async <T>(shopId: T, userId: T) => {
  const memberExist = await findMemberShop(shopId, userId);
  if (!memberExist) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Member is not exist');
  }
  await memberExist.remove();
  return memberExist;
};

const updateMember = async <T>(shopId: T, userId: T, updateBody: UpdateMemberPayload) => {
  const memberExist = await findMemberShop(shopId, userId);
  if (!memberExist) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Member is not exist');
  }
  Object.assign(memberExist, updateBody);
  await memberExist.save();
  return memberExist;
};

export const memberService = {
  addMember,
  queryMembers,
  findMemberShop,
  deleteMember,
  updateMember,
};
