import { model, Schema } from 'mongoose';
import { CART_CONFIG } from '@/config/enums/cart';
import { PRODUCT_CONFIG } from '@/config/enums/product';
import {
  ICart,
  ICartModel,
  IItemCart,
  IProductCart
} from '@/interfaces/models/cart';
import { toJSON } from '@/models/plugins';

const productCartSchema = new Schema<IProductCart>(
  {
    inventory: {
      type: Schema.Types.ObjectId,
      ref: 'product_inventory',
      required: true,
    },
    variant: {
      type: Schema.Types.ObjectId,
      ref: 'product_variant',
    },
    quantity: {
      type: Number,
      max: PRODUCT_CONFIG.MAX_STOCK,
    },
    is_select_order: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Define item cart schemas
const itemCartSchema = new Schema<IItemCart>(
  {
    shop: {
      type: Schema.Types.ObjectId,
      ref: 'Shop',
      required: true,
    },
    products: {
      type: [productCartSchema],
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Define cart schemas
const cartSchema = new Schema<ICart, ICartModel>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    items: {
      type: [itemCartSchema],
      default: [],
      max: CART_CONFIG.MAX_ITEMS,
    },
    // count_products: {
    //   type: Number,
    //   default: 0,
    //   max: 20,
    // },
  },
  {
    timestamps: true,
  }
);

// Plugins
cartSchema.plugin(toJSON);
itemCartSchema.plugin(toJSON);
productCartSchema.plugin(toJSON);

export const Cart: ICartModel = model<ICart, ICartModel>('Cart', cartSchema);
