import { StatusCodes } from 'http-status-codes';
import { ClientSession } from 'mongoose';
import { ApiError } from '@/utils';
import { IOrderDoc } from '@/interfaces/models/order';
import { IProductInventory } from '@/interfaces/models/product';
import {
  CreateInventoryBody,
  UpdateInventoryBody,
  ReservationInventoryBody
} from '@/interfaces/request/product';
import { ProductInventory } from '@/models';

const insertInventory = async (body: CreateInventoryBody, session: ClientSession) => {
  const inventory = await ProductInventory.create([body], { session });
  return inventory[0];
};

const getById = async (id: IProductInventory['id']) => {
  return ProductInventory.findById(id);
};

const updateStock = async (
  { shop, product, stock }: UpdateInventoryBody,
  session: ClientSession
) => {
  const filter = { shop, product };
  const update = { stock };
  return ProductInventory.updateOne(filter, update, { session });
};

const reserveQuantity = async (
  payload: ReservationInventoryBody,
  session: ClientSession
) => {
  const { inventory_id, quantity, order_id } = payload;

  const filter = {
    _id: inventory_id,
    // stock: { $gte: quantity },
  };
  const update = {
    $inc: {
      stock: -quantity,
    },
    $push: {
      reservations: {
        order: order_id,
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
  order: IOrderDoc,
  orderShops: IOrderDoc[],
  session: ClientSession
) => {
  const promises: unknown[] = [];

  orderShops.forEach((orderShop) => {
    orderShop.products.forEach((prod) => {
      promises.push(
        ProductInventory.findOneAndUpdate(
          {
            _id: prod.inventory,
            // shop: order.shop,
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

export const productInventoryService = {
  insertInventory,
  updateStock,
  reserveQuantity,
  clearProductsReversedByOrder,
  getById,
  minusStock,
};
