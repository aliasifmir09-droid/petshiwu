/**
 * Shared copy for NYC shoppable hubs.
 * Adds ZIP, compare, ratings, and nationwide facts. Does not replace existing landing copy.
 */

import { NATIONWIDE_SOON_NOTE } from '@/data/brandStories';
import { TONIGHT } from '@/data/tonightDelivery';

export const NYC_HUB_PATHS = [
  '/dog-food-delivery-nyc',
  '/cat-food-delivery-nyc',
  '/pet-supplies-delivery-nyc',
  '/pet-supplies-queens-ny',
] as const;

export const NYC_HUB_LINKS: Array<{
  path: (typeof NYC_HUB_PATHS)[number];
  title: string;
  text: string;
}> = [
  {
    path: '/dog-food-delivery-nyc',
    title: 'Dog food delivery NYC',
    text: 'Same-day in all 5 boroughs when you order by cutoff. Nationwide next as standard shipping.',
  },
  {
    path: '/cat-food-delivery-nyc',
    title: 'Cat food delivery NYC',
    text: 'Wet, dry, litter, and specialty diets to the door. Same-day NYC only.',
  },
  {
    path: '/pet-supplies-delivery-nyc',
    title: 'Pet supplies delivery NYC',
    text: '4,000+ SKUs. Free over $49. Check your ZIP for tonight vs nationwide soon.',
  },
  {
    path: '/pet-supplies-queens-ny',
    title: 'Pet supplies Queens',
    text: 'Packed in Jackson Heights. Delivery only — not a walk-in store.',
  },
];

export const NYC_HUB_ZIP_HEADING = 'Check your ZIP — same-day NYC or nationwide soon';

export const NYC_HUB_ZIP_INTRO =
  'NYC same-day: order by 3 PM weekdays or 1 PM weekends, at your door before 11 PM. Same-day is NYC only. Nationwide shipping opens in a few days as standard delivery, never same-day outside the five boroughs.';

export const NYC_HUB_NATIONWIDE_HEADING = 'Nationwide next — not same-day outside NYC';

export const NYC_HUB_NATIONWIDE_BODY = `${NATIONWIDE_SOON_NOTE} Free shipping over $${TONIGHT.freeOver}. No autoship. Jackson Heights is warehouse and office, not a walk-in store.`;

export const NYC_HUB_COMPARE_HEADING = 'Why NYC shoppers pick Petshiwü first';

export const NYC_HUB_COMPARE_ROWS: Array<{
  label: string;
  petshiwu: string;
  manhattanShop: string;
  national: string;
}> = [
  {
    label: 'Same-day coverage',
    petshiwu: 'All 5 boroughs when you order by cutoff',
    manhattanShop: 'Usually Manhattan only',
    national: '1–3 day shipping, not same-day NYC',
  },
  {
    label: 'Cutoff',
    petshiwu: '3 PM weekdays / 1 PM weekends, before 11 PM',
    manhattanShop: 'Often later, smaller zone',
    national: 'Warehouse cutoff, not tonight',
  },
  {
    label: 'Free delivery',
    petshiwu: 'Free over $49 ($6 under)',
    manhattanShop: 'Often $100+ or zone fees',
    national: 'Free over $49, slower',
  },
  {
    label: 'Autoship',
    petshiwu: 'None. Buy once. RESTOCK5 is 10% off max $10 when you reorder.',
    manhattanShop: 'Varies',
    national: 'Usually a subscription',
  },
  {
    label: 'Walk-in store',
    petshiwu: 'No — delivery only',
    manhattanShop: 'Yes',
    national: 'No',
  },
];

export const NYC_HUB_FAQS: Array<{ question: string; answer: string }> = [
  {
    question: 'Do you deliver same-day outside New York City?',
    answer:
      'No. Same-day is NYC only — Queens, Brooklyn, Manhattan, the Bronx, and Staten Island — when you order by 3 PM weekdays or 1 PM weekends. Nationwide shipping opens in a few days as standard delivery. We do not claim same-day nationwide.',
  },
  {
    question: 'Do you deliver to Staten Island the same day?',
    answer:
      'Yes. Staten Island is one of the five boroughs. Order by cutoff and we aim to deliver before 11 PM. After cutoff, next day. Enter 10301 or any Staten Island ZIP on this page to confirm.',
  },
  {
    question: 'Can I walk into the Jackson Heights address?',
    answer:
      'No. 37-68 74th St is office and warehouse only. It is not a retail shop. Order online and we deliver to your door.',
  },
  {
    question: 'Do you carry food for birds, fish, and reptiles?',
    answer:
      'Yes. The catalog covers dogs, cats, birds, fish, reptiles, and small animals. The same NYC cutoff and free-over-$49 rules apply.',
  },
];

export function withHubFaqs(
  items: Array<{ question: string; answer: string }>
): Array<{ question: string; answer: string }> {
  const seen = new Set(items.map((item) => item.question.trim().toLowerCase()));
  const extras = NYC_HUB_FAQS.filter((item) => !seen.has(item.question.trim().toLowerCase()));
  return [...items, ...extras];
}

export function ratedHubProducts<T extends { totalReviews?: number; averageRating?: number }>(
  products: T[],
  limit = 8
): T[] {
  return products
    .filter((product) => Number(product.totalReviews || 0) > 0)
    .sort((a, b) => Number(b.totalReviews || 0) - Number(a.totalReviews || 0))
    .slice(0, limit);
}
