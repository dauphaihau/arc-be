import { Model, Document } from 'mongoose';
import { z } from 'zod';
import {
  productAttributeSchema,
  productSchema,
  productImageSchema,
  productVariantSchema,
  productInventorySchema,
  productVariantOptSchema,
  productInventoryReservationSchema
} from '@/schemas';
import {
  productShippingSchema,
  standardShippingSchema
} from '@/schemas/product-shipping.schema';

export type IProduct = z.infer<typeof productSchema>;
export type IProductDoc = IProduct & Document;

export type IProductInventory = z.infer<typeof productInventorySchema> & Document;
export type IProductVariant = z.infer<typeof productVariantSchema>;
export type IProductShipping = z.infer<typeof productShippingSchema> & Document;
export type IProductImage = z.infer<typeof productImageSchema>;
export type IProductVariantOpt = z.infer<typeof productVariantOptSchema>;
export type IProductAttribute = z.infer<typeof productAttributeSchema>;
export type IProductStandardShipping = z.infer<typeof standardShippingSchema>;
export type IProductInventoryReservation = z.infer<typeof productInventoryReservationSchema>;

export interface IProductModel extends Model<IProductDoc, unknown> {
}

export interface IProductShippingModel extends Model<IProductShippingModel, unknown> {}
export interface IProductInventoryModel extends Model<IProductInventory, unknown> {}
