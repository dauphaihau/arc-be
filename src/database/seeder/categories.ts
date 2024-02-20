import { Category, Attribute } from '@/models';

const categories = [
  {
    name: 'Clothing',
    rank: 1,
    relative_url: '',
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
            name: 'Dresses',
            attributes: [
              {
                name: 'Material',
                options: ['Cotton', 'Linen'],
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
    attributes: [
      {
        name: 'Brands',
        options: ['Zara', 'DG'],
      },
    ],
    sub: [
      { name: 'Hat & Cap' },
      {
        name: 'Bag',
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
    attributes: [
      {
        name: 'Brands',
        options: ['Sony', 'Apple'],
      },
    ],
    sub: [
      { name: 'Camera' },
      { name: 'Video Games' },
      { name: 'Ebook Readers' },
      { name: 'Headphones' },
    ],
  },
  {
    name: 'Art',
    rank: 4,
    attributes: [
      {
        name: 'Brands',
        options: ['Sony', 'Apple'],
      },
    ],
    sub: [
      { name: 'Crafting' },
      { name: 'Painting' },
    ],
  },
  {
    name: 'Home',
    rank: 5,
    sub: [
      {
        name: 'Furniture',
        sub: [
          {
            name: 'Table',
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
        sub: [
          {
            name: 'Towel',
          },
        ],
      },
    ],
  },
  {
    name: 'Toys & Games',
    rank: 6,
    sub: [
      { name: 'Games' },
      { name: 'Puppets' },
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

      const rootCategoryCreated = await createCategory(null, rootCategory.name, indexRoot + 1);
      if (rootCategory?.attributes) {
        await createAttributes(rootCategoryCreated.id, rootCategory.attributes);
      }

      if (rootCategory?.sub && rootCategoryCreated) {
        await Promise.all(
          rootCategory.sub.map(async (subCategory1, indexCategory1) => {
            const subCategory1Created = await createCategory(
              rootCategoryCreated.id,
              subCategory1.name,
              indexCategory1 + 1
              // subCategory1?.relative_url_image
            );

            if (subCategory1?.attributes) {
              await createAttributes(subCategory1Created.id, subCategory1.attributes);
            }

            if (subCategory1?.sub && subCategory1Created) {
              await Promise.all(
                subCategory1.sub.map(async (subCategory2, indexCategory2) => {
                  const subCategory2Created = await createCategory(
                    subCategory1Created.id,
                    subCategory2.name,
                    indexCategory2 + 1
                  );

                  if (subCategory2?.attributes) {
                    await createAttributes(subCategory2Created.id, subCategory2.attributes);
                  }
                })
              );
            }
          })
        );
      }
    })
  );
}
