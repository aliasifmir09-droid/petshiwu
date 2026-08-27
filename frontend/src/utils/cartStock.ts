import { Product, ProductVariant } from '@/types';

/**
 * How many units can go in the cart for this product/variant.
 * Listing payloads sometimes omit variant.stock, and some documents keep
 * inStock true while totalStock is 0. Only treat a variant as sold out when
 * stock is an explicit number <= 0.
 */
export const availableCartStock = (product?: Product | null, variant?: ProductVariant | null): number => {
  if (!product) return 0;
  if (variant && typeof variant.stock === 'number' && Number.isFinite(variant.stock)) {
    return Math.max(0, variant.stock);
  }
  if (typeof product.totalStock === 'number' && Number.isFinite(product.totalStock) && product.totalStock > 0) {
    return product.totalStock;
  }
  return product.inStock ? 1 : 0;
};
