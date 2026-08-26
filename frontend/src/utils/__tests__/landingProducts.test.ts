import { describe, expect, test } from 'vitest';
import { landingProductQuery } from '../landingProducts';

describe('landingProductQuery', () => {
  test('does not AND keyword soup or require a 4-star rating', () => {
    const query = landingProductQuery({ page: 1, sort: 'rating' });
    expect(query.search).toBeUndefined();
    expect(query.minRating).toBeUndefined();
    expect(query.featured).toBeUndefined();
    expect(query.inStock).toBe(true);
    expect(query.limit).toBe(20);
  });

  test('passes petType and category through for specialty landings', () => {
    expect(landingProductQuery({ page: 1, sort: 'rating', petType: 'dog' }).petType).toBe('dog');
    expect(
      landingProductQuery({ page: 2, sort: 'newest', category: 'toys' }).category
    ).toBe('toys');
  });
});
