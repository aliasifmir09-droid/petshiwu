import { describe, expect, test } from 'vitest';
import { generateOGImage } from '../seoUtils';

describe('generateOGImage', () => {
  test('defaults to the branded 1200x630 share image', () => {
    expect(generateOGImage()).toBe('https://www.petshiwu.com/og-image.jpg');
    expect(generateOGImage(undefined)).toBe('https://www.petshiwu.com/og-image.jpg');
  });

  test('keeps absolute product photos', () => {
    expect(generateOGImage('https://cdn.example.com/food.jpg')).toBe(
      'https://cdn.example.com/food.jpg'
    );
  });

  test('prefixes relative paths', () => {
    expect(generateOGImage('/og-image.jpg')).toBe('https://www.petshiwu.com/og-image.jpg');
  });
});
