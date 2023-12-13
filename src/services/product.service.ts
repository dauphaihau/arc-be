import { StatusCodes } from 'http-status-codes';
import {
  ClientSession, FilterQuery, Schema, QueryOptions
} from 'mongoose';
import {
  CreateProductPayload,
  UpdateProductPayload, IProductAttribute
} from '@/interfaces/models/product';
import { Product } from '@/models';
import { ApiError } from '@/utils';
import { getValidKeysAttrByCategory } from '@/schema';

const validateAttributes = (attributes: IProductAttribute) => {
  const keysValid = getValidKeysAttrByCategory(attributes.category);
  const keyInvalid: string[] = [];
  Object.keys(attributes).forEach((key) => {
    if (!keysValid.includes(key)) {
      keyInvalid.push(key);
    }
  });
  if (keyInvalid.length) {
    throw new ApiError(StatusCodes.BAD_REQUEST, `keys of attributes invalid: ${keyInvalid.join(', ')}`);
  }
};

const getProductById = async <T>(id: T) => {
  return Product.findById(id);
};

const updateProduct = async <T>(productId: T, updateBody: UpdateProductPayload) => {
  const product = await getProductById(productId);
  if (!product) throw new ApiError(StatusCodes.NOT_FOUND, 'Product not found');

  if (updateBody?.attributes) {
    validateAttributes(updateBody.attributes);
  }

  Object.assign(product, updateBody);
  await product.save();
  return product;
};

const createProduct = async (payload: CreateProductPayload, session: ClientSession) => {
  validateAttributes(payload.attributes);
  const product = await Product.create([payload], { session });
  return product[0];
};

/**
 * Query for products
 * @param {Object} filter - Mongo filter
 * @param {Object} options - Query options
 * @param {string} [options.sortBy] - Sort option in the format: sortField:(desc|asc)
 * @param {number} [options.limit] - Maximum number of results per page (default = 10)
 * @param {number} [options.page] - Current page (default = 1)
 * @returns {Promise<QueryResult>}
 */
const queryProducts = async (filter: FilterQuery<Schema>, options: QueryOptions) => {
  const products = await Product.paginate(filter, options);
  return products;
};

const deleteProductById = async <T>(productId: T, session: ClientSession) => {
  const product = await getProductById(productId);
  if (!product) throw new ApiError(StatusCodes.NOT_FOUND, 'Product not found');
  await product.remove({ session });
};

export const productService = {
  createProduct,
  getProductById,
  queryProducts,
  deleteProductById,
  updateProduct,
};
