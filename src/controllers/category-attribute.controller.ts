import { Request } from 'express';
import { StatusCodes } from 'http-status-codes';
import { RequestParamsAndBody } from '@/interfaces/express';
import {
  CreateCategoryAttributeBody,
  GetAttributesByCategoryParams,
  CreateCategoryAttributeParams
} from '@/interfaces/models/category-attribute';
import { CategoryAttribute } from '@/models';
import { catchAsync } from '@/utils';

const createAttribute = catchAsync(async (
  req: RequestParamsAndBody<CreateCategoryAttributeParams, CreateCategoryAttributeBody>,
  res
) => {
  const attribute = await CategoryAttribute.create({
    category: req.params.id,
    ...req.body,
  });
  res.status(StatusCodes.CREATED).send({ attribute });
});

const getAttributesByCategory = catchAsync(async (
  req: Request<GetAttributesByCategoryParams>,
  res
) => {
  const attributes = await CategoryAttribute.find({
    category: req.params.id,
  });
  res.status(StatusCodes.OK).send({ attributes });
});

export const categoryAttributeController = {
  createAttribute,
  getAttributesByCategory,
};
