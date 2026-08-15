import fs from 'fs';
import path from 'path';
import {
  canonicalPetSlug,
  classifyRoute,
  CRAWLABLE_STOREFRONT_PATHS,
  INDEXABLE_LANDING_PATHS,
} from '../../../seo/routeClassifier';

describe('classifyRoute', () => {
  test('homepage and shop pages stay indexable', () => {
    expect(classifyRoute('/').indexable).toBe(true);
    expect(classifyRoute('/dog').indexable).toBe(true);
    expect(classifyRoute('/products').indexable).toBe(true);
  });

  test('NYC landing pages are indexable, not doorways', () => {
    expect(classifyRoute('/dog-food-delivery-nyc')).toMatchObject({
      indexable: true,
      status: 'indexable',
      routeType: 'landing',
    });
    expect(classifyRoute('/best-dog-food-sensitive-stomach-diarrhea').indexable).toBe(true);
    expect(classifyRoute('/pet-supplies-queens-ny').indexable).toBe(true);
    expect(INDEXABLE_LANDING_PATHS.size).toBeGreaterThan(10);
  });

  test('search and neural are noindex utility pages', () => {
    expect(classifyRoute('/search')).toMatchObject({ indexable: false, status: 'noindex' });
    expect(classifyRoute('/neural')).toMatchObject({ indexable: false, status: 'noindex' });
    expect(classifyRoute('/scan')).toMatchObject({ indexable: false, status: 'noindex' });
  });

  test('unknown keyword URLs stay noindex doorways', () => {
    expect(classifyRoute('/cheap-dog-food-delivery-nyc')).toMatchObject({
      indexable: false,
      routeType: 'doorway',
    });
  });

  test('query variants are noindex', () => {
    expect(classifyRoute('/dog?sort=price-asc').indexable).toBe(false);
  });

  test('thin neighborhood copies redirect to a real landing page', () => {
    expect(classifyRoute('/dog-food-delivery-flushing-queens')).toMatchObject({
      indexable: false,
      status: 'redirect',
      redirectTo: '/dog-food-delivery-nyc',
      routeType: 'neighborhood-redirect',
    });
    expect(classifyRoute('/cat-food-delivery-williamsburg-brooklyn').redirectTo).toBe(
      '/cat-food-delivery-nyc'
    );
  });
});

describe('full-site crawl list', () => {
  test('every storefront path is indexable', () => {
    for (const pagePath of CRAWLABLE_STOREFRONT_PATHS) {
      expect(classifyRoute(pagePath)).toMatchObject({
        indexable: true,
        status: 'indexable',
      });
    }
  });

  test('robots.txt explicitly allows every NYC landing and shop page', () => {
    const robots = fs.readFileSync(
      path.join(__dirname, '../../../../../frontend/public/robots.txt'),
      'utf8'
    );
    expect(robots).toContain('Allow: /');
    expect(robots).toContain('Sitemap: https://www.petshiwu.com/sitemap.xml');
    for (const pagePath of CRAWLABLE_STOREFRONT_PATHS) {
      if (pagePath === '/') continue;
      expect(robots).toContain(`Allow: ${pagePath}`);
    }
  });

  test('small-pet catalog URLs canonicalize to /small-animal', () => {
    expect(canonicalPetSlug('small-pet')).toBe('small-animal');
    expect(canonicalPetSlug('dog')).toBe('dog');
  });
});
