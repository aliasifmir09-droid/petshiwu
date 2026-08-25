import { Product, ProductVariant } from '@/types';

/** Turn stored petType values like "small pet" into URL-safe slugs. */
export const canonicalPetTypeSlug = (petType: unknown): string => {
  const slug = String(petType || '')
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-');
  if (slug === 'small-pet') return 'small-animal';
  return slug;
};

export const getValidCompareAtPrice = (
  price: number,
  compareAt?: number | null
): number | undefined => {
  const compare = Number(compareAt);
  if (!Number.isFinite(compare) || compare <= 0) return undefined;
  if (!Number.isFinite(price) || compare <= price) return undefined;
  return compare;
};

/**
 * Listing cards show basePrice (the featured size) but used to add variants[0]
 * to the cart. On 665 live products those prices differ, so the tile and cart
 * disagreed. Always add the variant that matches the price we display.
 */
export const getListingVariant = (product: Product): ProductVariant | undefined => {
  const variants = Array.isArray(product.variants) ? product.variants : [];
  if (variants.length === 0) return undefined;
  const base = Number(product.basePrice);
  const match = variants.find((variant) => Number(variant.price) === base);
  return match || variants[0];
};

export const getListingPrice = (product: Product): number => {
  const variant = getListingVariant(product);
  const price = Number(variant?.price ?? product.basePrice ?? 0);
  return Number.isFinite(price) ? price : 0;
};
