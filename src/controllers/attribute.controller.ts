import { Request } from 'express';
import { StatusCodes } from 'http-status-codes';
import {
  CreateAttributePayload,
  GetAttributesByCategoryParams,
  CreateAttributeParams
} from '@/interfaces/models/attribute';
import { Attribute } from '@/models';
import { catchAsync } from '@/utils';

const createAttribute = catchAsync(async (
  req: Request<CreateAttributeParams, unknown, CreateAttributePayload>,
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

export const attributeController = {
  createAttribute,
  getAttributesByCategory,
};
