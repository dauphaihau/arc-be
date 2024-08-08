import { StatusCodes } from 'http-status-codes';
import { RequestQueryParams, RequestBody } from '@/interfaces/express';
import { log } from '@/config';
import { Category } from '@/models/category.model';
import {
  GetCategoryQueryParams,
  CreateCategoryBody,
  ICategorySearch,
  ICategory
} from '@/interfaces/models/category';
import { catchAsync } from '@/utils';

const createRootOrSubCategory = catchAsync(async (
  req: RequestBody<CreateCategoryBody>,
  res
) => {
  const category = await Category.create(req.body);
  res.status(StatusCodes.CREATED).send({ category });
});

const getList = catchAsync(async (
  req: RequestQueryParams<GetCategoryQueryParams>,
  res
) => {

  const categories = await Category.find({
    parent: req.query.parent || null,
  }).sort({ rank: 1 });

  const subCategories = await Category.find({
    parent: {
      $in: categories.map(c => c.id),
    },
  }).sort({ rank: 1 });

  res.status(StatusCodes.OK).send(
    {
      categories,
      has_more: subCategories && subCategories.length > 0,
    });
});

const getSearchCategories = catchAsync(async (
  req: RequestQueryParams<GetCategoryQueryParams>,
  res
) => {

  let categories: ICategorySearch[] = [];
  const limitDefault = 6;
  const limitQuery = req.query.limit as string;

  const limit = limitQuery &&
  parseInt(limitQuery, limitDefault) > 0 ?
    parseInt(limitQuery, limitDefault) :
    limitDefault;

  const categoriesResultSearch = await Category.find({
    name: {
      $regex: req.query.name,
      $options: 'i',
    },
  }).limit(limit);

  await Promise.all(
    categoriesResultSearch.map(async (category) => {
      const subCategory = await Category.findOne({ parent: category._id });
      if (subCategory) {
        const result = await startOrMidToDeepestCategory(category, limit - categories.length);
        categories = [...categories, ...result];
      }
      else {
        const result = await deepestToRootCategory(category);
        categories.push(result);
      }
    })
  );

  async function deepestToRootCategory(categoryParam: ICategory): Promise<ICategorySearch> {
    const categoriesRelated = [categoryParam.name];

    await populatedToRoot(categoryParam);

    async function populatedToRoot(category: ICategory) {

      await category.populate('parent');
      log.debug('category populated %o', category);

      const categoryParent = category.parent as unknown as ICategory;
      if (categoryParent?.name) {
        categoriesRelated.unshift(categoryParent.name);
        await populatedToRoot(categoryParent);
      }
    }

    return {
      id: categoryParam.id,
      lastNameCategory: categoryParam.name,
      categoriesRelated,
    };
  }

  async function startOrMidToDeepestCategory(
    categoryParam: ICategory,
    limitGetCategories: number
  ): Promise<ICategorySearch[]> {

    let categoriesResult: ICategorySearch[] = [];

    const initCategoriesMap = new Map<ICategory['id'], ICategorySearch>();
    initCategoriesMap.set(categoryParam.id.toString(), {
      id: categoryParam.id,
      lastNameCategory: categoryParam.name,
      categoriesRelated: [categoryParam.name],
    });

    const initCategoriesRelated: ICategorySearch['categoriesRelated'] = [];

    await populatedToRoot(categoryParam);

    async function populatedToRoot(category: ICategory) {
      await category.populate('parent');
      const categoryParent = category.parent as unknown as ICategory;
      if (categoryParent?.name) {
        initCategoriesRelated.unshift(categoryParent.name);
        await populatedToRoot(categoryParent);
      }
    }
    log.debug('initCategoriesRelated %o', initCategoriesRelated);


    await getSubCategories([categoryParam], initCategoriesMap);

    async function getSubCategories(categories: ICategory[], categoriesMap: Map<ICategory['id'], ICategorySearch>) {

      // console.count('count getSubCategories');

      const parentIds = categories.map(c => c.id);

      const subCategories = await Category.find({
        parent: { $in: parentIds },
      }).limit(limitGetCategories);

      if (subCategories && subCategories.length > 0) {

        let tempCategoriesRelated: ICategorySearch[] = [];
        const newMapCategories = new Map<ICategory['id'], ICategorySearch>();

        subCategories.forEach(sub => {
          const tempCategorySearch: ICategorySearch = {
            id: sub.id,
            lastNameCategory: sub.name,
            categoriesRelated: [],
          };

          const categorySearch = categoriesMap.get(sub.parent?.toString());
          if (categorySearch?.categoriesRelated) {
            tempCategorySearch.categoriesRelated = [...categorySearch.categoriesRelated];
          }

          tempCategorySearch.categoriesRelated.push(sub.name);
          newMapCategories.set(sub.id?.toString(), tempCategorySearch);

          if (initCategoriesRelated.length > 0) {
            tempCategoriesRelated.push({
              ...tempCategorySearch,
              categoriesRelated: [
                ...initCategoriesRelated,
                ...tempCategorySearch.categoriesRelated,
              ],
            });
          }
          else {
            tempCategoriesRelated.push(tempCategorySearch);
          }
        });

        if (subCategories.length < categories.length) {

          const parentIdsubCategory = subCategories[0].parent?.toString();

          const deepestCategories = categoriesResult.filter(c => {
            return c.id.toString() !== parentIdsubCategory;
          });
          tempCategoriesRelated = [...deepestCategories, ...tempCategoriesRelated];
          tempCategoriesRelated = tempCategoriesRelated.slice(0, limitGetCategories);
        }

        categoriesResult = tempCategoriesRelated;

        await getSubCategories(subCategories, newMapCategories);
      }
    }

    // log.debug('categoriesResult %o', categoriesResult);
    return categoriesResult;
  }

  res.status(StatusCodes.OK).send({ categories });
});

export const categoryController = {
  createRootOrSubCategory,
  getList,
  getSearchCategories,
};
