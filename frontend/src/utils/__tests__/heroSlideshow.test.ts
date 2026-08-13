import { describe, expect, test } from 'vitest';
import { slideDisplaySrc } from '../slideImage';

describe('hero slideshow assets', () => {
  test('uses compressed webp instead of the 1.8MB birthday PNG', () => {
    expect(
      slideDisplaySrc({ src: '/banner-birthday.png', webp: '/banner-birthday.webp' })
    ).toBe('/banner-birthday.webp');
  });

  test('prefers webp for the new 16:9 campaign banners', () => {
    expect(
      slideDisplaySrc({ src: '/banner-nyc-tonight.jpg', webp: '/banner-nyc-tonight.webp' })
    ).toBe('/banner-nyc-tonight.webp');
  });

  test('keeps jpg when no real webp exists', () => {
    expect(
      slideDisplaySrc({ src: '/banner-legacy.jpg', webp: '/banner-legacy.jpg' })
    ).toBe('/banner-legacy.jpg');
  });
});
