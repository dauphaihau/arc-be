import { model, Schema } from 'mongoose';
import { ICart, ICartModel } from '@/interfaces/models/cart';
import { toJSON } from '@/models/plugins';

// define Schema
const cartSchema = new Schema<ICart, ICartModel>(
  {
    user_id: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    products: {
      type: [
        {
          product_id: Schema.Types.ObjectId,
          quantity: Number,
          is_select_order: {
            type: Boolean,
            default: true,
          },
        },
      ],
      max: 20,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Plugins
cartSchema.plugin(toJSON);

export const Cart: ICartModel = model<ICart, ICartModel>('Cart', cartSchema);
