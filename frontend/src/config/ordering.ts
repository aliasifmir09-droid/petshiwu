/**
 * Emergency hold: checkout stays paused until storefront polish is live.
 * Set to false (and restore order routes) when Petshiwu is ready to take payment.
 */
export const ORDERING_PAUSED = true;

export const ORDERING_PAUSED_EYEBROW = 'A short pause';
export const ORDERING_PAUSED_HEADLINE = 'We will start accepting orders soon';
export const ORDERING_PAUSED_BODY =
  'We are finishing a few last details so your first Petshiwu delivery is accurate and on time. Keep browsing, save your cart, and check back shortly — checkout will open as soon as we are ready.';
export const ORDERING_PAUSED_SHORT =
  'Keep browsing — your cart stays saved, and checkout will open as soon as we are ready.';

/** Inventory badge. "Ready to ship" only after we actually take orders. */
export function inStockLabel(inStock: boolean): string {
  if (!inStock) return 'Out of stock';
  return ORDERING_PAUSED ? 'In catalog' : 'Ready to ship';
}

/** Cart still saves items while paused; the label must not sound like checkout is live. */
export function addToCartLabel(inStock: boolean): string {
  if (!inStock) return 'Out of stock';
  return ORDERING_PAUSED ? 'Save for checkout' : 'Add to cart';
}
