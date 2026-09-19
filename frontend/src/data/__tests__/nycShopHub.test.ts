import { describe, expect, test } from 'vitest';
import {
  NYC_HUB_LINKS,
  NYC_HUB_PATHS,
  ratedHubProducts,
  withHubFaqs,
} from '../nycShopHub';

describe('nycShopHub', () => {
  test('locks the four NYC #1 URLs and does not drop extras when merging FAQs', () => {
    expect(NYC_HUB_LINKS.map((item) => item.path)).toEqual([...NYC_HUB_PATHS]);
    expect([...NYC_HUB_PATHS]).toEqual([
      '/dog-food-delivery-nyc',
      '/cat-food-delivery-nyc',
      '/pet-supplies-delivery-nyc',
      '/pet-supplies-queens-ny',
    ]);

    const existing = [{ question: 'What dog food brands do you carry?', answer: 'Many.' }];
    const merged = withHubFaqs(existing);
    expect(merged[0]).toEqual(existing[0]);
    expect(merged.length).toBeGreaterThan(existing.length);
    expect(merged.some((item) => /same-day outside New York City/i.test(item.question))).toBe(true);
  });

  test('ratedHubProducts only keeps SKUs with real review counts', () => {
    const rated = ratedHubProducts([
      { name: 'New bag', totalReviews: 0, averageRating: 0 },
      { name: 'Loved bag', totalReviews: 12, averageRating: 4.8 },
      { name: 'Also loved', totalReviews: 3, averageRating: 4.2 },
    ]);
    expect(rated.map((item) => item.name)).toEqual(['Loved bag', 'Also loved']);
  });
});
