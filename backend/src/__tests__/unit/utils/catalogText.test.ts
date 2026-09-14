import {
  anyBrandMatchQuery,
  brandMatchQuery,
  catalogFlexPattern,
  decodeHtmlEntities,
} from '../../../utils/catalogText';

describe('catalogText', () => {
  test('decodes Hill&#039;s to Hill\'s', () => {
    expect(decodeHtmlEntities("Hill&#039;s Science Diet")).toBe("Hill's Science Diet");
    expect(decodeHtmlEntities("Nature&apos;s Recipe")).toBe("Nature's Recipe");
  });

  test('catalogFlexPattern lets Hills match encoded Hill\'s', () => {
    const regex = new RegExp(catalogFlexPattern("Hill's"), 'i');
    expect(regex.test("Hill's")).toBe(true);
    expect(regex.test('Hills')).toBe(true);
    expect(regex.test("Hill&#039;s")).toBe(true);
    expect(regex.test('Hill&apos;s')).toBe(true);
  });

  test('Nature\'s Recipe flex matches encoded catalog rows', () => {
    const regex = new RegExp(catalogFlexPattern("Nature's Recipe"), 'i');
    expect(regex.test("Nature's Recipe")).toBe(true);
    expect(regex.test("Nature&#039;s Recipe")).toBe(true);
  });

  test('brandMatchQuery prefixes Purina so Pro Plan rows match', () => {
    const query = brandMatchQuery('Purina') as { $or: Array<{ brand?: unknown }> };
    expect(JSON.stringify(query)).toContain('Purina');
    expect(JSON.stringify(query)).toContain('$or');
  });

  test('anyBrandMatchQuery includes fallback brands', () => {
    const query = anyBrandMatchQuery(["Hill's Science Diet", 'Blue Buffalo']);
    expect(JSON.stringify(query)).toContain('Blue Buffalo');
    expect(JSON.stringify(query)).toContain('Science Diet');
  });
});
