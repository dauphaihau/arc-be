import { StatusCodes } from 'http-status-codes';
import { IBodyRequest } from '@/interfaces/common/request';
import { CreateShopPayload } from '@/interfaces/models/shop';
import { shopService, memberService } from '@/services';
import { MEMBER_ROLES } from '@/config/enums/member';
import { catchAsync, transactionWrapper, ApiError } from '@/utils';
import { Shop, Member } from '@/models';

const createShop = catchAsync(async (
  req: IBodyRequest<CreateShopPayload>,
  res
) => {
  await transactionWrapper(async (session) => {
    const user_id = req.user.id;

    // Validate user own any shop
    if (await Shop.exists({ user_id })) {
      throw new ApiError(StatusCodes.BAD_REQUEST, 'each account can only have one shop');
    }

    // Create Shop
    const shop = await shopService.createShop({
      user_id,
      shop_name: req.body.shop_name,
    }, session);

    // Init owner shop
    const member = await memberService.addMember({
      shop_id: shop.id,
      user_id,
      role: MEMBER_ROLES.OWNER,
    }, session);

    res.status(StatusCodes.CREATED).send({ shop, member });
  });
});

const deleteShop = catchAsync(async (
  req,
  res
) => {
  await transactionWrapper(async (session) => {
    const user_id = req.user.id;

    // Validate user own shop
    const shop = await Shop.findOne({ user_id });
    if (!shop) {
      throw new ApiError(StatusCodes.FORBIDDEN, 'Forbidden');
    }

    // Remove all members
    const isDeletedMembers = await Member.deleteMany({ shop_id: shop.id }, { session });
    if (!isDeletedMembers.deletedCount) throw new Error();

    // Remove shop
    await shop.remove({ session });
    res.status(StatusCodes.OK).send({});
  });
});

export const shopController = {
  createShop,
  deleteShop,
};
