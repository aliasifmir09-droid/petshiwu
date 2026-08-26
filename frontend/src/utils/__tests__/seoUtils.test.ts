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
    const description =
      "Hill's Science Diet Adult Sensitive Stomach & Skin Chicken Recipe dry dog food is formulated for dogs with food sensitivities and everyday feeding in New York City apartments.";
    const snippet = productSearchDescription({
      description,
      brand: "Hill's Science Diet",
      name: 'Adult Sensitive Stomach',
      petType: 'dog',
    });
    expect(snippet.length).toBeLessThanOrEqual(160);
    expect(snippet).toMatch(/Same-day NYC delivery/);
    expect(snippet).toMatch(/Free shipping over \$49/);
    const body = snippet.replace(/\s*Same-day NYC delivery\. Free shipping over \$49\.?$/, '').trim();
    const lastWord = body.split(/\s+/).pop()?.replace(/[.,;:]+$/, '') ?? '';
    expect(lastWord.length).toBeGreaterThan(2);
    expect(description.split(/\s+/).map((w) => w.replace(/[.,;:]+$/, ''))).toContain(lastWord);
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
