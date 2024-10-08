import { Schema, model } from 'mongoose';
import { PRODUCT_CONFIG } from '@/config/enums/product';
import { toJSON } from '@/models/plugins';
import {
  IProductInventory,
  IProductInventoryModel,
  IProductInventoryReservation
} from '@/interfaces/models/product';

// define reserve Schema
const reserveSchema = new Schema<IProductInventoryReservation>(
  {
    order: {
      type: Schema.Types.ObjectId,
      ref: 'order',
    },
    quantity: {
      type: Number,
      default: 0,
    },
  },
  {
    _id: false,
    timestamps: {
      createdAt: 'created_at',
      updatedAt: false,
    },
  }
);

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
      min: PRODUCT_CONFIG.MIN_STOCK,
      max: PRODUCT_CONFIG.MAX_STOCK,
      required: true,
    },
    price: {
      type: Number,
      min: PRODUCT_CONFIG.MIN_PRICE,
      max: PRODUCT_CONFIG.MAX_PRICE,
      required: true,
    },
    sku: {
      type: String,
      maxlength: PRODUCT_CONFIG.MAX_CHAR_SKU,
    },
    reservations: {
      type: [reserveSchema],
    },
  },
  {
    timestamps: {
      createdAt: 'created_at',
      updatedAt: 'updated_at',
    },
  }
);

// Plugins
productInventorySchema.plugin(toJSON);

export const ProductInventory: IProductInventoryModel = model<IProductInventory, IProductInventoryModel>('product_inventory', productInventorySchema);
