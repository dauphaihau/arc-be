import { log } from '@/config';
import bcrypt from 'bcryptjs';
import { faker } from '@faker-js/faker';
import { User } from '@/models';

// const userAmount = 50;
const userAmount = 2;
const passwordCommon = 'Landmaro12.!';

const users = async () => {
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

export async function generateUsers() {
  const usersData = await users();
  const usersCreated = await User.insertMany(usersData);
  log.info('users collection generated');
  return usersCreated;
}
