import { Schema, z } from 'zod';
import { zodKeys } from '@/utils';
import { PRODUCT_CATEGORIES } from '@/config/enums/product';

const baseAttributeSchema = z.object({
  manufacturer: z.string().min(2),
  brand: z.string().min(2),
  model_number: z.string().min(2),
  color: z.array(z.string().min(2)).min(1),
  weigh: z.string().min(2), // 3.41 pounds
  material: z.array(z.string().min(2)).min(1),
  package_dimensions: z.string().min(30), //  4.49 x 4.41 x 3.7 inches; 12.31 Ounces
});

export const electronicSchema = z.object({
  category: z.literal(PRODUCT_CATEGORIES.ELECTRONIC),
  batteries: z.string(),
  series: z.string(),
});

export const clothingSchema = z.object({
  category: z.literal(PRODUCT_CATEGORIES.CLOTHING),
  size: z.enum(['S', 'M', 'L', 'XL']),
  gender: z.enum(['male', 'female']),
});

export const furnitureSchema = z.object({
  category: z.literal(PRODUCT_CATEGORIES.FURNITURE),
  shape: z.string(), // round, circle
  room_type: z.string(), // bed_room
});

const conditionsSchema = z.discriminatedUnion('category', [
  electronicSchema,
  clothingSchema,
  furnitureSchema,
]);

const categories: { [key: string]: Schema } = {
  furniture: furnitureSchema,
  clothing: clothingSchema,
  electronic: electronicSchema,
};

export const productAttributeSchema = z.intersection(conditionsSchema, baseAttributeSchema);

export const getValidKeysAttrByCategory = (category: string) => {
  const baseKeysAttribute = zodKeys(baseAttributeSchema);
  const categoryKeys = zodKeys(categories[category]);
  return [...baseKeysAttribute, ...categoryKeys];
};
