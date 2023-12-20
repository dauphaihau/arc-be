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
  NUMBER_OF_PRODUCTS = 'number_of_products',
  ORDER_TOTAL = 'order_total'
}

export const COUPONS_MAX_USE_PER_ORDER = 2;

export const couponAppliesTo = Object.values(COUPON_APPLIES_TO);
export const couponTypes = Object.values(COUPON_TYPES);
export const couponMinOrderTypes = Object.values(COUPON_MIN_ORDER_TYPES);
