
const attributesClothingCommon = [
  {
    name: 'Material',
    options: ['Cotton', 'Linen'],
  },
  {
    name: 'Style',
    options: ['Sport', 'Minimal', 'Retro', 'Classic'],
  },
];

const attributesAccessoriesBagCommon = [
  {
    name: 'Material',
    options: ['Canvas', 'Nylon', 'PVC', 'Skin'],
  },
  {
    name: 'Lock Bag',
    options: ['Zip lock', 'Press lock'],
  },
];

const attributesAccessoriesHatCommon = [
  {
    name: 'Gender',
    options: ['Male', 'Female', 'Unisex'],
  },
  {
    name: 'Material',
    options: ['Canvas', 'Nylon', 'PVC', 'Skin'],
  },
];

const attributesArtCommon = [
  {
    name: 'Material',
    options: ['Wood', 'Plastic', 'Metal'],
  },
];

const attributesElectronicsCommon = [
  {
    name: 'Warranty period',
    options: ['1 month', '2 months', '3 months', '6 months', '12 months', '24 months', '3 years', '5 years'],
  },
  {
    name: 'Warranty type',
    options: ['International warranty', 'Manufacturer warranty', 'Supplier warranty', 'No warranty'],
  },
];


export const categoriesData = [
  {
    name: 'Clothing',
    rank: 1,
    relative_url_image: 'categories/clothing.jpg',
    sub: [
      {
        name: 'Man Fashion',
        relative_url_image: 'categories/man-fasion.jpg',
        sub: [
          {
            name: 'Sweaters',
            attributes: attributesClothingCommon,
          },
          {
            name: 'Tees',
            attributes: attributesClothingCommon,
          },
          {
            name: 'Hoodies',
            attributes: attributesClothingCommon,
          },
        ],
      },
      {
        name: 'Women\'s Fashion',
        relative_url_image: 'categories/women-fasion.jpg',
        sub: [
          {
            name: 'Sweaters',
            attributes: attributesClothingCommon,
          },
          {
            name: 'Dresses',
            attributes: attributesClothingCommon,
          },
          {
            name: 'Tees',
            sub: [
              {
                name: 'T-shirts',
                sub: [
                  {
                    name: 'Graphic Tee',
                    attributes: attributesClothingCommon,
                  },
                ],
              },
              {
                name: 'Polos',
                attributes: attributesClothingCommon,
              },
            ],
          },
          {
            name: 'Skirts',
            attributes: attributesClothingCommon,
          },
        ],
      },
    ],
  },
  {
    name: 'Accessories',
    rank: 2,
    relative_url_image: 'categories/accessories.jpeg',
    sub: [
      {
        name: 'Hat & Cap',
        relative_url_image: 'categories/hat.webp',
        attributes: attributesAccessoriesHatCommon,
      },
      {
        name: 'Bag',
        relative_url_image: 'categories/bag.webp',
        sub: [
          {
            name: 'Totes',
            attributes: attributesAccessoriesBagCommon,
          },
          {
            name: 'Wallet',
            attributes: attributesAccessoriesBagCommon,
          },
        ],
      },
    ],
  },
  {
    name: 'Electronics',
    rank: 3,
    relative_url_image: 'categories/electronics.jpg',
    sub: [
      {
        name: 'Camera',
        relative_url_image: 'categories/camera.webp',
        attributes: attributesElectronicsCommon,
      },
      {
        name: 'Ebook Readers',
        relative_url_image: 'categories/ebook-reader.webp',
        attributes: attributesElectronicsCommon,
      },
      {
        name: 'Headphones',
        relative_url_image: 'categories/headphone.jpg',
        attributes: attributesElectronicsCommon,
      },
    ],
  },
  {
    name: 'Art',
    rank: 4,
    relative_url_image: 'categories/art.jpg',
    sub: [
      {
        name: 'Crafting',
        relative_url_image: 'categories/crafting.webp',
        attributes: attributesArtCommon,
      },
      {
        name: 'Painting',
        relative_url_image: 'categories/painting.webp',
        attributes: attributesArtCommon,
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
                name: 'Material',
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
        sub: [
          {
            name: 'Videos game',
            sub: [
              { name: 'Xbox games' },
              { name: 'Playstation games' },
            ],
          },
          {
            name: 'Console game',
            sub: [
              { name: 'Xbox' },
              { name: 'Playstation' },
            ],
          },
          {
            name: 'Accessories console',
            attributes: [
              {
                name: 'Type accessory',
                options: ['Cable', 'Gamepad', 'Controller'],
              },
            ],
          },
        ],
      },
      {
        name: 'Puppets',
        relative_url_image: 'categories/puppets.webp',
        attributes: [
          {
            name: 'Material',
            options: ['Paper', 'Plastic', 'Wood'],
          },
        ],
      },
    ],
  },
];
