import { categoriesData } from '@/database/data-seed/category';
import { Category, Attribute } from '@/models';

const createCategory = async (parent = null, name, rank, image = null) => {
  return Category.create({
    parent, name, rank, relative_url_image: image ?? '',
  });
};

const createAttributes = async (categoryId, attributes) => {
  await Promise.all(attributes.map(async (attr) => {
    const { name, options } = attr;
    return Attribute.create({ category: categoryId, name, options });
  }));
};

export async function generateCategoriesDB() {
  await Promise.all(
    categoriesData.map(async (rootCategory, indexRoot) => {

      const rootCategoryCreated = await createCategory(null,
        rootCategory.name,
        indexRoot + 1,
        rootCategory?.relative_url_image
      );
      if (rootCategory?.attributes) {
        await createAttributes(rootCategoryCreated.id, rootCategory.attributes);
      }

      async function initDeepCategories(parentCategory, parentCreated) {
        if (parentCategory?.sub && parentCreated) {
          await Promise.all(
            parentCategory.sub.map(async (subCategory, indexCategory) => {
              const subCategoryCreated = await createCategory(
                parentCreated.id,
                subCategory.name,
                indexCategory + 1,
                subCategory?.relative_url_image
              );

              if (subCategory?.attributes) {
                await createAttributes(subCategoryCreated.id, subCategory.attributes);
              }

              if (subCategory?.sub && subCategoryCreated) {
                await initDeepCategories(subCategory, subCategoryCreated);
              }
            })
          );
        }
      }

      await initDeepCategories(rootCategory, rootCategoryCreated);
    })
  );
}
