import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, test } from 'vitest';
import {
  BRAND_INDEX_META,
  SHOP_BRANDS,
  SHOP_BRAND_PATHS,
  getShopBrand,
  shopBrandForPath,
} from '../shopBrands';

const dir = dirname(fileURLToPath(import.meta.url));

describe('shoppable brand catalog', () => {
  test('allowlist covers GSC brand queries without exploding into every catalog brand', () => {
    const slugs = SHOP_BRANDS.map((brand) => brand.slug);
    expect(slugs).toEqual(expect.arrayContaining([
      'hills-science-diet',
      'merrick',
      'blue-buffalo',
      'purina',
      'purina-pro-plan',
      'purina-cat-chow',
      'royal-canin',
      'friskies',
      'temptations',
      'simply-nourish',
    ]));
    expect(SHOP_BRANDS.length).toBeLessThanOrEqual(20);
    expect(SHOP_BRAND_PATHS[0]).toBe('/brand');
    expect(getShopBrand('merrick')?.query).toBe('Merrick');
    expect(shopBrandForPath('/brand/hills-science-diet')?.name).toBe("Hill's Science Diet");
    expect(shopBrandForPath('/brand/not-real')).toBeUndefined();
  });

  test('titles and descriptions stay snippet-length and lock nationwide soon', () => {
    expect(BRAND_INDEX_META.description.length).toBeLessThanOrEqual(160);
    for (const brand of SHOP_BRANDS) {
      expect(brand.title).toMatch(/In stock · free ship \$49\+ \| Petshiwu$/);
      expect(brand.title).not.toContain('...');
      expect(brand.description.length).toBeLessThanOrEqual(160);
      expect(brand.description).toMatch(/Nationwide shipping soon/);
      expect(brand.description).not.toMatch(/do not claim/i);
      expect(brand.intro).toMatch(/Nationwide shipping soon/);
    }
  });

  test('home, footer, app, and robots publish the brand URLs', () => {
    const home = readFileSync(join(dir, '../../pages/Home.tsx'), 'utf8');
    const footer = readFileSync(join(dir, '../../components/Footer.tsx'), 'utf8');
    const app = readFileSync(join(dir, '../../App.tsx'), 'utf8');
    const robots = readFileSync(join(dir, '../../../public/robots.txt'), 'utf8');
    const sitemapScript = readFileSync(join(dir, '../../../scripts/generate-sitemap.js'), 'utf8');
    expect(app.indexOf('path="/brand/:slug"')).toBeGreaterThan(-1);
    expect(app.indexOf('path="/brand/:slug"')).toBeLessThan(app.indexOf('path="/:petType/:categorySlug"'));
    expect(home).toContain('to={`/brand/${brand.slug}`}');
    expect(home).not.toContain('/products?brand=');
    expect(footer).toContain('Shop by brand');
    expect(footer).toContain('/brand/${brand.slug}');
    expect(robots).toContain('Allow: /brand');
    expect(robots).toContain('Allow: /brand/merrick');
    expect(sitemapScript).toContain("'brand'");
  });

  test('backend shopBrands stay in sync', () => {
    const backend = readFileSync(
      join(dir, '../../../../backend/src/seo/shopBrands.ts'),
      'utf8'
    );
    for (const brand of SHOP_BRANDS) {
      expect(backend).toContain(`slug: '${brand.slug}'`);
      expect(backend).toContain(brand.query);
    }
    expect(backend).toContain('shopBrandTitle');
  });
});
