import mongoose from 'mongoose';
import logger from '../utils/logger';

export const HILLS_CD_OCEAN_FISH_SLUG =
  'hills-prescription-diet-cd-multicare-urinary-cat-food-ocean-fish';
export const HILLS_CD_OCEAN_FISH_IMAGE =
  'https://petshiwu-cdn.b-cdn.net/products/hills-cd-multicare-ocean-fish-dry.jpg';
export const NULO_KEEP_SLUG =
  'nulo-raw-medley-puppy-dog-food-kibble-plus-freeze-dried-pieces-salmon-oats-and-turkey-recipe';
export const NULO_DROP_SLUG =
  'nulo-raw-medley-puppy-dog-food-kibble-plus-freeze-dried-pieces-salmon-oats-turkey-recipe';
export const PURINA_BEEF_SLUG =
  'purina-pro-plan-complete-essentials-shredded-blend-adult-dry-dog-food-beef-and-rice';

export type CatalogVariant = {
  price?: number;
  compareAtPrice?: number;
  attributes?: Record<string, string>;
  size?: string;
  weight?: string;
};

export type CatalogProduct = {
  _id?: unknown;
  slug: string;
  petType?: string;
  basePrice?: number;
  compareAtPrice?: number;
  images?: string[];
  cloudinaryImage?: string;
  bunnyImage?: string;
  variants?: CatalogVariant[];
  deletedAt?: Date | null;
  isActive?: boolean;
};

export type CatalogRepairPlan = {
  slugifyPetType: boolean;
  replaceHillsImage: boolean;
  deactivateNuloDuplicate: boolean;
  keepNuloLegacySlug: boolean;
  fixPurinaBeefListing: boolean;
};

const slugifyPetTypeValue = (petType: unknown): string =>
  String(petType || '')
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-');

const looksSwapped = (price: number, compareAt: number): boolean =>
  Number.isFinite(price) &&
  Number.isFinite(compareAt) &&
  compareAt > 0 &&
  compareAt < price &&
  price >= compareAt * 2;

const rewriteBeefAttributes = (
  attributes: Record<string, string> | undefined
): Record<string, string> | undefined => {
  if (!attributes) return attributes;
  const next: Record<string, string> = {};
  for (const [key, value] of Object.entries(attributes)) {
    next[key.replace(/Chicken/g, 'Beef')] = String(value).replace(/Chicken/g, 'Beef');
  }
  return next;
};

export const planLaunchCatalogRepairs = (product: CatalogProduct): CatalogRepairPlan => {
  const petType = slugifyPetTypeValue(product.petType);
  const spacedPetType = String(product.petType || '').includes(' ');
  return {
    slugifyPetType: spacedPetType && petType === 'small-pet',
    replaceHillsImage: product.slug === HILLS_CD_OCEAN_FISH_SLUG,
    deactivateNuloDuplicate: product.slug === NULO_DROP_SLUG,
    keepNuloLegacySlug: product.slug === NULO_KEEP_SLUG,
    fixPurinaBeefListing: product.slug === PURINA_BEEF_SLUG,
  };
};

export const repairedPurinaVariants = (variants: CatalogVariant[] = []): CatalogVariant[] =>
  variants.map((variant) => {
    const price = Number(variant.price);
    const compareAt = Number(variant.compareAtPrice);
    const swapped = looksSwapped(price, compareAt);
    const nextPrice = swapped ? compareAt : price;
    const nextCompare = swapped
      ? undefined
      : Number.isFinite(compareAt) && compareAt > nextPrice
        ? compareAt
        : undefined;
    return {
      ...variant,
      price: nextPrice,
      compareAtPrice: nextCompare,
      attributes: rewriteBeefAttributes(variant.attributes),
    };
  });

let repairStarted = false;

export const repairLaunchCatalog = async (): Promise<void> => {
  if (process.env.NODE_ENV === 'test') return;
  if (repairStarted) return;
  if (mongoose.connection.readyState !== 1 || !mongoose.connection.db) return;
  repairStarted = true;

  const products = mongoose.connection.db.collection('products');
  const summary: Record<string, unknown> = {};

  try {
    const petTypeResult = await products.updateMany(
      { petType: { $in: ['small pet', 'small  pet', 'small animal'] } },
      { $set: { petType: 'small-pet' } }
    );
    summary.smallPetType = petTypeResult.modifiedCount;

    const hills = await products.findOne({ slug: HILLS_CD_OCEAN_FISH_SLUG, deletedAt: null });
    if (hills) {
      const images = Array.isArray(hills.images) ? [...hills.images] : [];
      const nextImages = [
        HILLS_CD_OCEAN_FISH_IMAGE,
        ...images.filter((img) => img && img !== HILLS_CD_OCEAN_FISH_IMAGE),
      ];
      const hillsResult = await products.updateOne(
        { _id: hills._id },
        {
          $set: {
            images: nextImages,
            bunnyImage: HILLS_CD_OCEAN_FISH_IMAGE,
          },
        }
      );
      summary.hillsOceanFishImage = hillsResult.modifiedCount;
    }

    const [nuloKeep, nuloDrop] = await Promise.all([
      products.findOne({ slug: NULO_KEEP_SLUG }),
      products.findOne({ slug: NULO_DROP_SLUG, deletedAt: null }),
    ]);
    if (nuloKeep && nuloDrop) {
      const legacySlugs = Array.from(
        new Set([...(nuloKeep.legacySlugs || []), NULO_DROP_SLUG, nuloDrop.slug].filter(Boolean))
      );
      await products.updateOne(
        { _id: nuloKeep._id },
        { $set: { legacySlugs } }
      );
      const dropResult = await products.updateOne(
        { _id: nuloDrop._id },
        { $set: { isActive: false, deletedAt: new Date() } }
      );
      summary.nuloDuplicateRemoved = dropResult.modifiedCount;
    }

    const purina = await products.findOne({ slug: PURINA_BEEF_SLUG, deletedAt: null });
    if (purina) {
      const variants = repairedPurinaVariants((purina.variants || []) as CatalogVariant[]);
      const prices = variants
        .map((variant) => Number(variant.price))
        .filter((price) => Number.isFinite(price) && price > 0);
      const listingPrice = prices.length ? Math.min(...prices) : Number(purina.basePrice);
      const purinaResult = await products.updateOne(
        { _id: purina._id },
        {
          $set: {
            variants,
            basePrice: listingPrice,
          },
          $unset: { compareAtPrice: '' },
        }
      );
      summary.purinaBeefListing = purinaResult.modifiedCount;
    }

    logger.info('[launch-catalog-repair] complete', summary);
  } catch (error) {
    repairStarted = false;
    logger.warn(
      '[launch-catalog-repair] skipped/failed:',
      error instanceof Error ? error.message : error
    );
  }
};
