import { describe, expect, test } from 'vitest';
import { PET_CATEGORIES, PUG_IN_DENIM_UNSPLASH } from '../shopByPet';

describe('shop by pet photos', () => {
  test('every circle uses a local photo, not a remote Unsplash URL', () => {
    for (const pet of PET_CATEGORIES) {
      expect(pet.image.startsWith('/pets/')).toBe(true);
      expect(pet.image).not.toContain('unsplash.com');
    }
  });

  test('reptile is a bearded dragon file, not the pug-in-denim photo', () => {
    const reptile = PET_CATEGORIES.find((pet) => pet.slug === 'reptile');
    expect(reptile?.image).toBe('/pets/reptile.jpg');
    expect(reptile?.image).not.toContain(PUG_IN_DENIM_UNSPLASH);
  });
});
