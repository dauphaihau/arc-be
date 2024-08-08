import { generateMe } from '@/database/seeder/me';
import mongoose from 'mongoose';
import { generateCategories } from './category';
import { generateShops, deleteShopFoldersS3 } from './shop';
import { generateUsers } from './user';
import { generateProducts } from './product';
import { generateCoupons } from './coupon';
import { env, log } from '@/config';

async function reset(collectionNames: string[] = []) {
  const db = mongoose.connection.db;

  if (collectionNames.length > 0) {
    await Promise.all(
      collectionNames.map(async (name) => {
        await db.dropCollection(name);
        log.info(`${name} collection deleted`);
      }),
    );
    return;
  }

  const collections = await db.listCollections().toArray();
  await Promise.all(
    collections.map(async (collection) => {
      await db.dropCollection(collection.name);
      log.info(`${collection.name} collection deleted`);
    }),
  );

  await deleteShopFoldersS3();
}

async function seedDB() {
  await mongoose.connect(env.mongoose.url);

  // await reset();
  // // await reset(['orders', 'carts', 'payments']);
  //
  // await generateCategories();
  // const users = await generateUsers();
  // const shops = await generateShops(users);
  // await generateProducts(shops);
  // await generateCoupons(shops);
  //
  await generateMe();

  console.log('seed done');
}

seedDB();
