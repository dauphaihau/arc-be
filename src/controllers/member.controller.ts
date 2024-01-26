import { Request } from 'express';
import { StatusCodes } from 'http-status-codes';
import {
  AddMemberParams,
  AddMemberPayload,
  DeleteMemberParams, UpdateMemberParams, UpdateMemberPayload, GetMemberQueries,
  GetMemberParams
} from '@/interfaces/models/member';
import { memberService } from '@/services';
import { catchAsync, ApiError, pick } from '@/utils';

const addMember = catchAsync(async (
  req: Request<AddMemberParams, unknown, AddMemberPayload>,
  res
) => {
  const memberExist = await memberService.findMemberShop(req.params.shop, req.body.user);
  if (memberExist) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Member is exist');
  }
  const member = await memberService.addMember({
    ...req.body,
    shop: req.params.shop as string,
  });
  res.status(StatusCodes.CREATED).send({ member });
});

const getMembers = catchAsync(async (
  req: Request<GetMemberParams, unknown, unknown, GetMemberQueries>,
  res
) => {
  const filter = pick(
    { ...req.query, shop_id: req.params.shop },
    ['shop']
  );
  const options = pick(req.query, ['sortBy', 'limit', 'page', 'populate', 'select']);
  const result = await memberService.queryMembers(filter, options);
  res.send(result);
});

const deleteMember = catchAsync(async (
  req: Request<DeleteMemberParams>,
  res
) => {
  if (req.user.id === req.params.user) throw new ApiError(StatusCodes.BAD_REQUEST, 'invalid userId');
  await memberService.deleteMember(req.params.shop, req.params.user);
  res.status(StatusCodes.NO_CONTENT).send();
});

const updateMember = catchAsync(async (
  req: Request<UpdateMemberParams, unknown, UpdateMemberPayload>,
  res
) => {
  if (req.user.id === req.params.user) throw new ApiError(StatusCodes.BAD_REQUEST, 'invalid userId');
  await memberService.updateMember(req.params.shop, req.params.user, req.body);
  res.status(StatusCodes.NO_CONTENT).send();
});

export const memberController = {
  getMembers,
  addMember,
  deleteMember,
  updateMember,
};
