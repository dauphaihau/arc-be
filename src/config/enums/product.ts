export enum PRODUCT_CATEGORIES {
  ELECTRONIC = 'electronic',
  CLOTHING = 'clothing',
  FURNITURE = 'furniture'
}

export enum PRODUCT_STATES {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  SOLD_OUT = 'sold_out',
  DRAFT = 'draft',
  EXPIRED = 'expired'
}
export enum PRODUCT_WHO_MADE {
  I_DID = 'i_did',
  COLLECTIVE = 'collective',
  SOMEONE_ELSE = 'someone_else'
}

export const productCategories = Object.values(PRODUCT_CATEGORIES);
export const productStates = Object.values(PRODUCT_STATES);
export const productWhoMade = Object.values(PRODUCT_WHO_MADE);
