import { log } from '@/config';
import { categoriesData } from '@/database/data-seed/category';
import { ICategory } from '@/interfaces/models/category';
import {
  CreateCategoryAttributeBody
} from '@/interfaces/models/category-attribute';
import { RequestCreateCategory } from '@/interfaces/request/category';
import { Category, CategoryAttribute } from '@/models';

type RequestCreateCategoryBody = RequestCreateCategory['body']
interface CategoryRecursion extends RequestCreateCategoryBody{
  attributes?: CreateCategoryAttributeBody[]
  sub?: CategoryRecursion[]
}

const createAttributes = async (categoryId: ICategory['id'], attributes: CreateCategoryAttributeBody[]) => {
  await Promise.all(attributes.map(async (attr) => {
    const { name, options } = attr;
    return CategoryAttribute.create({ category: categoryId, name, options });
  }));
};

async function initDeepCategories(parentCategory: CategoryRecursion, parentCreated: ICategory) {
  if (parentCategory?.sub && parentCreated) {
    await Promise.all(
      parentCategory.sub.map(async (subCategory, indexCategory) => {
        const subCategoryCreated = await Category.create({
            parent: parentCreated.id,
            name: subCategory.name,
            rank: indexCategory + 1,
            relative_url_image: subCategory.relative_url_image,
          },
        );

        if (subCategory?.attributes) {
          await createAttributes(subCategoryCreated.id, subCategory.attributes);
        }

        if (subCategory?.sub && subCategoryCreated) {
          await initDeepCategories(subCategory, subCategoryCreated);
        }
      }),
    );
  }
}

export async function generateCategories() {
  await Promise.all(
    categoriesData.map(async (rootCategory, indexRoot) => {
      const rootCategoryCreated = await Category.create({
        parent: null,
        name: rootCategory.name,
        rank: indexRoot + 1,
        relative_url_image: rootCategory.relative_url_image,
      });
      await initDeepCategories(rootCategory, rootCategoryCreated);
    }),
  );
  log.info('categories collection generated');
}
