import { ClientSession } from 'mongoose';
import { StatusCodes } from 'http-status-codes';
import { log } from '@/config';
import {
  CreateUserBody,
  UpdateUserBody,
  IUser
} from '@/interfaces/models/user';
import { User } from '@/models';
import { ApiError } from '@/utils/ApiError';

const create = async (userBody: CreateUserBody, session?: ClientSession) => {
  if (await User.isEmailTaken(userBody.email)) {
    throw new ApiError(StatusCodes.CONFLICT, 'Email already taken');
  }
  const user = await User.create([userBody], { session });
  return user[0];
};

const getById = async (id: IUser['id']) => {
  return User.findById(id);
};

const getByEmail = async (email: IUser['email']) => {
  return User.findOne({ email });
};

const updateById = async (
  userId: IUser['id'],
  updateBody: UpdateUserBody,
  session: ClientSession
) => {
  if (updateBody.email) {
    if (await User.isEmailTaken(updateBody.email, userId)) {
      throw new ApiError(StatusCodes.BAD_REQUEST, 'Email already taken');
    }
    updateBody.is_email_verified = false;
  }
  log.debug(`userId: ${userId}`);
  const userUpdated = await User.findOneAndUpdate(
    { _id: userId },
    updateBody,
    { session, new: true }
  );
  if (!userUpdated) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'User not found');
  }
  log.debug('userUpdate %o', userUpdated);
  return userUpdated;
};

const deleteById = async (id: IUser['id']) => {
  const user = await getById(id);
  if (!user) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'User not found');
  }
  await user.remove();
  return user;
};

export const userService = {
  create,
  getById,
  getByEmail,
  updateById,
  deleteById,
};
