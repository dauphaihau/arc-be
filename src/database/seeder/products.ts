import { faker } from '@faker-js/faker';
import { ProductVariant } from '@/models/product-variant.model';
import {
  PRODUCT_CONFIG,
  PRODUCT_VARIANT_TYPES,
  PRODUCT_WHO_MADE
} from '@/config/enums/product';
import {
  Product, ProductInventory, Category, Attribute
} from '@/models';

const productAmountPerShop = 10;

function getRandomInt(max) {
  return Math.floor(Math.random() * max);
}

const arrCategoryName = ['Sweaters', 'Tees', 'Hoodies', 'Dresses', 'Skirts'];

const productWhoMade = Object.values(PRODUCT_WHO_MADE);

const initBaseProduct = async (shop) => {

  const category = await Category.findOne(
    { name: arrCategoryName[getRandomInt(arrCategoryName.length)] });

  const attributes = await Attribute.find({ category: category.id });
  const attributesSelected = attributes.map(attr => ({
    attribute: attr.id,
    selected: attr.options[getRandomInt(attr.options.length)],
  }));

  const product = await Product.create({
    shop: shop.id,
    title: faker.commerce.productName(),
    description: faker.commerce.productDescription(),
    who_made: productWhoMade[getRandomInt(productWhoMade.length)],
    state: 'inactive',
    category: category.id,
    attributes: attributesSelected,
    images: [
      {
        relative_url: 'shop/65c1c94c13409dc175a8af1d/45691887-6598-42a9-a29b-7de5e3609a8b.jpeg',
        rank: 1,
      },
      {
        relative_url: 'shop/65c1c94c13409dc175a8af1d/45691887-6598-42a9-a29b-7de5e3609a8b.jpeg',
        rank: 2,
      },
      {
        relative_url: 'shop/65c1c94c13409dc175a8af1d/45691887-6598-42a9-a29b-7de5e3609a8b.jpeg',
        rank: 3,
      },
    ],
  });

  return product;
};

const initProductNonVariant = async (shop) => {

  const product = await initBaseProduct(shop);

  const inventory = await ProductInventory.create({
    shop: shop.id,
    product: product.id,
    stock: faker.commerce.price({ min: 0, max: PRODUCT_CONFIG.MAX_QUANTITY }),
    price: faker.commerce.price({ min: 1, max: PRODUCT_CONFIG.MAX_PRICE }),
    // sku,
  });

  await product.updateOne({
    inventory: inventory.id,
    variant_type: PRODUCT_VARIANT_TYPES.NONE,
  });
};

const initProductSingleVariant = async (shop) => {

  const product = await initBaseProduct(shop);

  const prodVariantsIds: string[] = [];

  const variants = [
    {
      variant_group_name: 'Color',
      variant_name: 'Black',
    },
    {
      variant_group_name: 'Color',
      variant_name: 'Red',
    },
  ];

  await Promise.all(
    variants.map(async (variant) => {
      const invProdVar = await ProductInventory.create({
        shop: shop.id,
        product: product.id,
        variant: variant.variant_name,
        stock: faker.commerce.price({ min: 0, max: PRODUCT_CONFIG.MAX_QUANTITY }),
        price: faker.commerce.price({ min: 1, max: PRODUCT_CONFIG.MAX_PRICE }),
        sku: variant?.sku,
      });

      const prodVar = await ProductVariant.create({
        product: product.id,
        inventory: invProdVar.id,
        variant_group_name: variant.variant_group_name,
        variant_name: variant.variant_name,
        variant_options: [],
      });
      prodVariantsIds.push(prodVar.id);
    })
  );

  await product.updateOne({
    variants: prodVariantsIds,
    variant_type: PRODUCT_VARIANT_TYPES.SINGLE,
  });
};

const initProductCombineVariant = async (shop) => {

  const product = await initBaseProduct(shop);

  const prodVariantsIds: string[] = [];

  const variants = [
    {
      variant_group_name: 'Color',
      sub_variant_group_name: 'Size',
      variant_name: 'Black',
      variant_options: [
        {
          variant_name: 'S',
          quantity: 9,
        },
        {
          variant_name: 'M',
          quantity: 1,
        },
      ],
    },
    {
      variant_group_name: 'Color',
      sub_variant_group_name: 'Size',
      variant_name: 'Red',
      variant_options: [
        {
          variant_name: 'S',
          quantity: 1,
        },
        {
          variant_name: 'M',
          quantity: 1,
        },
      ],
    },
  ];

  await Promise.all(
    variants.map(async (variant) => {
      await Promise.all(
        variant.variant_options.map(async (subVar) => {
          const invProdVar = await ProductInventory.create({
            shop: shop.id,
            product: product.id,
            variant: variant.variant_name + '-' + subVar.variant_name,
            stock: faker.commerce.price({ min: 0, max: PRODUCT_CONFIG.MAX_QUANTITY }),
            price: faker.commerce.price({ min: 1, max: PRODUCT_CONFIG.MAX_PRICE }),
            sku: subVar?.sku,
          });
          subVar.inventory = invProdVar.id;
        })
      );
      const prodVar = await ProductVariant.create({
        product: product.id,
        variant_group_name: variant.variant_group_name,
        sub_variant_group_name: variant.sub_variant_group_name,
        variant_name: variant.variant_name,
        variant_options: variant.variant_options,
      });
      prodVariantsIds.push(prodVar.id);
    })
  );

  await product.updateOne({
    variants: prodVariantsIds,
    variant_type: PRODUCT_VARIANT_TYPES.COMBINE,
  });
};

export async function generateProductsDB(shops) {

  const products = [];

  shops.forEach((shop) => {
    for (let i = 0; i < productAmountPerShop; i++) {
      products.push(
        i === 0 ?
          initProductNonVariant(shop) :
          i === 1 ?
            initProductSingleVariant(shop) :
            initProductCombineVariant(shop));
    }
  });
  await Promise.all(products);
}
