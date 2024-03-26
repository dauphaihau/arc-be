export const PRODUCT_CONFIG = {
  MIN_CHAR_TITLE: 2,
  MAX_CHAR_TITLE: 10000,
  MIN_CHAR_DESCRIPTION: 2,
  MAX_CHAR_DESCRIPTION: 10000,
  MIN_IMAGES: 1,
  MAX_IMAGES: 10,
  MIN_PRICE: 0.2,
  MAX_PRICE: 50000,
  MIN_STOCK: 0,
  MAX_STOCK: 999,
  MAX_CHAR_VARIANT_GROUP_NAME: 14,
  MAX_CHAR_VARIANT_NAME: 20,
  MAX_CHAR_SKU: 100,
  MAX_TAGS: 11,
  MIN_CHAR_TAG: 2,
  MAX_CHAR_TAG: 21,
};

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

export enum PRODUCT_VARIANT_TYPES {
  NONE = 'none',
  SINGLE = 'single',
  COMBINE = 'combine'
}

export enum PRODUCT_SORT_BY {
  DESC = 'desc',
  PRICE_ASC = 'priceAsc',
  PRICE_DESC = 'priceDesc'
}

export const PRODUCT_REGEX_SLUG = /^[a-z0-9]+(?:(?:-|_)+[a-z0-9]+)*$/;
export const PRODUCT_REGEX_NOT_URL = /^(?!http.*$).*/;
