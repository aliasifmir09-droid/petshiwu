import {
  buildCanonicalProductPath,
  buildHomepageHtml,
  buildProductHtml,
  buildReturnPolicyHtml,
  buildSeoLandingHtmlFromProducts,
  landingTaxonomyForPath,
  normalizeReqPath,
  productOfferPrice,
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

  it('marks the call center as 24/7', () => {
    expect(localBusiness.openingHoursSpecification).toEqual([
      expect.objectContaining({
        opens: '00:00',
        closes: '23:59',
      }),
    ]);
    const organization = scripts.find((s) => s['@type'] === 'Organization');
    expect(organization?.contactPoint?.hoursAvailable).toEqual(
      expect.objectContaining({
        opens: '00:00',
        closes: '23:59',
      })
    );
  });
});

describe('buildReturnPolicyHtml', () => {
  const template = `<!DOCTYPE html><html><head>
<title>Petshiwu</title>
<meta name="description" content="old" />
</head><body>
<div id="root"></div>
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

  it('keeps a single Return & Exchange Policy H1', () => {
    expect([...html.matchAll(/<h1[^>]*>/gi)]).toHaveLength(1);
    expect(html).toContain('<h1>Return &amp; Exchange Policy</h1>');
  });
});

describe('SEO landing first-wave HTML', () => {
  const template = `<!DOCTYPE html><html><head>
<title>Petshiwu</title>
<meta name="description" content="old" />
</head><body><h1>Homepage H1</h1><div id="root"></div></body></html>`;

  const products = [
    {
      name: 'Hill\'s Science Diet Adult Dry Dog Food',
      slug: 'hills-science-diet-adult-dry-dog-food',
      brand: 'Hill\'s Science Diet',
      basePrice: 54.99,
      petType: 'dog',
      category: { slug: 'dry-food', name: 'Dry Food' },
    },
    {
      name: 'Royal Canin Indoor Adult Cat Food',
      slug: 'royal-canin-indoor-adult-cat-food',
      brand: 'Royal Canin',
      basePrice: 42.5,
      petType: 'cat',
      category: { slug: 'dry-food', name: 'Dry Food' },
    },
  ];

  const html = buildSeoLandingHtmlFromProducts(
    template,
    '/pet-supplies-delivery-nyc',
    products
  );

  it('uses the same-day NYC title and H1 shoppers see', () => {
    expect(html).toContain(
      '<title>Same-Day Pet Supplies Delivery NYC — Order by 3 PM | Petshiwu</title>'
    );
    expect(html).toContain('<h1>Same-Day Pet Supplies Delivery NYC — Order by 3 PM</h1>');
    expect([...html.matchAll(/<h1[^>]*>/gi)]).toHaveLength(1);
  });

  it('injects Recommended Products with canonical product links', () => {
    expect(html).toContain('<h2>Recommended Products</h2>');
    expect(html).toContain(
      'href="https://www.petshiwu.com/dog/dry-food/hills-science-diet-adult-dry-dog-food"'
    );
    expect(html).toContain(
      'href="https://www.petshiwu.com/cat/dry-food/royal-canin-indoor-adult-cat-food"'
    );
    expect(html).toContain('$54.99');
  });

  it('publishes ItemList JSON-LD for the product module', () => {
    const scripts = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map(
      (m) => JSON.parse(m[1])
    );
    const itemList = scripts.find((s) => s['@type'] === 'ItemList');
    expect(itemList).toBeDefined();
    expect(itemList.numberOfItems).toBe(2);
    expect(itemList.itemListElement[0].url).toBe(
      'https://www.petshiwu.com/dog/dry-food/hills-science-diet-adult-dry-dog-food'
    );
  });

  it('maps dog and cat landings to the matching catalog filter', () => {
    expect(landingTaxonomyForPath('/dog-food-delivery-nyc')).toEqual({ petType: 'dog' });
    expect(landingTaxonomyForPath('/cat-food-delivery-nyc')).toEqual({ petType: 'cat' });
    expect(landingTaxonomyForPath('/pet-supplies-delivery-nyc')).toEqual({});
  });
});

describe('product offer price in first-wave HTML', () => {
  const template = `<!DOCTYPE html><html><head>
<title>Petshiwu</title>
<meta name="description" content="old" />
</head><body><div id="root"></div></body></html>`;

  it('uses basePrice, then the first variant price if basePrice is missing', () => {
    expect(productOfferPrice({ basePrice: 14.39 })).toBe(14.39);
    expect(productOfferPrice({ basePrice: 0, variants: [{ price: 52.99 }] })).toBe(52.99);
    expect(productOfferPrice({ variants: [{ price: 0 }, { price: 2.39 }] })).toBe(2.39);
    expect(productOfferPrice({})).toBe(0);
  });

  it('puts a visible dollar price and Offer schema in the HTML Google Shopping fetches', () => {
    const html = buildProductHtml(
      template,
      {
        name: 'Pet Botanics Training Reward Freeze Dried Dog Treat - Beef Liver',
        slug: 'pet-botanics-training-reward-freeze-dried-dog-treat-beef-liver',
        brand: 'Pet Botanics',
        basePrice: 14.39,
        inStock: true,
        totalStock: 12,
        petType: 'dog',
        category: { slug: 'training-treats', name: 'Training Treats' },
        images: ['https://petshiwu-cdn.b-cdn.net/products/6946b2708cb303af8765b681.jpg'],
        description: 'Freeze-dried beef liver training treats.',
      },
      'pet-botanics-training-reward-freeze-dried-dog-treat-beef-liver'
    );
    expect(html).toContain('$14.39');
    expect(html).toContain('product:price:amount" content="14.39"');
    expect(html).toContain('"price":"14.39"');
    expect(html).toContain('"@type":"Offer"');
  });
});
