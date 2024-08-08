import { model, Schema } from 'mongoose';
import { CART_CONFIG } from '@/config/enums/cart';
import { PRODUCT_CONFIG } from '@/config/enums/product';
import {
  ICartDoc,
  ICartModel,
  IShopCart,
  IProductCart
} from '@/interfaces/models/cart';
import { toJSON } from '@/models/plugins';

const productCartSchema = new Schema<IProductCart>(
  {
    product: {
      type: Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
    },
    inventory: {
      type: Schema.Types.ObjectId,
      ref: 'product_inventory',
      required: true,
    },
    quantity: {
      type: Number,
      max: PRODUCT_CONFIG.MAX_STOCK,
      required: true,
    },
    is_select_order: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: {
      createdAt: 'created_at',
      updatedAt: 'updated_at',
    },
  }
);

// Define shop cart schema
const shopCartSchema = new Schema<IShopCart>(
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
    timestamps: {
      createdAt: 'created_at',
      updatedAt: 'updated_at',
    },
  }
);

// Define cart schemas
const cartSchema = new Schema<ICartDoc, ICartModel>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    // shop_carts
    items: {
      type: [shopCartSchema],
      default: [],
      validate(val: ICartDoc['items']) {
        if (val.length > CART_CONFIG.MAX_SHOP_CART) {
          throw new Error('size is invalid');
        }
      },
    },
    is_temp: {
      type: Boolean,
      default: false,
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
cartSchema.plugin(toJSON);
shopCartSchema.plugin(toJSON);
productCartSchema.plugin(toJSON);

export const Cart: ICartModel = model<ICartDoc, ICartModel>('Cart', cartSchema);
