/**
 * Catalog-style product search match clauses.
 * MongoDB $text is whole-word only, so "pur" / "hill" miss Purina / Hill's on the first letters.
 */

import { catalogFlexPattern, decodeHtmlEntities } from './catalogText';

export function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export function apostropheFlexPattern(term: string): string {
  return catalogFlexPattern(term);
}

const NOT_DELETED = {
  $or: [{ deletedAt: null }, { deletedAt: { $exists: false } }],
};

export const PET_TYPE_KEYWORDS: Record<string, string> = {
  dog: 'dog',
  dogs: 'dog',
  puppy: 'dog',
  puppies: 'dog',
  canine: 'dog',
  cat: 'cat',
  cats: 'cat',
  kitten: 'cat',
  kittens: 'cat',
  feline: 'cat',
  bird: 'bird',
  birds: 'bird',
  parrot: 'bird',
  parakeet: 'bird',
  budgie: 'bird',
  fish: 'fish',
  aquarium: 'fish',
  aquatic: 'fish',
  reptile: 'reptile',
  reptiles: 'reptile',
  lizard: 'reptile',
  snake: 'reptile',
  turtle: 'reptile',
  rabbit: 'small-pet',
  hamster: 'small-pet',
  bunny: 'small-pet',
  guinea: 'small-pet',
  gerbil: 'small-pet',
};

export function singleTermNameMatch(term: string) {
  const escaped = escapeRegex(term);
  const contains = new RegExp(escaped, 'i');
  const apostropheFlex = new RegExp(apostropheFlexPattern(term), 'i');
  return {
    $or: [
      { name: { $regex: `^${escaped}`, $options: 'i' } },
      { name: contains },
      { name: apostropheFlex },
      { brand: apostropheFlex },
      { brand: contains },
      { tags: { $in: [contains] } },
    ],
  };
}

export function buildProductSearchQuery(
  rawQuery: string,
  explicitPetType?: string
): Record<string, unknown> | null {
  const searchText = rawQuery.trim();
  if (!searchText) return null;

  const searchTerms = searchText.split(/\s+/).filter((term) => term.length > 0);
  const base = {
    isActive: true,
    $and: [NOT_DELETED] as Record<string, unknown>[],
  };

  if (searchTerms.length === 1) {
    base.$and.push(singleTermNameMatch(searchTerms[0]));
    return base;
  }

  let detectedPetType: string | null = null;
  let effectiveTerms = [...searchTerms];
  if (!explicitPetType) {
    for (let i = 0; i < effectiveTerms.length; i++) {
      const mapped = PET_TYPE_KEYWORDS[effectiveTerms[i].toLowerCase()];
      if (mapped) {
        detectedPetType = mapped;
        effectiveTerms.splice(i, 1);
        break;
      }
    }
  }
  if (effectiveTerms.length === 0) effectiveTerms = [...searchTerms];

  const escapedTerms = effectiveTerms.map((term) => escapeRegex(term));
  const andConditions = escapedTerms.map((term) => ({
    $or: [
      { name: { $regex: term, $options: 'i' } },
      { brand: { $regex: term, $options: 'i' } },
      { tags: { $in: [new RegExp(term, 'i')] } },
    ],
  }));
  const exactNameRegex = new RegExp(escapeRegex(searchText), 'i');

  if (detectedPetType) {
    base.$and.push({ petType: detectedPetType });
  }
  base.$and.push({
    $or: [{ name: exactNameRegex }, { $and: andConditions }],
  });
  return base;
}

export type SearchHit = {
  name?: string;
  brand?: string;
  isFeatured?: boolean;
  totalReviews?: number;
  categorySlug?: string;
  petType?: string;
  category?: unknown;
};

function hitCategorySlug(product: SearchHit): string {
  if (product.categorySlug) return foldSearchText(product.categorySlug);
  const category = product.category;
  if (category && typeof category === 'object' && 'slug' in category) {
    const slug = (category as { slug?: unknown }).slug;
    return foldSearchText(String(slug || ''));
  }
  return '';
}

const TREAT_SIGNAL = /\b(treat|treats|chew|chews|biscuit|bits|topper|beggin|rawhide)\b/;
const BABY_SIGNAL = /\b(baby|kitten|kittens|puppy|puppies)\b/;
const RX_SIGNAL = /\b(prescription|veterinary|k d|i d|c d|a d)\b/;
const FLAGSHIP_LINE = /\b(life protection|science diet|pro plan|wilderness)\b/;
const DRY_FOOD_SIGNAL = /\b(dry food|dry dog|dry cat|kibble)\b/;

/** Fold apostrophes so "Hill's" and "hills" score the same. */
export function foldSearchText(raw: string): string {
  return decodeHtmlEntities(raw)
    .toLowerCase()
    .replace(/['’]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function containsQuery(haystack: string, query: string): boolean {
  if (!query || !haystack) return false;
  if (
    haystack === query ||
    haystack.startsWith(`${query} `) ||
    haystack.endsWith(` ${query}`) ||
    haystack.includes(` ${query} `)
  ) {
    return true;
  }
  const queryTokens = query.split(/\s+/).filter(Boolean);
  if (queryTokens.length !== 1) return haystack.includes(query);
  const needle = queryTokens[0];
  return haystack.split(/\s+/).some((token) => token === needle || token.startsWith(needle));
}

/** Lower is a better match. Phrase / prefix beats a newest-treat dump. */
export function scoreSearchHit(product: SearchHit, rawQuery: string): number {
  const query = foldSearchText(rawQuery);
  if (!query) return 1000;
  const name = foldSearchText(product.name || '');
  const brand = foldSearchText(product.brand || '');
  const category = hitCategorySlug(product);
  let score = 80;
  if (name === query) score = 0;
  else if (name.startsWith(query)) score = 10;
  else if (brand === query) score = 16;
  else if (brand.startsWith(query)) score = 18;
  else if (containsQuery(name, query)) score = 28;
  else if (containsQuery(brand, query)) score = 40;

  const queryWantsTreats = TREAT_SIGNAL.test(query);
  const queryWantsBaby = BABY_SIGNAL.test(query);
  const queryWantsRx = RX_SIGNAL.test(query) || /\b(prescription|veterinary|rx)\b/.test(query);

  if (!queryWantsTreats && (TREAT_SIGNAL.test(name) || /treat|chew/.test(category))) {
    score += 22;
  }
  if (!queryWantsBaby && BABY_SIGNAL.test(name)) {
    score += 16;
  }
  if (queryWantsBaby && BABY_SIGNAL.test(name)) {
    score -= 18;
  }
  if (!queryWantsRx && (RX_SIGNAL.test(name) || /veterinary|prescription/.test(category))) {
    score += 14;
  }
  if (queryWantsRx && (RX_SIGNAL.test(name) || /veterinary|prescription/.test(category))) {
    score -= 12;
  }
  if (FLAGSHIP_LINE.test(name) || DRY_FOOD_SIGNAL.test(name) || category === 'dry-food') {
    score -= 6;
  }
  if (product.isFeatured) score -= 3;
  score -= Math.min(8, Math.log10((product.totalReviews || 0) + 1) * 3);
  return score;
}

export function compareSearchHits(a: SearchHit, b: SearchHit, query: string): number {
  const delta = scoreSearchHit(a, query) - scoreSearchHit(b, query);
  if (delta !== 0) return delta;
  const reviewDelta = (b.totalReviews || 0) - (a.totalReviews || 0);
  if (reviewDelta !== 0) return reviewDelta;
  return foldSearchText(a.name || '').localeCompare(foldSearchText(b.name || ''));
}

export function rankSearchHits<T extends SearchHit>(hits: T[], query: string): T[] {
  return [...hits].sort((a, b) => compareSearchHits(a, b, query));
}
