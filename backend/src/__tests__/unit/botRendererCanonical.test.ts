import {
  buildCanonicalProductPath,
  normalizeReqPath,
  productRedirectTarget,
} from '../../middleware/botRenderer';

describe('botRenderer product canonical helpers', () => {
  const product = {
    slug: 'nulo-prowess-healthy-weight-adult-cat-wet-food-shreds-in-broth-28-oz',
    petType: 'cat',
    category: { slug: 'wet-food', name: 'Wet Food' },
  };
  const canonical = '/cat/wet-food/nulo-prowess-healthy-weight-adult-cat-wet-food-shreds-in-broth-28-oz';

  describe('buildCanonicalProductPath', () => {
    it('builds /{petType}/{categorySlug}/{slug}', () => {
      expect(buildCanonicalProductPath(product)).toBe(canonical);
    });

    it('returns null when petType is missing', () => {
      expect(buildCanonicalProductPath({ slug: 'x', category: { slug: 'wet-food' } })).toBeNull();
    });

    it('returns null when category slug is missing (avoids ambiguous 2-segment path)', () => {
      expect(buildCanonicalProductPath({ slug: 'x', petType: 'cat' })).toBeNull();
      expect(buildCanonicalProductPath({ slug: 'x', petType: 'cat', category: 'wet-food' })).toBeNull();
    });

    it('returns null when slug is missing', () => {
      expect(buildCanonicalProductPath({ petType: 'cat', category: { slug: 'wet-food' } })).toBeNull();
    });
  });

  describe('normalizeReqPath', () => {
    it('strips query string and trailing slash and decodes', () => {
      expect(normalizeReqPath('/cat/wet-food/foo/?utm=1')).toBe('/cat/wet-food/foo');
      expect(normalizeReqPath('/cat/food%2Dtreats/foo')).toBe('/cat/food-treats/foo');
    });
  });

  describe('productRedirectTarget', () => {
    it('redirects a nested full-hierarchy URL to the canonical', () => {
      expect(
        productRedirectTarget('/cat/food--treats/wet-food/' + product.slug, product)
      ).toBe(canonical);
    });

    it('redirects a deep 5-segment URL to the canonical', () => {
      expect(
        productRedirectTarget('/cat/supplies/food--treats/wet-food/' + product.slug, product)
      ).toBe(canonical);
    });

    it('does NOT redirect when the request is already canonical (no loop)', () => {
      expect(productRedirectTarget(canonical, product)).toBeNull();
      expect(productRedirectTarget(canonical + '/', product)).toBeNull();
    });

    it('does NOT redirect when canonical cannot be built', () => {
      expect(productRedirectTarget('/anything', { slug: 'x', petType: 'cat' })).toBeNull();
    });
  });
});
