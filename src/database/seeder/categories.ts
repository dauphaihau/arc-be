import { Category, Attribute } from '@/models';

const categories = [
  {
    name: 'Clothing',
    rank: 1,
    relative_url_image: 'categories/clothing.jpg',
    attributes: [
      {
        name: 'Brand',
        options: ['Zara', 'DG'],
      },
    ],
    sub: [
      {
        name: 'Man Fashion',
        relative_url_image: 'categories/man-fasion.jpg',
        sub: [
          {
            name: 'Sweaters',
            attributes: [
              {
                name: 'Material',
                options: ['Cotton', 'Linen'],
              },
            ],
          },
          {
            name: 'Tees',
            attributes: [
              {
                name: 'Material',
                options: ['Cotton', 'Linen'],
              },
            ],
          },
          {
            name: 'Hoodies',
            attributes: [
              {
                name: 'Material',
                options: ['Cotton', 'Linen'],
              },
            ],
          },
        ],
      },
      {
        name: 'Women\'s Fashion',
        relative_url_image: 'categories/women-fasion.jpg',
        sub: [
          {
            name: 'Sweaters',
            attributes: [
              {
                name: 'Material',
                options: ['Cotton', 'Linen'],
              },
            ],
          },
          {
            name: 'Dresses',
            attributes: [
              {
                name: 'Material',
                options: ['Cotton', 'Linen'],
              },
            ],
          },
          {
            name: 'Tees',
            sub: [
              {
                name: 'T-shirts',
                sub: [
                  {
                    name: 'Graphic Tee',
                    attributes: [
                      {
                        name: 'Material',
                        options: ['Cotton', 'Linen'],
                      },
                    ],
                  },
                ],
              },
              {
                name: 'Polos',
                attributes: [
                  {
                    name: 'Material',
                    options: ['Cotton', 'Linen'],
                  },
                ],
              },
            ],
          },
          {
            name: 'Skirts',
            attributes: [
              {
                name: 'Material',
                options: ['Cotton', 'Linen'],
              },
            ],
          },
        ],
      },
    ],
  },
  {
    name: 'Accessories',
    rank: 2,
    relative_url_image: 'categories/accessories.jpeg',
    attributes: [
      {
        name: 'Brands',
        options: ['Zara', 'DG'],
      },
    ],
    sub: [
      {
        name: 'Hat & Cap',
        relative_url_image: 'categories/hat.webp',
      },
      {
        name: 'Bag',
        relative_url_image: 'categories/bag.webp',
        sub: [
          { name: 'Totes' },
          { name: 'Wallet' },
        ],
      },
    ],
  },
  {
    name: 'Electronics',
    rank: 3,
    relative_url_image: 'categories/electronics.jpg',
    attributes: [
      {
        name: 'Brands',
        options: ['Sony', 'Apple'],
      },
    ],
    sub: [
      {
        name: 'Camera',
        relative_url_image: 'categories/camera.webp',
      },
      {
        name: 'Video Games',
        relative_url_image: 'categories/toy-video-games.webp',
      },
      {
        name: 'Ebook Readers',
        relative_url_image: 'categories/ebook-reader.webp',
      },
      {
        name: 'Headphones',
        relative_url_image: 'categories/headphone.jpg',
      },
    ],
  },
  {
    name: 'Art',
    rank: 4,
    relative_url_image: 'categories/art.jpg',
    attributes: [
      {
        name: 'Brands',
        options: ['Sony', 'Apple'],
      },
    ],
    sub: [
      {
        name: 'Crafting',
        relative_url_image: 'categories/crafting.webp',
      },
      {
        name: 'Painting',
        relative_url_image: 'categories/painting.webp',
      },
    ],
  },
  {
    name: 'Home',
    rank: 5,
    relative_url_image: 'categories/home.jpg',
    sub: [
      {
        name: 'Furniture',
        relative_url_image: 'categories/furniture.webp',
        sub: [
          {
            name: 'Table',
            relative_url_image: 'categories/table.jpg',
            attributes: [
              {
                name: 'Brand',
                options: ['Wood', 'Skin', 'Plastic'],
              },
            ],
          },
        ],
      },
      {
        name: 'Bathroom',
        relative_url_image: 'categories/bathroom.jpg',
        sub: [
          {
            name: 'Towel',
            relative_url_image: 'categories/towel.jpg',
          },
        ],
      },
    ],
  },
  {
    name: 'Toys & Games',
    rank: 6,
    relative_url_image: 'categories/toy-video-games.webp',
    sub: [
      {
        name: 'Games',
        relative_url_image: 'categories/toy-video-games.webp',
      },
      {
        name: 'Puppets',
        relative_url_image: 'categories/puppets.webp',
      },
    ],
  },
];

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
    categories.map(async (rootCategory, indexRoot) => {

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
