import { classifyRoute, INDEXABLE_LANDING_PATHS } from '../../../seo/routeClassifier';

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
});
