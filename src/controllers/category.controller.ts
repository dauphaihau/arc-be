import { Request } from 'express';
import { StatusCodes } from 'http-status-codes';
import { Category } from '@/models/category.model';
import {
  GetCategoryQueries,
  CreateCategoryPayload
} from '@/interfaces/models/category';
import { catchAsync } from '@/utils';

const createRootOrSubCategory = catchAsync(async (
  req: Request<unknown, unknown, CreateCategoryPayload>,
  res
) => {
  const category = await Category.create(req.body);
  res.status(StatusCodes.CREATED).send({ category });
});

const getCategories = catchAsync(async (
  req: Request<unknown, unknown, unknown, GetCategoryQueries>,
  res
) => {
  const categories = await Category.find({
    parent: req.query.parent || null,
  });
  const subCategories = await Category.find({
    parent: {
      $in: categories.map(c => c.id),
    },
  });

  res.status(StatusCodes.OK).send(
    { categories, has_more: subCategories && subCategories.length > 0 });
});

export const categoryController = {
  createRootOrSubCategory,
  getCategories,
};
