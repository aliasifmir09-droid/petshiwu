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

/** Pet type sent to the products API (catalog uses small-pet, URLs use /small-animal). */
export const catalogPetType = (petType: unknown): string => {
  const slug = String(petType || '')
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-');
  if (slug === 'small-animal') return 'small-pet';
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

/** Known catalog photos that do not match the product on the live PDP. */
export const PRODUCT_IMAGE_OVERRIDES: Record<string, string> = {
  'hills-prescription-diet-cd-multicare-urinary-cat-food-ocean-fish':
    '/product-images/hills-cd-multicare-ocean-fish-dry.jpg',
};

export const getProductImages = (product: {
  slug?: string;
  images?: string[];
}): string[] => {
  const images = Array.isArray(product.images) ? product.images.filter(Boolean) : [];
  const override = product.slug ? PRODUCT_IMAGE_OVERRIDES[product.slug] : undefined;
  if (!override) return images;
  return [override, ...images.filter((image) => image !== override)];
};

export const getProductImage = (product: {
  slug?: string;
  images?: string[];
}): string | undefined => getProductImages(product)[0];
