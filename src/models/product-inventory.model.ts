import { Schema, model } from 'mongoose';
import { PRODUCT_CONFIG } from '@/config/enums/product';
import { toJSON } from '@/models/plugins';
import { IProductInventory, IProductInventoryModel } from '@/interfaces/models/product';

// define Schema
const productInventorySchema = new Schema<IProductInventory, IProductInventoryModel>(
  {
    shop: {
      type: Schema.Types.ObjectId,
      ref: 'Shop',
      required: true,
    },
    product: {
      type: Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
    },
    variant: {
      type: String,
    },
    stock: {
      type: Number,
      min: 0,
      max: PRODUCT_CONFIG.MAX_QUANTITY,
      required: true,
    },
    price: {
      type: Number,
      min: 0,
      max: PRODUCT_CONFIG.MAX_PRICE,
      required: true,
    },
    sku: {
      type: String,
      max: PRODUCT_CONFIG.MAX_CHAR_SKU,
    },
    reservations: {
      type: Schema.Types.Mixed,
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

// Plugins
productInventorySchema.plugin(toJSON);

export const ProductInventory: IProductInventoryModel = model<IProductInventory, IProductInventoryModel>('product_inventory', productInventorySchema);
