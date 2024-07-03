import { Request } from 'express';
import { StatusCodes } from 'http-status-codes';
import {
  RequestParamsBody,
  RequestParamsQuery
} from '@/interfaces/common/request';
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
  req: RequestParamsBody<AddShopMemberParams, AddShopMemberBody>,
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
  req: RequestParamsQuery<GetShopMemberParams, GetShopMemberQueries>,
  res
) => {
  const filter = pick(
    { ...req.query, shop_id: req.params.shop },
    ['shop']
  );
  const options = pick(req.query, ['sortBy', 'limit', 'page', 'populate', 'select']);
  const result = await shopMemberService.getListMember(filter, options);
  res.send(result);
});

const deleteMember = catchAsync(async (
  req: Request<DeleteShopMemberParams>,
  res
) => {
  if (req.user.id === req.params.user) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'invalid userId');
  }
  if (!req.params.shop) {
    throw new ApiError(StatusCodes.BAD_REQUEST);
  }
  await shopMemberService.deleteMember(req.params.shop, req.params.user);
  res.status(StatusCodes.NO_CONTENT).send();
});

const updateMember = catchAsync(async (
  req: RequestParamsBody<UpdateShopMemberParams, UpdateShopMemberBody>,
  res
) => {
  if (req.user.id === req.params.user) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'invalid userId');
  }
  if (!req.params.shop) {
    throw new ApiError(StatusCodes.BAD_REQUEST);
  }
  await shopMemberService.updateMember(req.params.shop, req.params.user, req.body);
  res.status(StatusCodes.NO_CONTENT).send();
});

export const memberController = {
  getMembers,
  addMember,
  deleteMember,
  updateMember,
};
