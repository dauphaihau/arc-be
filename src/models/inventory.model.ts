import { Schema, model } from 'mongoose';
import { toJSON } from '@/models/plugins';
import { IProductInventory, IProductInventoryModel } from '@/interfaces/models/product';

// define Schema
const inventorySchema = new Schema<IProductInventory, IProductInventoryModel>(
  {
    product: {
      type: Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
    },
    shop: {
      type: Schema.Types.ObjectId,
      ref: 'Shop',
      required: true,
    },
    variant: {
      type: String,
    },
    stock: {
      type: Number,
      required: true,
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
inventorySchema.plugin(toJSON);

export const Inventory: IProductInventoryModel = model<IProductInventory, IProductInventoryModel>('Inventory', inventorySchema);
