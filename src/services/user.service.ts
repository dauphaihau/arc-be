import { ClientSession } from 'mongoose';
import { StatusCodes } from 'http-status-codes';
import {
  CreateUserPayload,
  UpdateUserPayload,
  IUser
} from '@/interfaces/models/user';
import { User } from '@/models';
import { ApiError } from '@/utils/ApiError';

const createUser = async (userBody: CreateUserPayload, session?: ClientSession) => {
  if (await User.isEmailTaken(userBody.email)) {
    throw new ApiError(StatusCodes.CONFLICT, 'Email already taken');
  }
  const user = await User.create([userBody], { session });
  return user[0];
};

const getUserById = async (id: IUser['id']) => {
  return User.findById(id);
};

const getUserByEmail = async (email: IUser['email']) => {
  return User.findOne({ email });
};

const updateUserById = async (
  userId: IUser['id'],
  updateBody: UpdateUserPayload,
  session: ClientSession
) => {
  const user = await getUserById(userId);
  if (!user) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'User not found');
  }
  if (updateBody.email && (await User.isEmailTaken(updateBody.email, userId))) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Email already taken');
  }
  Object.assign(user, updateBody);
  await user.save({ session });
  return user;
};

const deleteUserById = async (userId: IUser['id']) => {
  const user = await getUserById(userId);
  if (!user) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'User not found');
  }
  await user.remove();
  return user;
};

export const userService = {
  createUser,
  getUserById,
  getUserByEmail,
  updateUserById,
  deleteUserById,
};
