import { ClientSession } from 'mongoose';
import {
  CreateInventoryPayload,
  UpdateInventoryPayload
} from '@/interfaces/models/inventory';
import { Inventory } from '@/models';

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

export const inventoryService = {
  insertInventory,
  updateStock,
};
