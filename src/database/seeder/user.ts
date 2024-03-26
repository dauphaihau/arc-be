import bcrypt from 'bcryptjs';
import { faker } from '@faker-js/faker';
import { User } from '@/models';

const userAmount = 50;
const passwordCommon = 'Landmaro12.';

const generateUsers = async () => {
  const users = [];
  const hashPassword = await bcrypt.hash(passwordCommon, 8);

  for (let i = 0; i < userAmount; i++) {
    users.push({
      name: faker.person.firstName(),
      email: faker.internet.email(),
      password: hashPassword,
    });
  }
  return users;
};

export async function generateUsersDB() {
  const users = await generateUsers();
  return User.insertMany(users);
}
