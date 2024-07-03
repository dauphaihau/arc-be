import { Request } from 'express';
import { StatusCodes } from 'http-status-codes';
import { RequestParamsBody } from '@/interfaces/common/request';
import {
  CreateCategoryAttributeBody,
  GetAttributesByCategoryParams,
  CreateCategoryAttributeParams
} from '@/interfaces/models/category-attribute';
import { Attribute } from '@/models';
import { catchAsync } from '@/utils';

const createAttribute = catchAsync(async (
  req: RequestParamsBody<CreateCategoryAttributeParams, CreateCategoryAttributeBody>,
  res
) => {
  const attribute = await Attribute.create({
    category: req.params.id,
    ...req.body,
  });
  res.status(StatusCodes.CREATED).send({ attribute });
});

const getAttributesByCategory = catchAsync(async (
  req: Request<GetAttributesByCategoryParams>,
  res
) => {
  const attributes = await Attribute.find({
    category: req.params.id,
  });
  res.status(StatusCodes.OK).send({ attributes });
});

export const categoryAttributeController = {
  createAttribute,
  getAttributesByCategory,
};
