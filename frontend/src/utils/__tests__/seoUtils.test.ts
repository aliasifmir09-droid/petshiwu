import { describe, expect, test } from 'vitest';
import { generateOGImage, productSearchDescription } from '../seoUtils';

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

describe('productSearchDescription', () => {
  test('stays at or under 160 characters and does not cut mid-word', () => {
    const longWord = 'Supercalifragilisticexpialidocious';
    const description = `${longWord} chicken recipe with pumpkin for sensitive stomachs and everyday feeding across New York City apartments and busy households.`;
    const snippet = productSearchDescription({
      description,
      brand: 'Hill\'s Science Diet',
      name: 'Adult Sensitive Stomach',
      petType: 'dog',
    });
    expect(snippet.length).toBeLessThanOrEqual(160);
    expect(snippet).not.toMatch(/Supercalifragilisticexpialidocio[^s]/);
    expect(snippet).toMatch(/Same-day NYC delivery/);
    expect(snippet).toMatch(/Free shipping over \$49/);
  });

  test('builds a fallback snippet when the product has no description', () => {
    const snippet = productSearchDescription({
      brand: 'Royal Canin',
      name: 'Indoor Adult Cat Food',
      petType: 'cat',
    });
    expect(snippet.length).toBeLessThanOrEqual(160);
    expect(snippet).toMatch(/Royal Canin Indoor Adult Cat Food/);
    expect(snippet).toMatch(/Same-day NYC delivery/);
  });
});
