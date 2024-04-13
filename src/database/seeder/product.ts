import { env } from '@/config';
import {
  PRODUCT_CONFIG,
  PRODUCT_VARIANT_TYPES,
  PRODUCT_WHO_MADE,
} from '@/config/enums/product';
import { getRandomInt, capitalizeSentence } from '@/database/util';
import { IProduct } from '@/interfaces/models/product';
import { IShop } from '@/interfaces/models/shop';
import { Product, ProductInventory, Category, Attribute } from '@/models';
import { ProductVariant } from '@/models/product-variant.model';
import { getListObjects } from '@/services/aws-s3.service';
import { faker } from '@faker-js/faker';

const productAmountPerShop = 10;
const imagesAmountPerProduct = 2;

const arrCategoryName = ['Sweaters', 'Tees', 'Hoodies', 'Dresses', 'Skirts'];

const productWhoMade = Object.values(PRODUCT_WHO_MADE);

const maxPrice = 500;

const variant_group_name = 'Color';
const variant_sub_group_name = 'Size';

const single_variants = [
  { variant_name: 'Black' },
  { variant_name: 'Red' },
];

const combine_variants = [
  {
    variant_name: 'Black',
    variant_options: [
      {
        variant: null,
        inventory: null,
        variant_name: 'S',
      },
      {
        variant: null,
        inventory: null,
        variant_name: 'M',
      },
    ],
  },
  {
    variant_name: 'Red',
    variant_options: [
      {
        variant: null,
        inventory: null,
        variant_name: 'S',
      },
      {
        variant: null,
        inventory: null,
        variant_name: 'M',
      },
    ],
  },
];


const initBaseProduct = async (shop: IShop, relative_urls: (string | undefined)[]) => {

  const categoryName = arrCategoryName[getRandomInt(arrCategoryName.length)];
  const category = await Category.findOne({ name: categoryName });
  if (!category) return;

  const attributes = await Attribute.find({ category: category.id });
  const attributesSelected = attributes.map(attr => {
      if (!attr.options) return;
      return {
        attribute: attr.id,
        selected: attr.options[getRandomInt(attr.options.length)],
      };
    },
  );

  let images;
  if (relative_urls && relative_urls.length > 0) {
    images = relative_urls.map((url, idx) => ({
      rank: idx + 1,
      relative_url: url,
    }));
  } else {
    images = [
      {
        relative_url: `shop/${shop.id}/undefined`,
      },
    ];
  }

  return Product.create({
    shop: shop.id,
    title: capitalizeSentence(faker.word.words({ count: 2 })) + ' ' + categoryName,
    description: faker.word.words({ count: 250 }),
    who_made: productWhoMade[getRandomInt(productWhoMade.length)],
    state: 'inactive',
    category: category.id,
    attributes: attributesSelected,
    images,
  });
};

const initProductNonVariant = async (product: IProduct) => {

  const inventory = await ProductInventory.create({
    shop: product.shop,
    product: product.id,
    stock: faker.commerce.price({ min: 0, max: PRODUCT_CONFIG.MAX_STOCK }),
    price: faker.commerce.price({
      min: PRODUCT_CONFIG.MIN_PRICE,
      max: maxPrice,
    }),
    // sku,
  });

  await product.updateOne({
    inventory: inventory.id,
    variant_type: PRODUCT_VARIANT_TYPES.NONE,
  });
};

const initProductSingleVariant = async (product: IProduct) => {

  const prodVariantsIds: string[] = [];

  await Promise.all(
    single_variants.map(async (variant) => {
      const invProdVar = await ProductInventory.create({
        shop: product.shop,
        product: product.id,
        variant: variant.variant_name,
        stock: faker.commerce.price({
          min: 0,
          max: PRODUCT_CONFIG.MAX_STOCK,
        }),
        price: faker.commerce.price({
          min: PRODUCT_CONFIG.MIN_PRICE,
          max: maxPrice,
        }),
        // sku: variant?.sku,
      });

      const prodVar = await ProductVariant.create({
        product: product.id,
        inventory: invProdVar.id,
        variant_name: variant.variant_name,
        variant_options: [],
      });
      prodVariantsIds.push(prodVar.id);
    }),
  );

  await product.updateOne({
    variant_type: PRODUCT_VARIANT_TYPES.SINGLE,
    variant_group_name,
    variants: prodVariantsIds,
  });
};

const initProductCombineVariant = async (product: IProduct) => {

  const productVariantsIds: string[] = [];

  const cacheVariantName = new Map();

  await Promise.all(
    combine_variants[0].variant_options.map(async variantOption => {
      const productVariantCreated = await ProductVariant.create({
        product: product.id,
        variant_name: variantOption.variant_name,
      });
      cacheVariantName.set(variantOption.variant_name, productVariantCreated.id);
    }),
  );

  await Promise.all(
    combine_variants.map(async (variant) => {
      await Promise.all(
        variant.variant_options.map(async (variantOption) => {

          if (cacheVariantName.has(variantOption.variant_name)) {
            variantOption.variant = cacheVariantName.get(variantOption.variant_name);
          }

          const productInventoryCreated = await ProductInventory.create({
            shop: product.shop,
            product: product.id,
            variant: variant.variant_name + '-' + variantOption.variant_name,
            stock: faker.commerce.price({
              min: 0,
              max: PRODUCT_CONFIG.MAX_STOCK,
            }),
            price: faker.commerce.price({
              min: PRODUCT_CONFIG.MIN_PRICE,
              max: maxPrice,
            }),
            // sku: variantOption?.sku,
          });
          variantOption.inventory = productInventoryCreated.id;
        }),
      );

      const productVariantCreated = await ProductVariant.create({
        product: product.id,
        variant_name: variant.variant_name,
        variant_options: variant.variant_options,
      });
      productVariantsIds.push(productVariantCreated.id);
    }),
  );

  await product.updateOne({
    variant_type: PRODUCT_VARIANT_TYPES.COMBINE,
    variant_group_name,
    variant_sub_group_name,
    variants: productVariantsIds,
  });
};

export async function generateProductsDB(shops: IShop[]) {

  const products = [];

  for (const shop of shops) {

    const listObjectsResponse = await getListObjects({
      Bucket: env.aws_s3.bucket,
      Prefix: `shop/${shop.id}`,
    });
    if (!listObjectsResponse.Contents) return;
    const fromObjectKeys = listObjectsResponse.Contents.map(content => content.Key);

    for (let i = 0; i < productAmountPerShop; i++) {

      const from = i * imagesAmountPerProduct;
      const to = (i * imagesAmountPerProduct) + imagesAmountPerProduct;
      const relative_urls = fromObjectKeys.slice(from, to);
      if (!relative_urls) return;

      const product = await initBaseProduct(shop, relative_urls);
      if (!product) return;

      if (i % 2 === 0) products.push(initProductSingleVariant(product));
      if (i % 3 === 0) products.push(initProductCombineVariant(product));
      else products.push(initProductNonVariant(product));
    }

  }
  await Promise.all(products);
}
