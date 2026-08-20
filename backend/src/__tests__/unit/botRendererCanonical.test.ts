import {
  buildCanonicalProductPath,
  buildHomepageHtml,
  buildReturnPolicyHtml,
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

describe('buildHomepageHtml delivery-only schema', () => {
  const template = `<!DOCTYPE html><html><head>
<title>Petshiwu</title>
<meta name="description" content="old" />
</head><body><div id="root"></div></body></html>`;

  const html = buildHomepageHtml(template);
  const scripts = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map(
    (m) => JSON.parse(m[1])
  );
  const localBusiness = scripts.find((s) => s['@id'] === 'https://www.petshiwu.com/#localbusiness');

  it('uses OnlineStore + LocalBusiness, not PetStore', () => {
    expect(localBusiness).toBeDefined();
    expect(localBusiness['@type']).toEqual(['OnlineStore', 'LocalBusiness']);
    expect(JSON.stringify(localBusiness)).not.toContain('PetStore');
  });

  it('does not publish a storefront map pin', () => {
    expect(localBusiness.hasMap).toBeUndefined();
    expect(html).not.toContain('hasMap');
  });

  it('tells crawlers the Jackson Heights site is office/warehouse only', () => {
    expect(localBusiness.description).toMatch(/office and warehouse only/i);
    expect(localBusiness.description).toMatch(/not a walk-in store/i);
    expect(localBusiness.areaServed).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ name: 'New York City' }),
        expect.objectContaining({ name: 'Queens' }),
      ])
    );
  });
});

describe('buildReturnPolicyHtml', () => {
  const template = `<!DOCTYPE html><html><head>
<title>Petshiwu</title>
<meta name="description" content="old" />
</head><body>
<div class="ps-sr-only"><h2>Shop by Pet Type</h2><p>Homepage dump</p></div>
<noscript>
<div class="ps-ns-wrap"><h2>Shop by Pet Type</h2></div>
</noscript>
</body></html>`;

  const html = buildReturnPolicyHtml(template);

  it('replaces homepage crawler copy with a 365-day US return policy', () => {
    expect(html).toContain('365-day return window');
    expect(html).toContain('365 days');
    expect(html).toContain('paid by the customer');
    expect(html).not.toContain('Shop by Pet Type');
    expect(html).not.toContain('FreeReturn');
  });

  it('publishes MerchantReturnPolicy JSON-LD Google Merchant Center can verify', () => {
    const scripts = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map(
      (m) => JSON.parse(m[1])
    );
    const policy = scripts.find((s) => s['@type'] === 'MerchantReturnPolicy');
    expect(policy).toBeDefined();
    expect(policy.merchantReturnDays).toBe(365);
    expect(policy.applicableCountry).toBe('US');
    expect(policy.returnFees).toBe('https://schema.org/ReturnFeesCustomerResponsibility');
    expect(policy.merchantReturnLink).toBe('https://www.petshiwu.com/return-policy');
  });

  it('uses a crawlable title and description that match the live policy', () => {
    expect(html).toContain('<title>Return &amp; Exchange Policy | Petshiwu</title>');
    expect(html).toContain('Return shipping is paid by the customer');
  });
});
