import { Schema, z } from 'zod';
import { zodKeys } from '@/utils';
import {
  PRODUCT_CATEGORIES,
  // PRODUCT_ATTR_CLOTHING_SIZE,
  // PRODUCT_ATTR_COLORS,
  // PRODUCT_ATTR_CLOTHING_GENDER,
  PRODUCT_ATTR_CLOTHING_TYPES,
  PRODUCT_ATTR_CLOTHING_GENDER, PRODUCT_ATTR_CLOTHING_SHAPES
} from '@/config/enums/product';

const baseAttributeSchema = z.object({
  // manufacturer: z.string().min(2),
  brand: z.string().min(2),
  // model_number: z.string().min(2),
  // material: z.array(z.string().min(2)).min(1),
  // package_dimensions: z.string().min(30), //  4.49 x 4.41 x 3.7 inches; 12.31 Ounces
  // weigh: z.string().min(2), // 3.41 pounds
  // color: z.array(z.string().min(2)).min(1),
  // colors: z.array(z.nativeEnum(PRODUCT_ATTR_COLORS)).min(1),
});

export const electronicSchema = z.object({
  category: z.literal(PRODUCT_CATEGORIES.ELECTRONIC),
  batteries: z.string(),
  series: z.string(),
});

export const clothingSchema = z.object({
  category: z.literal(PRODUCT_CATEGORIES.CLOTHING),
  type: z.nativeEnum(PRODUCT_ATTR_CLOTHING_TYPES),
  shape: z.nativeEnum(PRODUCT_ATTR_CLOTHING_SHAPES),
  gender: z.nativeEnum(PRODUCT_ATTR_CLOTHING_GENDER),
});

const conditionsSchema = z.discriminatedUnion('category', [
  electronicSchema,
  clothingSchema,
]);

const categories: { [key: string]: Schema } = {
  clothing: clothingSchema,
  electronic: electronicSchema,
};

// export const productAttributeSchema = clothingSchema;
export const productAttributeSchema = z.intersection(conditionsSchema, baseAttributeSchema);

export const getValidKeysAttrByCategory = (category: string) => {
  const baseKeysAttribute = zodKeys(baseAttributeSchema);
  const categoryKeys = zodKeys(categories[category]);
  return [...baseKeysAttribute, ...categoryKeys];
};
