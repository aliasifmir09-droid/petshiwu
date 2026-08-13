import { describe, expect, test } from 'vitest';
import { slideDisplaySrc } from '../slideImage';

describe('hero slideshow assets', () => {
  test('uses compressed webp instead of the 1.8MB birthday PNG', () => {
    expect(
      slideDisplaySrc({ src: '/banner-birthday.png', webp: '/banner-birthday.webp' })
    ).toBe('/banner-birthday.webp');
  });

  test('keeps jpg when no real webp exists', () => {
    expect(
      slideDisplaySrc({ src: '/banner-worldcup-1.jpg', webp: '/banner-worldcup-1.jpg' })
    ).toBe('/banner-worldcup-1.jpg');
  });
});
