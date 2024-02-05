import { StatusCodes } from 'http-status-codes';
import { ClientSession } from 'mongoose';
import { ApiError } from '@/utils';
import { IClearProductsReverseByOrder } from '@/interfaces/models/order';
import {
  CreateInventoryPayload,
  UpdateInventoryPayload, ReservationInventoryPayload, IProductInventory
} from '@/interfaces/models/product';
import { ProductInventory } from '@/models';

const insertInventory = async (payload: CreateInventoryPayload, session: ClientSession) => {
  const inventory = await ProductInventory.create([payload], { session });
  return inventory[0];
};

const getInventoryById = async (id: IProductInventory) => {
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
  const { inventoryId, quantity, order } = payload;

  const filter = {
    _id: inventoryId,
    // stock: { $gte: quantity },
  };
  const update = {
    $inc: {
      stock: -quantity,
    },
    $push: {
      reservations: {
        order,
        quantity,
      },
    },
  };
  const options = { upsert: false, new: true, session };

  return ProductInventory.updateOne(filter, update, options);
};

const minusStock = async (
  inventoryId: IProductInventory['id'],
  quantity: IProductInventory['stock'],
  session: ClientSession
) => {
  return ProductInventory.updateOne(
    { _id: inventoryId },
    {
      $inc: {
        stock: -quantity,
      },
    },
    { session }
  );
};

const clearProductsReversedByOrder = async (
  order: IClearProductsReverseByOrder,
  session: ClientSession
) => {
  const promises: unknown[] = [];

  order.lines.forEach((item) => {
    const { shop, products = [] } = item;
    products.forEach((prod) => {
      promises.push(
        ProductInventory.findOneAndUpdate(
          {
            _id: prod.inventory,
            shop,
          },
          {
            $pull: {
              reservations: { order: order.id },
            },
          },
          { session }
        )
      );
    });
  });

  const results = await Promise.allSettled(promises);
  results.forEach(rel => {
    if (rel.status === 'rejected') {
      throw new ApiError(
        StatusCodes.INTERNAL_SERVER_ERROR, 'error clear product reserved'
      );
    }
  });
};

export const inventoryService = {
  insertInventory,
  updateStock,
  reservationProduct,
  clearProductsReversedByOrder,
  getInventoryById,
  minusStock,
};
