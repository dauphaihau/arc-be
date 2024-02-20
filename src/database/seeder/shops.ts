import { Shop, User } from '@/models';

export async function generateShopsDB(users) {
  return Promise.all(
    users.map(async (user, index) => {
      const shop = await Shop.create({
        user: user.id,
        shop_name: user.name + ' Shop ' + index,
      });
      await User.findOneAndUpdate({ _id: user.id }, {
        shop: shop.id,
      });
      return shop;
    })
  );
}
