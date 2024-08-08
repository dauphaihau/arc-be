export enum ORDER_STATUSES {
  CANCELED = 'canceled',
  PENDING = 'pending',
  AWAITING_PAYMENT = 'awaiting_payment',
  EXPIRED = 'expired', // expired link checkout session stripe
  PAID = 'paid',
  REFUNDED = 'refunded',
  COMPLETED = 'completed', // order has been shipped/picked up, and receipt is confirmed; user has paid
  ARCHIVED = 'archived'
}

export enum ORDER_SHIPPING_STATUSES {
  PRE_TRANSIT = 'pre_transit',
  IN_TRANSIT = 'in_transit',
  SHIPPED = 'shipped',
  DELIVERED = 'delivered'
}

export enum PAYMENT_TYPES {
  CASH = 'cash',
  CARD = 'card'
}

export const ORDER_CONFIG = {
  MAX_CHAR_NOTE: 10000,
  MAX_ORDER_TOTAL: 999999.99, // USD
  MAX_PROMO_COUPONS: 2,
};

// applies on total_price each shop cart
export const PERCENT_SHIPPING_FEE_STANDARD = 5 / 100; // suppose 5% is standard

export const DAYS_SHIPPING_INTERNATIONAL = 10; // suppose 10 day

export const paymentTypes = Object.values(PAYMENT_TYPES);
export const orderStatuses = Object.values(ORDER_STATUSES);
