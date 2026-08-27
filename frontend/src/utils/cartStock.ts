import { Product, ProductVariant } from '@/types';

/**
 * How many units can go in the cart for this product/variant.
 * Listing payloads sometimes omit variant.stock even when the product is in stock.
 * Only treat a variant as sold out when stock is an explicit number <= 0.
 */
export const availableCartStock = (product?: Product | null, variant?: ProductVariant | null): number => {
  if (!product) return 0;
  if (variant && typeof variant.stock === 'number' && Number.isFinite(variant.stock)) {
    return Math.max(0, variant.stock);
  }
  if (typeof product.totalStock === 'number' && Number.isFinite(product.totalStock)) {
    return Math.max(0, product.totalStock);
  }
  return product.inStock ? 1 : 0;
};
