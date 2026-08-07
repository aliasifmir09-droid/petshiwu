import Product from '../models/Product';
import { getCouponDiscount } from './couponService';
import type { NormalizedOrderItem } from '../types/common';

export const TAX_RATE = 0.08;
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
  session?: any
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
      name: product.name,
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
  const shippingPrice = itemsPrice >= FREE_SHIPPING_THRESHOLD ? 0 : STANDARD_SHIPPING_COST;
  const taxPrice = Number((itemsPrice * TAX_RATE).toFixed(2));
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
