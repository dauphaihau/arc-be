export enum PRODUCT_CATEGORIES {
  ELECTRONIC = 'electronic',
  CLOTHING = 'clothing',
  HOME = 'home'
  // FURNITURE = 'furniture'
}

export enum PRODUCT_STATES {
  ACTIVE = 'active', // currently for sale.
  INACTIVE = 'inactive', // When updating a product
  DRAFT = 'draft', //  if product in any other state cannot be moved to draft
  REMOVED = 'removed', // product has been removed by its owner.
  // SOLD_OUT = 'sold_out',
  // EXPIRED = 'expired',
  UNAVAILABLE = 'unavailable' // The Product has been removed by Arc admin for unspecified reasons. Products in this state may be missing some information which is normally required.
}

export enum PRODUCT_WHO_MADE {
  I_DID = 'i_did',
  COLLECTIVE = 'collective',
  SOMEONE_ELSE = 'someone_else'
}

export enum PRODUCT_ATTR_CLOTHING_SIZE { S = 'S', M = 'M', L = 'L', XL = 'XL' }

export enum PRODUCT_ATTR_CLOTHING_GENDER { MALE = 'male', FEMALE = 'female' }

export enum PRODUCT_ATTR_COLORS {
  BLACK= 'black',
  WHITE = 'white',
  RED = 'red',
  YELLOW = 'yellow',
  BLUE = 'blue',
  GREEN = 'green'
}


export const PRODUCT_MAX_IMAGES = 10;
export const PRODUCT_MAX_PRICE = 50000;
export const PRODUCT_MAX_QUANTITY = 10000000;

export const PRODUCT_REG_SLUG = /^[a-z0-9]+(?:(?:-|_)+[a-z0-9]+)*$/;
export const PRODUCT_REG_NOT_URL = /^(?!http.*$).*/;

export const productCategories = Object.values(PRODUCT_CATEGORIES);
export const productStates = Object.values(PRODUCT_STATES);
export const productWhoMade = Object.values(PRODUCT_WHO_MADE);
