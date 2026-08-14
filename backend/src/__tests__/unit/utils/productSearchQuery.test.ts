import {
  apostropheFlexPattern,
  buildProductSearchQuery,
  escapeRegex,
  singleTermNameMatch,
} from '../../../utils/productSearchQuery';

describe('productSearchQuery', () => {
  test('escapeRegex keeps letters and escapes dots', () => {
    expect(escapeRegex('hill.s')).toBe('hill\\.s');
    expect(escapeRegex('purina')).toBe('purina');
  });

  test('apostropheFlexPattern lets hills match Hill\'s', () => {
    const regex = new RegExp(apostropheFlexPattern('hills'), 'i');
    expect(regex.test("Hill's")).toBe(true);
    expect(regex.test('Hills')).toBe(true);
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
});
