import {
  apostropheFlexPattern,
  buildProductSearchQuery,
  escapeRegex,
  rankSearchHits,
  scoreSearchHit,
  singleTermNameMatch,
} from '../../../utils/productSearchQuery';

describe('productSearchQuery', () => {
  test('escapeRegex keeps letters and escapes dots', () => {
    expect(escapeRegex('hill.s')).toBe('hill\\.s');
    expect(escapeRegex('purina')).toBe('purina');
  });

  test('apostropheFlexPattern lets hills match encoded Hill\'s', () => {
    const regex = new RegExp(apostropheFlexPattern("Hill's"), 'i');
    expect(regex.test("Hill's")).toBe(true);
    expect(regex.test('Hills')).toBe(true);
    expect(regex.test("Hill&#039;s")).toBe(true);
    expect(regex.test("Nature&#039;s Recipe")).toBe(false);
  });

  test('single term uses prefix/contains regex, not $text', () => {
    const clause = singleTermNameMatch('pur');
    const serialized = JSON.stringify(clause);
    expect(serialized).not.toContain('$text');
    expect(serialized).toContain('pur');
    expect(buildProductSearchQuery('pur')).toMatchObject({ isActive: true });
    expect(JSON.stringify(buildProductSearchQuery('royal'))).toContain('$regex');
  });

  test('empty query returns null so the catalog can list all products', () => {
    expect(buildProductSearchQuery('')).toBeNull();
    expect(buildProductSearchQuery('   ')).toBeNull();
  });

  test('one letter still uses regex so first keystroke can match brands', () => {
    const query = buildProductSearchQuery('p');
    const serialized = JSON.stringify(query);
    expect(serialized).not.toContain('$text');
    expect(serialized).toContain('p');
  });

  test('dog food detects pet type and still matches food', () => {
    const query = buildProductSearchQuery('dog food') as { $and: unknown[] };
    expect(JSON.stringify(query)).toContain('"petType":"dog"');
    expect(JSON.stringify(query)).toContain('food');
  });

  test('ranks a flagship Blue Buffalo bag ahead of a later treat SKU', () => {
    const ranked = rankSearchHits(
      [
        { name: 'Blue Buffalo Bits Soft Treats', totalReviews: 2 },
        { name: 'Blue Buffalo Life Protection Formula Adult Dry Dog Food', isFeatured: true, totalReviews: 40 },
        { name: 'Wilderness Trail Mix', brand: 'Blue Buffalo' },
      ],
      'blue buffalo'
    );
    expect(ranked[0].name).toMatch(/Life Protection/i);
    expect(scoreSearchHit(ranked[0], 'blue buffalo')).toBeLessThan(
      scoreSearchHit(ranked[1], 'blue buffalo')
    );
  });

  test('still surfaces the bag when it is the last of many treat hits', () => {
    const treats = Array.from({ length: 39 }, (_, index) => ({
      name: `Blue Buffalo Baby BLUE Training Treats ${index + 1}`,
    }));
    const ranked = rankSearchHits(
      [
        ...treats,
        { name: 'Blue Buffalo Life Protection Formula Adult Dry Dog Food', isFeatured: true, totalReviews: 40 },
      ],
      'blue buffalo'
    );
    expect(ranked[0].name).toMatch(/Life Protection/i);
  });
});
