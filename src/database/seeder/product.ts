import { IShop } from '@/interfaces/models/shop';
import { faker } from '@faker-js/faker';
import { getRandomInt } from '@/database/util';
import { getListObjects } from '@/services/aws-s3.service';
import { ProductVariant } from '@/models/product-variant.model';
import {
  PRODUCT_CONFIG,
  PRODUCT_VARIANT_TYPES,
  PRODUCT_WHO_MADE
} from '@/config/enums/product';
import {
  Product, ProductInventory, Category, Attribute
} from '@/models';

import { env } from '@/config';

const productAmountPerShop = 10;
// const productAmountPerShop = 50;
const imagesAmountPerProduct = 2;

const arrCategoryName = ['Sweaters', 'Tees', 'Hoodies', 'Dresses', 'Skirts'];

const variant_group_name = 'Color';

const variant_sub_group_name = 'Size';

const productWhoMade = Object.values(PRODUCT_WHO_MADE);

const initBaseProduct = async (shop, images) => {

  const category = await Category.findOne(
    { name: arrCategoryName[getRandomInt(arrCategoryName.length)] });

  const attributes = await Attribute.find({ category: category.id });
  const attributesSelected = attributes.map(attr => ({
    attribute: attr.id,
    selected: attr.options[getRandomInt(attr.options.length)],
  }));

  if (images && images.length > 0) {
    images = images.map((img, idx) => ({
      rank: idx + 1,
      relative_url: img,
    }));
  } else {
    images = [
      {
        relative_url: `shop/${shop.id}/test`,
      },
    ];
  }

  const product = await Product.create({
    shop: shop.id,
    title: faker.commerce.productName(),
    description: faker.commerce.productDescription(),
    who_made: productWhoMade[getRandomInt(productWhoMade.length)],
    state: 'inactive',
    category: category.id,
    attributes: attributesSelected,
    images,
  });

  return product;
};

const initProductNonVariant = async (shop, images) => {

  const product = await initBaseProduct(shop, images);

  const inventory = await ProductInventory.create({
    shop: shop.id,
    product: product.id,
    stock: faker.commerce.price({ min: 0, max: PRODUCT_CONFIG.MAX_STOCK }),
    price: faker.commerce.price({
      min: PRODUCT_CONFIG.MIN_PRICE,
      max: PRODUCT_CONFIG.MAX_PRICE,
    }),
    // sku,
  });

  await product.updateOne({
    inventory: inventory.id,
    variant_type: PRODUCT_VARIANT_TYPES.NONE,
  });
};

const initProductSingleVariant = async (shop, images) => {

  const product = await initBaseProduct(shop, images);

  const prodVariantsIds: string[] = [];

  const variants = [
    {
      variant_name: 'Black',
    },
    {
      variant_name: 'Red',
    },
  ];

  await Promise.all(
    variants.map(async (variant) => {
      const invProdVar = await ProductInventory.create({
        shop: shop.id,
        product: product.id,
        variant: variant.variant_name,
        stock: faker.commerce.price({
          min: 0,
          max: PRODUCT_CONFIG.MAX_STOCK,
        }),
        price: faker.commerce.price({
          min: PRODUCT_CONFIG.MIN_PRICE,
          max: PRODUCT_CONFIG.MAX_PRICE,
        }),
        sku: variant?.sku,
      });

      const prodVar = await ProductVariant.create({
        product: product.id,
        inventory: invProdVar.id,
        variant_name: variant.variant_name,
        variant_options: [],
      });
      prodVariantsIds.push(prodVar.id);
    })
  );

  await product.updateOne({
    variant_type: PRODUCT_VARIANT_TYPES.SINGLE,
    variant_group_name,
    variants: prodVariantsIds,
  });
};

const initProductCombineVariant = async (shop, images) => {

  const product = await initBaseProduct(shop, images);

  const productVariantsIds: string[] = [];

  const variants = [
    {
      variant_name: 'Black',
      variant_options: [
        {
          variant: null,
          variant_name: 'S',
        },
        {
          variant: null,
          variant_name: 'M',
        },
      ],
    },
    {
      variant_name: 'Red',
      variant_options: [
        {
          variant: null,
          variant_name: 'S',
        },
        {
          variant: null,
          variant_name: 'M',
        },
      ],
    },
  ];

  const cacheVariantName = new Map();

  await Promise.all(
    variants[0].variant_options.map(async variantOption => {
      const productVariantCreated = await ProductVariant.create({
        product: product.id,
        variant_name: variantOption.variant_name,
      });
      cacheVariantName.set(variantOption.variant_name, productVariantCreated.id);
    })
  );

  await Promise.all(
    variants.map(async (variant) => {
      await Promise.all(
        variant.variant_options.map(async (variantOption) => {

          if (cacheVariantName.has(variantOption.variant_name)) {
            variantOption.variant = cacheVariantName.get(variantOption.variant_name);
          }

          const productInventoryCreated = await ProductInventory.create({
            shop: shop.id,
            product: product.id,
            variant: variant.variant_name + '-' + variantOption.variant_name,
            stock: faker.commerce.price({
              min: 0,
              max: PRODUCT_CONFIG.MAX_STOCK,
            }),
            price: faker.commerce.price({
              min: PRODUCT_CONFIG.MIN_PRICE,
              max: PRODUCT_CONFIG.MAX_PRICE,
            }),
            sku: variantOption?.sku,
          });
          variantOption.inventory = productInventoryCreated.id;
        })
      );

      const productVariantCreated = await ProductVariant.create({
        product: product.id,
        variant_name: variant.variant_name,
        variant_options: variant.variant_options,
      });
      productVariantsIds.push(productVariantCreated.id);
    })
  );

  await product.updateOne({
    variant_type: PRODUCT_VARIANT_TYPES.COMBINE,
    variant_group_name,
    variant_sub_group_name,
    variants: productVariantsIds,
  });
};

export async function generateProductsDB(shops) {

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
      const images = fromObjectKeys.slice(from, to);

      products.push(
        i === 0 ?
          initProductNonVariant(shop, images) :
          i === 1 ?
            initProductCombineVariant(shop, images) :
            initProductSingleVariant(shop, images));
    }
  }
  await Promise.all(products);
}
