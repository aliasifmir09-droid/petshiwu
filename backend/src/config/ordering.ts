/**
 * Keep true until storefront polish is live and we are ready to take payment.
 * When flipping to false, checkout payment routes in orders.ts accept orders again.
 */
export const ORDERING_PAUSED = true;

export const ORDERING_PAUSED_MESSAGE =
  'We will start accepting orders soon. Browse the shop and check back shortly — checkout is paused while we finish a few last details.';
