import { env, log } from '@/config';
import { SHOP_MEMBER_ROLES } from '@/config/enums/shop';
import { copyFolderS3, deleteFolderS3 } from '@/database/util';
import { IUserDoc } from '@/interfaces/models/user';
import { Shop, User, ShopMember } from '@/models';

const keySourceImagesEx = 'shop-images-ex';

export async function generateShops(users: IUserDoc[]) {
  const shops = await Promise.all(
    users.map(async (user, index) => {

      const shop = await Shop.create({
        user: user.id,
        shop_name: `${user.name} Shop ${index}`,
      });

      await copyFolderS3(
        env.aws_s3.bucket,
        keySourceImagesEx,
        env.aws_s3.bucket,
        `shop/${shop.id}`,
      );

      await ShopMember.create({
        shop: shop.id,
        user: user.id,
        role: SHOP_MEMBER_ROLES.OWNER,
      });

      await User.findOneAndUpdate({ _id: user.id }, {
        shop: shop.id,
      });
      return shop;
    }),
  );
  log.info('shops collection generated');
  return shops;
}

export async function deleteShopFoldersS3() {
  const shops = await Shop.find();
  if (shops.length > 0) {
    await Promise.all(
      shops.map(async (shop) => {
        await deleteFolderS3(`shop/${shop.id.toString()}`);
      }),
    );
  }
  log.info('AWS S3 all shop\'s folders deleted ');
}
