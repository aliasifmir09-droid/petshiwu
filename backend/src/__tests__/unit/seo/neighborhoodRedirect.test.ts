import { CANONICAL_NEIGHBORHOOD_CATEGORIES, neighborhoodLandingPath } from '../../../seo/neighborhoodRegistry';

describe('neighborhood landing redirects', () => {
  test('every matrix category maps to a real path', () => {
    for (const category of CANONICAL_NEIGHBORHOOD_CATEGORIES) {
      const target = neighborhoodLandingPath(category.slug);
      expect(target.startsWith('/')).toBe(true);
      expect(target).not.toContain('delivery-flushing');
    }
  });

  test('dog food copies go to the NYC dog food page', () => {
    expect(neighborhoodLandingPath('dog-food-delivery')).toBe('/dog-food-delivery-nyc');
    expect(neighborhoodLandingPath('raw-dog-food-delivery')).toBe('/raw-dog-food-nyc');
  });
});
