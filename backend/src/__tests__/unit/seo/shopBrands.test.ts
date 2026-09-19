import {
  BRAND_INDEX_META,
  SHOP_BRANDS,
  SHOP_BRAND_PATHS,
  shopBrandForPath,
  shopBrandStaticPages,
} from '../../../seo/shopBrands';

describe('shoppable brand catalog', () => {
  test('curated allowlist stays small and includes GSC brands', () => {
    const slugs = SHOP_BRANDS.map((brand) => brand.slug);
    expect(slugs).toEqual(expect.arrayContaining([
      'merrick',
      'hills-science-diet',
      'purina-pro-plan',
      'purina-cat-chow',
      'friskies',
      'temptations',
      'simply-nourish',
    ]));
    expect(SHOP_BRANDS.length).toBeLessThanOrEqual(20);
    expect(SHOP_BRAND_PATHS).toContain('/brand/merrick');
    expect(shopBrandForPath('/brand/blue-buffalo')?.query).toBe('Blue Buffalo');
  });

  test('static pages use in-stock titles and nationwide soon', () => {
    const pages = shopBrandStaticPages();
    expect(pages['/brand']).toEqual({
      title: BRAND_INDEX_META.title,
      description: BRAND_INDEX_META.description,
    });
    expect(pages['/brand/merrick'].title).toMatch(/Merrick \| In stock · free ship \$49\+/);
    for (const brand of SHOP_BRANDS) {
      expect(brand.description.length).toBeLessThanOrEqual(160);
      expect(brand.description).toMatch(/Nationwide shipping soon/);
      expect(brand.description).not.toMatch(/do not claim/i);
    }
  });
});
