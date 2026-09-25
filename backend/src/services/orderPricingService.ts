import Product from '../models/Product';
import { getCouponDiscount, isFreeShippingCoupon } from './couponService';
import type { NormalizedOrderItem } from '../types/common';
import { decodeHtmlEntities } from '../utils/catalogText';
import { normalizeShippingState } from '../utils/nycDelivery';

/**
 * Destination-based sales tax: the rate follows the SHIPPING address state.
 * NY 8.875% (physical presence: Jackson Heights store — 4% state + 4.5% city + 0.375% MCTD).
 * NJ 6.625% statewide. CT 6.35% statewide.
 * States outside the delivery zone have no nexus and no sales — 0%.
 */
export const TAX_RATES_BY_STATE: Record<string, number> = {
  NY: 0.08875,
  NJ: 0.06625,
  CT: 0.0635,
};
export const DEFAULT_TAX_RATE = 0;

export function getTaxRateForState(state?: string): number {
  if (!state) return DEFAULT_TAX_RATE;
  return TAX_RATES_BY_STATE[normalizeShippingState(state)] ?? DEFAULT_TAX_RATE;
}

export const FREE_SHIPPING_THRESHOLD = 49;
export const STANDARD_SHIPPING_COST = 6;

interface PricingItemInput {
  product: string;
  name?: string;
  image?: string;
  price?: number;
  quantity: number;
  variant?: {
    sku?: string;
    size?: string;
    weight?: string;
  };
}

export interface TrustedOrderPricing {
  items: NormalizedOrderItem[];
  itemsPrice: number;
  shippingPrice: number;
  taxPrice: number;
  discountAmount: number;
  donationAmount: number;
  totalPrice: number;
}

const decodeSku = (value: string) => value
  .replace(/&amp;amp;/g, '&')
  .replace(/&amp;/g, '&')
  .replace(/&#039;/g, "'")
  .replace(/&quot;/g, '"');

export const calculateTrustedOrderPricing = async (
  items: PricingItemInput[],
  couponCode?: string,
  donationAmount = 0,
  session?: any,
  shippingState?: string
): Promise<TrustedOrderPricing> => {
  const trustedItems: NormalizedOrderItem[] = [];

  for (const item of items) {
    const product = session
      ? await Product.findById(item.product).session(session)
      : await Product.findById(item.product);

    if (!product) throw new Error(`Product ${item.name || item.product} not found`);
    if (!product.inStock) throw new Error(`Product "${product.name}" is currently out of stock`);

    const requestedSku = item.variant?.sku;
    const normalizedSku = requestedSku ? decodeSku(requestedSku) : undefined;
    const variant = normalizedSku
      ? product.variants.find((candidate) => (
        candidate.sku === requestedSku ||
        candidate.sku === normalizedSku ||
        decodeSku(candidate.sku || '') === normalizedSku
      ))
      : undefined;

    if (requestedSku && !variant) {
      throw new Error(`Variant ${requestedSku} is no longer available for product "${product.name}"`);
    }

    const quantity = Number(item.quantity);
    if (!Number.isInteger(quantity) || quantity < 1) throw new Error(`Invalid quantity for product "${product.name}"`);
    if (variant && variant.stock < quantity) {
      throw new Error(`Insufficient stock for variant "${variant.sku}" of product "${product.name}"`);
    }
    if (!variant && product.totalStock < quantity) {
      throw new Error(`Insufficient stock for product "${product.name}"`);
    }

    const price = Number(variant?.price ?? product.basePrice);
    if (!Number.isFinite(price) || price < 0) throw new Error(`Invalid price for product "${product.name}"`);

    trustedItems.push({
      product: String(product._id),
      name: decodeHtmlEntities(product.name),
      image: product.images?.[0] || item.image || '',
      price,
      quantity,
      variant: variant
        ? {
          sku: variant.sku,
          size: variant.size,
        }
        : undefined
    });
  }

  const itemsPrice = Number(trustedItems.reduce((sum, item) => sum + item.price * item.quantity, 0).toFixed(2));
  const shippingPrice = itemsPrice >= FREE_SHIPPING_THRESHOLD || isFreeShippingCoupon(couponCode)
    ? 0
    : STANDARD_SHIPPING_COST;
  const taxPrice = Number((itemsPrice * getTaxRateForState(shippingState)).toFixed(2));
  const discountAmount = getCouponDiscount(couponCode, itemsPrice);
  const safeDonationAmount = Number.isFinite(Number(donationAmount)) && Number(donationAmount) > 0
    ? Number(Number(donationAmount).toFixed(2))
    : 0;
  const totalPrice = Number(Math.max(0, itemsPrice + shippingPrice + taxPrice + safeDonationAmount - discountAmount).toFixed(2));

  return {
    items: trustedItems,
    itemsPrice,
    shippingPrice,
    taxPrice,
    discountAmount,
    donationAmount: safeDonationAmount,
    totalPrice
  };
};
