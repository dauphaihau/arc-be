import { ClientSession } from 'mongoose';
import {
  CreateInventoryPayload,
  UpdateInventoryPayload, ReservationInventoryPayload, IProductInventory
} from '@/interfaces/models/product';
import { ProductInventory } from '@/models';
// import { IClearProductsReverseByOrder } from '@/interfaces/models/order';

const insertInventory = async (payload: CreateInventoryPayload, session: ClientSession) => {
  const inventory = await ProductInventory.create([payload], { session });
  return inventory[0];
};

const getInventoryById = async (id: IProductInventory['id']) => {
  return ProductInventory.findById(id);
};

const updateStock = async (
  { shop, product, stock }: UpdateInventoryPayload,
  session: ClientSession
) => {
  const filter = { shop, product };
  const update = { stock };
  return ProductInventory.updateOne(filter, update, { session });
};

const reservationProduct = async (
  payload: ReservationInventoryPayload,
  session: ClientSession
) => {
  const {
    product, shop, quantity, order_id,
  } = payload;

  const filter = {
    product,
    shop,
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

  return ProductInventory.updateOne(filter, update, options);
};

// const clearProductsReverseByOrder = async (
//   order: IClearProductsReverseByOrder,
//   session: ClientSession
// ) => {
//   const { lines = [] } = order;
//   lines.forEach((item) => {
//     const { shop, products = [] } = item;
//     products.forEach(async (prod) => {
//       await ProductInventory.findOneAndUpdate(
//         {
//           shop,
//           product: prod.id,
//         },
//         {
//           $pull: {
//             reservations: { order_id: order.id },
//           },
//         },
//         { session }
//       );
//     });
//   });
// };


export const inventoryService = {
  insertInventory,
  updateStock,
  reservationProduct,
  // clearProductsReverseByOrder,
  getInventoryById,
};
