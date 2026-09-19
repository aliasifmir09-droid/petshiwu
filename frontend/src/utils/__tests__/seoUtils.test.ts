import { describe, expect, test } from 'vitest';
import {
  generateBreadcrumbSchema,
  generateFAQSchema,
  generateOGImage,
  productSearchDescription,
  productSearchTitle,
} from '../seoUtils';

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
    expect(snippet).toMatch(/In stock/);
    expect(snippet).toMatch(/Free shipping over \$49/);
    expect(snippet).toMatch(/No autoship/);
    const body = snippet.replace(/\s*In stock\.\s*Free shipping over \$49\. No autoship\.?$/, '').trim();
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
    expect(snippet).toMatch(/In stock/);
    expect(snippet).toMatch(/Free shipping over \$49/);
  });
});

describe('productSearchTitle', () => {
  test('keeps the Hill\'s product name and adds in-stock free shipping instead of ellipsis', () => {
    const title = productSearchTitle({
      name: "Hill's Science Diet Sensitive Stomach & Skin Adult Dry Dog Food Chicken and Barley",
      brand: "Hill's Science Diet",
      inStock: true,
    });
    expect(title).not.toContain('...');
    expect(title).toContain("Hill's Science Diet Sensitive Stomach");
    expect(title).toMatch(/In stock/);
    expect(title).toMatch(/free ship \$49\+/);
    expect(title).toMatch(/Petshiwu/);
  });

  test('prefixes brand when the name does not already include it', () => {
    const title = productSearchTitle({
      name: 'Sensitive Stomach & Skin Adult Dry Dog Food',
      brand: "Hill's Science Diet",
    });
    expect(title.startsWith("Hill's Science Diet Sensitive Stomach")).toBe(true);
  });
});

describe('article JSON-LD helpers', () => {
  test('generateFAQSchema uses Question / acceptedAnswer mainEntity', () => {
    const schema = generateFAQSchema([
      { question: 'How often should I feed my dog?', answer: 'Most adult dogs do well with two meals a day.' },
    ]) as { '@type': string; mainEntity: Array<{ '@type': string; name: string }> };
    expect(schema['@type']).toBe('FAQPage');
    expect(schema.mainEntity[0]).toMatchObject({
      '@type': 'Question',
      name: 'How often should I feed my dog?',
    });
  });

  test('generateBreadcrumbSchema lists Home → Learning → article', () => {
    const schema = generateBreadcrumbSchema([
      { name: 'Home', url: '/' },
      { name: 'Learning', url: '/learning' },
      { name: 'How to Groom a Cat', url: '/learning/how-to-groom-a-cat' },
    ]) as { '@type': string; itemListElement: Array<{ name: string; item: string }> };
    expect(schema['@type']).toBe('BreadcrumbList');
    expect(schema.itemListElement[1].item).toBe('https://www.petshiwu.com/learning');
    expect(schema.itemListElement[2].name).toBe('How to Groom a Cat');
  });
});

