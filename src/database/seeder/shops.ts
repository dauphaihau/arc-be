import { MEMBER_ROLES } from '@/config/enums/member';
import { Shop, User, Member } from '@/models';

export async function generateShopsDB(users) {
  return Promise.all(
    users.map(async (user, index) => {
      const shop = await Shop.create({
        user: user.id,
        shop_name: user.name + ' Shop ' + index,
      });
      await Member.create({
        shop: shop.id,
        user: user.id,
        role: MEMBER_ROLES.OWNER,
      });
      await User.findOneAndUpdate({ _id: user.id }, {
        shop: shop.id,
      });
      return shop;
    })
  );
}
