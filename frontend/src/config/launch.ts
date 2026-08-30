/** First moment Petshiwu takes customer orders (Eastern Time). */
export const ORDERS_OPEN_AT = new Date('2026-08-20T12:00:00-04:00');
export const ORDERS_OPEN_LABEL = 'now';

export function areOrdersOpen(now: Date = new Date()): boolean {
  return now.getTime() >= ORDERS_OPEN_AT.getTime();
}
