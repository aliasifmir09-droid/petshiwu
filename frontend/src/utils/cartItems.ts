import { CartItem } from '@/types';
import { normalizeId } from '@/utils/idNormalizer';

export const cartLineKey = (item: CartItem): string => {
  const id = normalizeId(item?.product?._id) || String(item?.product?._id || '');
  return `${id}::${item?.variant?.sku || ''}`;
};

export const cartLinePrice = (item: CartItem): number => {
  const raw = item?.variant?.price ?? item?.product?.basePrice ?? (item?.product as { price?: number } | undefined)?.price ?? 0;
  const price = Number(raw);
  return Number.isFinite(price) ? price : 0;
};

export const cartLineQuantity = (item: CartItem): number => {
  const quantity = Number(item?.quantity);
  return Number.isFinite(quantity) && quantity > 0 ? quantity : 0;
};

export const cloneCartItems = (items: CartItem[]): CartItem[] =>
  (Array.isArray(items) ? items : []).map((item) => ({
    ...item,
    product: item.product,
    variant: item.variant ? { ...item.variant } : item.variant,
    quantity: cartLineQuantity(item),
  }));

/** True when ids, SKUs, quantities, and unit prices match in order. */
export const cartSnapshotsEqual = (left: CartItem[], right: CartItem[]): boolean => {
  if (left === right) return true;
  if (!Array.isArray(left) || !Array.isArray(right) || left.length !== right.length) return false;
  for (let index = 0; index < left.length; index += 1) {
    if (cartLineKey(left[index]) !== cartLineKey(right[index])) return false;
    if (cartLineQuantity(left[index]) !== cartLineQuantity(right[index])) return false;
    if (cartLinePrice(left[index]) !== cartLinePrice(right[index])) return false;
  }
  return true;
};
