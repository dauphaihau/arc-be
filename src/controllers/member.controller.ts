import { StatusCodes } from 'http-status-codes';
import { ShopMember } from '@/models';
import {
  RequestParamsAndBody,
  RequestParamsAndQueryParams, RequestParams
} from '@/interfaces/express';
import {
  AddShopMemberParams,
  AddShopMemberBody,
  DeleteShopMemberParams,
  UpdateShopMemberParams,
  UpdateShopMemberBody,
  GetShopMemberQueries,
  GetShopMemberParams
} from '@/interfaces/models/shop-member';
import { shopMemberService } from '@/services';
import { catchAsync, ApiError, pick } from '@/utils';

const addMember = catchAsync(async (
  req: RequestParamsAndBody<AddShopMemberParams, AddShopMemberBody>,
  res
) => {
  if (!req.params.shop) {
    throw new ApiError(StatusCodes.BAD_REQUEST);
  }
  const memberExist = await shopMemberService.findMemberShop(req.params.shop, req.body.user);
  if (memberExist) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Member is exist');
  }
  const member = await shopMemberService.addMember({
    ...req.body,
    shop: req.params.shop as string,
  });
  res.status(StatusCodes.CREATED).send({ member });
});

const getMembers = catchAsync(async (
  req: RequestParamsAndQueryParams<GetShopMemberParams, GetShopMemberQueries>,
  res
) => {
  const filter = pick(
    { ...req.query, shop_id: req.params.shop },
    ['shop']
  );
  const options = pick(req.query, ['sortBy', 'limit', 'page', 'populate', 'select']);
  const result = await ShopMember.paginate(filter, options);
  res.send(result);
});

const deleteMember = catchAsync(async (
  req: RequestParams<DeleteShopMemberParams>,
  res
) => {
  if (!req.params.user_id || req.user.id === req.params.user_id) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'invalid userId');
  }
  if (!req.params.shop_id) {
    throw new ApiError(StatusCodes.BAD_REQUEST);
  }
  await shopMemberService.deleteMember(req.params.shop_id, req.params.user_id);
  res.status(StatusCodes.NO_CONTENT).send();
});

const updateMember = catchAsync(async (
  req: RequestParamsAndBody<UpdateShopMemberParams, UpdateShopMemberBody>,
  res
) => {
  if (!req.params.user_id || req.user.id === req.params.user_id) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'invalid userId');
  }
  if (!req.params.shop_id) {
    throw new ApiError(StatusCodes.BAD_REQUEST);
  }
  await shopMemberService.updateMember(req.params.shop_id, req.params.user_id, req.body);
  res.status(StatusCodes.NO_CONTENT).send();
});

export const memberController = {
  getMembers,
  addMember,
  deleteMember,
  updateMember,
};
