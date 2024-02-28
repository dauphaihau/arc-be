export const COUPON_CONFIG = {
  MIN_CHAR_CODE: 6,
  MAX_CHAR_CODE: 12,
  MIN_CHAR_TITLE: 2,
  MAX_CHAR_TITLE: 50,
  MAX_USE_PER_ORDER: 2,
  MIN_USES_PER_USER: 1,
  MAX_USES_PER_USER: 5,
};

export enum COUPON_APPLIES_TO {
  ALL = 'all',
  SPECIFIC = 'specific'
}

export enum COUPON_TYPES {
  FIXED_AMOUNT = 'fixed_amount',
  PERCENTAGE = 'percentage',
  FREE_SHIP = 'free_ship'
}

export enum COUPON_MIN_ORDER_TYPES {
  NONE = 'none',
  NUMBER_OF_PRODUCTS = 'number_of_products',
  ORDER_TOTAL = 'order_total'
}

export const COUPONS_MAX_USE_PER_ORDER = 2;
