import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { faker } from '@faker-js/faker';
import { IUser } from '@/interfaces/models/user';
import { User } from '@/models';

const password = 'password1';
const salt = bcrypt.genSaltSync(8);
const hashedPassword = bcrypt.hashSync(password, salt);

export const userOne: IUser = {
  _id: new mongoose.Types.ObjectId(),
  name: faker.person.fullName(),
  email: faker.internet.email().toLowerCase(),
  password,
  is_email_verified: false,
};

export const insertUsers = async (users: IUser[]) => {
  await User.insertMany(users.map((user) => ({ ...user, password: hashedPassword })));
};
