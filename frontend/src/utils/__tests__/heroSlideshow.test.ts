import { describe, expect, test } from 'vitest';
import { slideDisplaySrc } from '../slideImage';
import { HERO_SLIDES } from '../../components/HeroSlideshow';

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

  test('first-screen banners are store slides only — no Neural or birthday theater', () => {
    const links = HERO_SLIDES.map((slide) => slide.link);
    const ids = HERO_SLIDES.map((slide) => slide.id);
    expect(links.every((link) => link === '/products')).toBe(true);
    expect(ids).not.toContain('slide-neural');
    expect(ids).not.toContain('slide-2');
    expect(HERO_SLIDES[0].id).toBe('slide-nyc-tonight');
  });
});
