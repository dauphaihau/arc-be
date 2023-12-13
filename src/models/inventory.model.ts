import { Schema, model } from 'mongoose';
import { toJSON } from '@/models/plugins';
import { IInventory, IInventoryModel } from '@/interfaces/models/inventory';

const inventorySchema = new Schema<IInventory, IInventoryModel>(
  {
    product_id: {
      type: Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
    },
    shop_id: {
      type: Schema.Types.ObjectId,
      ref: 'Shop',
      required: true,
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

export const Inventory: IInventoryModel = model<IInventory, IInventoryModel>('Inventory', inventorySchema);
