import { ClientSession, ObjectId } from 'mongoose';
import { StatusCodes } from 'http-status-codes';
import { User } from '@/models';
import { ApiError } from '@/utils/ApiError';
import { CreateUserPayload, UpdateUserPayload } from '@/interfaces/common/user';

/**
 * Create a user
 */
const createUser = async (userBody: CreateUserPayload, session?: ClientSession) => {
  if (await User.isEmailTaken(userBody.email)) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Email already taken');
  }
  const user = await User.create([userBody], { session });
  return user[0];
};

/**
 * Get user by id
 */
const getUserById = async (id: ObjectId) => {
  return User.findById(id);
};

/**
 * Get user by email
 */
const getUserByEmail = async (email: string) => {
  return User.findOne({ email });
};

/**
 * Update user by id
 */
const updateUserById = async (
  userId: ObjectId,
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

/**
 * Delete user by id
 */
const deleteUserById = async (userId: ObjectId) => {
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
