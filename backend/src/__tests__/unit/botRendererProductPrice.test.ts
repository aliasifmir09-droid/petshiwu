import { buildCategoryHtml, productAnchorHtml, productAnchorsHtml } from '../../middleware/botRenderer';

/**
 * Regression guard for the category "$0.00" price bug (found 2026-09-30).
 *
 * `productAnchorHtml` read `product.basePrice` directly and rendered a price
 * whenever that value was any finite number — including 0. In the live catalog
 * `basePrice` is stored as 0 on 1,310 of 4,317 products while the real price
 * lives on `variants[].price`, so every category page advertised those products
 * as "— $0.00" in the HTML served to crawlers. The category page for the site's
 * largest category (dog dry food) showed "$0.00" on all 40 listings.
 *
 * The fix routes the anchor through the existing `productOfferPrice` resolver,
 * which already falls back to the first priced variant and returns 0 only when
 * no price exists anywhere. These tests pin both halves: a variant-priced
 * product must render its real price, and a genuinely priceless product must
 * render no price at all rather than a misleading "$0.00".
 */
describe('product anchors — price rendering guard', () => {
  const template = '<html><head><title>t</title></head><body><div id="root"></div></body></html>';

  const dogDryFood = { _id: 'dog-1', name: 'Dry Food', slug: 'dry-food', petType: 'dog' };

  const base = (over: Record<string, unknown> = {}) => ({
    slug: 'nutro-ultra-puppy-dry-dog-food',
    name: 'NUTRO ULTRA Puppy Dry Dog Food',
    brand: 'NUTRO',
    petType: 'dog',
    category: { slug: 'dry-food', name: 'Dry Food' },
    images: ['https://cdn.example/x.webp'],
    ...over,
  });

  it('renders the variant price when basePrice is 0 (the live-catalog case)', () => {
    const html = productAnchorHtml(
      base({ basePrice: 0, variants: [{ price: 23.99, sku: 'a' }, { price: 52.99, sku: 'b' }] })
    );
    expect(html).toContain('$23.99');
    expect(html).not.toContain('$0.00');
  });

  it('prefers basePrice when it is a real positive number', () => {
    const html = productAnchorHtml(
      base({ basePrice: 34.5, variants: [{ price: 23.99, sku: 'a' }] })
    );
    expect(html).toContain('$34.50');
  });

  it('omits the price entirely when no price exists anywhere', () => {
    const html = productAnchorHtml(base({ basePrice: 0, variants: [{ price: 0, sku: 'a' }] }));
    expect(html).not.toContain('$');
    // The link itself must survive — an unpriced product is still a valid listing.
    expect(html).toContain('NUTRO ULTRA Puppy Dry Dog Food');
  });

  it('omits the price when basePrice is absent', () => {
    const html = productAnchorHtml(base({ variants: [] }));
    expect(html).not.toContain('$');
  });

  it('never emits "$0.00" across a mixed category page', () => {
    const products = [
      base({ slug: 'p-1', name: 'Priced By Variant', basePrice: 0, variants: [{ price: 19.99 }] }),
      base({ slug: 'p-2', name: 'Priced By Base', basePrice: 24.99, variants: [] }),
      base({ slug: 'p-3', name: 'No Price At All', basePrice: 0, variants: [{ price: 0 }] }),
    ];
    const html = buildCategoryHtml(template, dogDryFood, 'dog', '/dog/dry-food', products);

    expect(html).not.toContain('$0.00');
    expect(html).toContain('$19.99');
    expect(html).toContain('$24.99');
    // All three products still appear as links and in the ItemList.
    expect(html).toContain('numberOfItems":3');
    expect(productAnchorsHtml(products).match(/<li>/g)).toHaveLength(3);
  });
});
