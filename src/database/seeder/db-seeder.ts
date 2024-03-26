import mongoose from 'mongoose';
import { generateCategoriesDB } from './category';
import { generateShopsDB, deleteShopFoldersS3 } from './shop';
import { generateUsersDB } from './user';
import { generateProductsDB } from './product';
import { generateCouponDB } from './coupon';
import { env } from '@/config';

async function dbSeed() {
  await mongoose.connect(env.mongoose.url);

  await deleteShopFoldersS3();

  const collections = mongoose.connection.collections;
  await Promise.all(Object.values(collections).map(async (collection) => {
    await collection.deleteMany({});
  }));

  await generateCategoriesDB();
  const users = await generateUsersDB();
  const shops = await generateShopsDB(users);
  await generateProductsDB(shops);
  await generateCouponDB(shops);

  console.log('seed done');
}

dbSeed();
