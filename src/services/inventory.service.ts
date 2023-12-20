// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheckk
import { ClientSession } from 'mongoose';
import {
  CreateInventoryPayload,
  UpdateInventoryPayload, ReservationInventoryPayload
} from '@/interfaces/models/inventory';
import { Inventory } from '@/models';
import { IClearProductsReverseByOrder } from '@/interfaces/models/order';

const insertInventory = async (payload: CreateInventoryPayload, session: ClientSession) => {
  const inventory = await Inventory.create([payload], { session });
  return inventory[0];
};

const updateStock = async (
  { shop_id, product_id, stock }: UpdateInventoryPayload,
  session: ClientSession
) => {
  const filter = { shop_id, product_id };
  const update = { stock };
  return Inventory.updateOne(filter, update, { session });
};

const reservationProduct = async (
  payload: ReservationInventoryPayload,
  session: ClientSession
) => {
  const {
    product_id, shop_id, quantity, order_id,
  } = payload;

  const filter = {
    product_id,
    shop_id,
    stock: { $gte: quantity },
  };
  const update = {
    $inc: {
      stock: -quantity,
    },
    $push: {
      reservations: {
        order_id,
        quantity,
        createOn: new Date(),
      },
    },
  };
  const options = { upsert: false, new: true, session };

  return Inventory.updateOne(filter, update, options);
};

const clearProductsReverseByOrder = async (
  order: IClearProductsReverseByOrder,
  session: ClientSession
) => {
  const { lines = [] } = order;
  lines.forEach((item) => {
    const { shop_id, products = [] } = item;
    products.forEach(async (prod) => {
      await Inventory.findOneAndUpdate(
        {
          shop_id,
          product_id: prod.id,
        },
        {
          $pull: {
            reservations: { order_id: order.id },
          },
        },
        { session }
      );
    });
  });
};


export const inventoryService = {
  insertInventory,
  updateStock,
  reservationProduct,
  clearProductsReverseByOrder,
};
