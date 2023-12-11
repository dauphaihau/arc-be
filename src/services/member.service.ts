import {
  ClientSession,
  FilterQuery,
  Schema,
  QueryOptions
} from 'mongoose';
import { StatusCodes } from 'http-status-codes';
import {
  AddMemberPayload,
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
 * @param {Object} filter - Mongo filter
 * @param {Object} options - Query options
 * @param {string} [options.sortBy] - Sort option in the format: sortField:(desc|asc)
 * @param {number} [options.limit] - Maximum number of results per page (default = 10)
 * @param {number} [options.page] - Current page (default = 1)
 * @returns {Promise<QueryResult>}
 */
const queryMembers = async (filter: FilterQuery<Schema>, options: QueryOptions) => {
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
