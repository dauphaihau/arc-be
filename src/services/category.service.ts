import { StatusCodes } from 'http-status-codes';
import { ICategory } from '@/interfaces/models/category';
import { Category } from '@/models';
import { ApiError } from '@/utils';

const getById = async (id: ICategory['id']) => {
  return Category.findById(id);
};

const getSubCategoriesByCategory = async (id: ICategory['id']) => {
  const category = await getById(id);
  if (!category) throw new ApiError(StatusCodes.NOT_FOUND, 'Category not found');

  let categoryIds: ICategory['id'][] = [category.id];

  let parentIds: ICategory['id'][] | null = null;
  const getSubCategory = async () => {
    const subCategories = await Category.find({
      parent: {
        $in: parentIds ? parentIds : [category.id],
      },
    });
    if (subCategories && subCategories.length > 0) {
      parentIds = subCategories.map(sub => sub.id);
      categoryIds = [...categoryIds, ...parentIds];
      await getSubCategory();
    }
  };
  await getSubCategory();
  return categoryIds;
};

export const categoryService = {
  getById,
  getSubCategoriesByCategory,
};
