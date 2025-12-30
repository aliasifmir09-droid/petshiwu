/**
 * Application-wide constants
 * Centralizes magic strings and values for better maintainability
 */

export const ORDER_STATUS = {
  PENDING: 'pending',
  PROCESSING: 'processing',
  SHIPPED: 'shipped',
  DELIVERED: 'delivered',
  CANCELLED: 'cancelled',
} as const;

export type OrderStatus = typeof ORDER_STATUS[keyof typeof ORDER_STATUS];

export const PAYMENT_STATUS = {
  PENDING: 'pending',
  PAID: 'paid',
  FAILED: 'failed',
  REFUNDED: 'refunded',
} as const;

export type PaymentStatus = typeof PAYMENT_STATUS[keyof typeof PAYMENT_STATUS];

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  [ORDER_STATUS.PENDING]: 'Pending',
  [ORDER_STATUS.PROCESSING]: 'Processing',
  [ORDER_STATUS.SHIPPED]: 'Shipped',
  [ORDER_STATUS.DELIVERED]: 'Delivered',
  [ORDER_STATUS.CANCELLED]: 'Cancelled',
};

export const ORDER_STATUS_COLORS: Record<OrderStatus, { bg: string; text: string }> = {
  [ORDER_STATUS.PENDING]: { bg: 'bg-gray-100', text: 'text-gray-800' },
  [ORDER_STATUS.PROCESSING]: { bg: 'bg-yellow-100', text: 'text-yellow-800' },
  [ORDER_STATUS.SHIPPED]: { bg: 'bg-blue-100', text: 'text-blue-800' },
  [ORDER_STATUS.DELIVERED]: { bg: 'bg-green-100', text: 'text-green-800' },
  [ORDER_STATUS.CANCELLED]: { bg: 'bg-red-100', text: 'text-red-800' },
};

export const PAYMENT_STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  [PAYMENT_STATUS.PENDING]: { bg: 'bg-yellow-100', text: 'text-yellow-800' },
  [PAYMENT_STATUS.PAID]: { bg: 'bg-green-100', text: 'text-green-800' },
  [PAYMENT_STATUS.FAILED]: { bg: 'bg-red-100', text: 'text-red-800' },
  [PAYMENT_STATUS.REFUNDED]: { bg: 'bg-gray-100', text: 'text-gray-800' },
};

/**
 * Validates if a string is a valid order status
 */
export const isValidOrderStatus = (status: string): status is OrderStatus => {
  return Object.values(ORDER_STATUS).includes(status as OrderStatus);
};

/**
 * Validates if a string is a valid payment status
 */
export const isValidPaymentStatus = (status: string): status is PaymentStatus => {
  return Object.values(PAYMENT_STATUS).includes(status as PaymentStatus);
};

