export const REMINDER_WEEK_OPTIONS = [3, 4, 5, 6] as const;
export type ReminderWeeks = (typeof REMINDER_WEEK_OPTIONS)[number];

export const RESTOCK_MODES = ['ask', 'autoship'] as const;
export type RestockMode = (typeof RESTOCK_MODES)[number];

export const isValidReminderWeeks = (weeks: unknown): weeks is ReminderWeeks =>
  typeof weeks === 'number' && Number.isInteger(weeks) && (REMINDER_WEEK_OPTIONS as readonly number[]).includes(weeks);

export const isValidRestockMode = (mode: unknown): mode is RestockMode =>
  typeof mode === 'string' && (RESTOCK_MODES as readonly string[]).includes(mode);

export const normalizeRestockMode = (mode: unknown): RestockMode =>
  mode === 'autoship' ? 'autoship' : 'ask';

export const restockEmailPath = (mode: RestockMode = 'ask'): string =>
  mode === 'ask' ? '/restock?coupon=RESTOCK7' : '/restock?mode=autoship';

export const remindAtFromWeeks = (weeks: number, from: Date = new Date()): Date => {
  const remindAt = new Date(from);
  remindAt.setUTCDate(remindAt.getUTCDate() + weeks * 7);
  return remindAt;
};

export type BuyAgainOrderItem = {
  product?: unknown;
  name?: string;
  image?: string;
  price?: number;
  quantity?: number;
  variant?: { sku?: string };
};

export type BuyAgainOrder = {
  _id?: unknown;
  orderNumber?: string;
  orderStatus?: string;
  createdAt?: Date | string;
  totalPrice?: number;
  items?: BuyAgainOrderItem[];
};

export type BuyAgainRegular = {
  productId: string;
  sku?: string;
  name: string;
  image: string;
  lastPrice: number;
  lastQuantity: number;
  timesOrdered: number;
  lastOrderedAt: string;
};

const productIdOf = (product: unknown): string => {
  if (!product) return '';
  if (typeof product === 'string') return product;
  if (typeof product === 'object' && product !== null) {
    const rec = product as { _id?: unknown; id?: unknown };
    if (rec._id) return String(rec._id);
    if (rec.id) return String(rec.id);
  }
  return String(product);
};

export const customerOrderFilter = (userId: unknown, email?: string) => {
  const normalizedEmail = String(email || '').trim().toLowerCase();
  return {
    $or: [
      { user: userId },
      ...(normalizedEmail ? [{ guestEmail: normalizedEmail }] : []),
    ],
  };
};

export const aggregateBuyAgainItems = (orders: BuyAgainOrder[]): BuyAgainRegular[] => {
  const map = new Map<string, BuyAgainRegular>();
  for (const order of orders) {
    if (order.orderStatus === 'cancelled') continue;
    const orderedAt = order.createdAt ? new Date(order.createdAt).toISOString() : new Date(0).toISOString();
    for (const item of order.items || []) {
      const productId = productIdOf(item.product);
      if (!productId || productId === 'undefined' || productId === '[object Object]') continue;
      const sku = item.variant?.sku || undefined;
      const key = `${productId}::${sku || ''}`;
      const existing = map.get(key);
      if (!existing) {
        map.set(key, {
          productId,
          sku,
          name: item.name || 'Pet supply',
          image: item.image || '',
          lastPrice: Number(item.price) || 0,
          lastQuantity: Math.max(1, Number(item.quantity) || 1),
          timesOrdered: 1,
          lastOrderedAt: orderedAt,
        });
        continue;
      }
      existing.timesOrdered += 1;
      existing.lastQuantity = Math.max(1, Number(item.quantity) || existing.lastQuantity);
      existing.lastPrice = Number(item.price) || existing.lastPrice;
      existing.name = item.name || existing.name;
      existing.image = item.image || existing.image;
      if (orderedAt > existing.lastOrderedAt) existing.lastOrderedAt = orderedAt;
    }
  }
  return [...map.values()].sort((a, b) => {
    if (b.timesOrdered !== a.timesOrdered) return b.timesOrdered - a.timesOrdered;
    return b.lastOrderedAt.localeCompare(a.lastOrderedAt);
  });
};
