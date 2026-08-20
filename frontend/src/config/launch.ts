/** First moment Petshiwu takes customer orders (Eastern Time). */
export const ORDERS_OPEN_AT = new Date('2026-08-28T00:00:00-04:00');
export const ORDERS_OPEN_LABEL = 'August 28, 2026';

export function areOrdersOpen(now: Date = new Date()): boolean {
  return now.getTime() >= ORDERS_OPEN_AT.getTime();
}
