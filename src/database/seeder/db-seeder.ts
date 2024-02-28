import mongoose from 'mongoose';
import { generateCategoriesDB } from './categories';
import { generateShopsDB } from './shops';
import { generateUsersDB } from './users';
import { generateProductsDB } from './products';
import { generateCouponDB } from './coupons';
import { env } from '@/config';

async function dbSeed() {
  await mongoose.connect(env.mongoose.url);

  const collections = mongoose.connection.collections;
  await Promise.all(Object.values(collections).map(async (collection) => {
    await collection.deleteMany({});
  }));

  await generateCategoriesDB();
  const users = await generateUsersDB();
  const shops = await generateShopsDB(users);
  await generateProductsDB(shops);
  await generateCouponDB(shops);

  // console.log('seed done');
}

dbSeed();
