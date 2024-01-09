import { StatusCodes } from 'http-status-codes';
import { log } from '@/config';
import { IBodyRequest } from '@/interfaces/common/request';
import { CreateShopPayload } from '@/interfaces/models/shop';
import { shopService, memberService } from '@/services';
import { MEMBER_ROLES } from '@/config/enums/member';
import {
  catchAsync, transactionWrapper, ApiError, pick
} from '@/utils';
import {
  Shop, Member, Product, Coupon, Inventory, User
} from '@/models';

const createShop = catchAsync(async (
  req: IBodyRequest<CreateShopPayload>,
  res
) => {
  await transactionWrapper(async (session) => {
    const user_id = req.user.id;

    // Validate user own any shop
    if (await Shop.exists({ user_id })) {
      throw new ApiError(StatusCodes.BAD_REQUEST, 'each account can only own one store');
    }

    // Create Shop
    const shop = await shopService.createShop({
      user_id,
      shop_name: req.body.shop_name,
    }, session);

    // Init owner member shop
    const member = await memberService.addMember({
      shop_id: shop.id,
      user_id,
      role: MEMBER_ROLES.OWNER,
    }, session);

    // Attach shop to user
    const updatedUser = await User.findOneAndUpdate({ _id: user_id }, {
      shop: shop.id,
    }, { session });
    if (!updatedUser || updatedUser.id.toString() !== user_id) {
      log.error('update user failed');
      throw new ApiError(StatusCodes.INTERNAL_SERVER_ERROR);
    }
    res.status(StatusCodes.CREATED).send({ shop, member });
  });
});

const deleteShop = catchAsync(async (req, res) => {
  await transactionWrapper(async (session) => {
    const user_id = req.user.id;

    // Validate user own shop
    const shop = await Shop.findOne({ user_id });
    if (!shop) {
      throw new ApiError(StatusCodes.FORBIDDEN, 'Forbidden');
    }

    // Remove all inventory
    const isDeletedInventories = await Inventory.deleteMany({ shop_id: shop.id }, { session });
    if (!isDeletedInventories.deletedCount) throw new Error();

    // Remove all products
    const isDeletedProducts = await Product.deleteMany({ shop_id: shop.id }, { session });
    if (!isDeletedProducts.deletedCount) throw new Error();

    // Remove all products in cart
    // const isDeletedInventories = await Cart.updateMany({ shop_id: shop.id }, { session });
    // if (!isDeletedInventories.deletedCount) throw new Error();

    // Remove all coupons
    const isDeletedCoupons = await Coupon.deleteMany({ shop_id: shop.id }, { session });
    if (!isDeletedCoupons.deletedCount) throw new Error();

    // Remove all members
    const isDeletedMembers = await Member.deleteMany({ shop_id: shop.id }, { session });
    if (!isDeletedMembers.deletedCount) throw new Error();

    // Remove shop
    await shop.remove({ session });
    res.status(StatusCodes.OK).send({});
  });
});

const getListShops = catchAsync(async (req, res) => {
  const filter = pick(req.query, ['shop_name']);
  const options = pick(req.query, ['sortBy', 'limit', 'page']);
  const result = await shopService.queryShops(filter, options);
  res.send(result);
});

export const shopController = {
  createShop,
  getListShops,
  deleteShop,
};
