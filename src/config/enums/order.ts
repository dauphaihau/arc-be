export enum ORDER_STATUSES {
  CANCELED = 'canceled',
  PENDING = 'pending',
  AWAITING_PAYMENT = 'awaiting_payment',
  EXPIRED = 'expired', // expired link checkout session stripe
  PAID = 'paid',
  SHIPPED = 'shipped',
  IN_TRANSIT = 'in_transit',
  DELIVERED = 'delivered',
  REFUNDED = 'refunded',
  COMPLETED = 'completed', // order has been shipped/picked up, and receipt is confirmed; user has paid
  ARCHIVED = 'archived'
}

export enum PAYMENT_TYPES {
  CASH = 'cash',
  CARD = 'card'
}

export const SHIPPING_FEE_PERCENT = 5 / 100; // suppose 5% is standard

export const paymentTypes = Object.values(PAYMENT_TYPES);
export const orderStatuses = Object.values(ORDER_STATUSES);
