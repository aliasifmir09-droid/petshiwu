import fs from 'fs';
import path from 'path';
import { describe, expect, test } from 'vitest';
import {
  CATALOG_META_PROOF,
  HOMEPAGE_DESCRIPTION,
  HOMEPAGE_TITLE,
  ORGANIZATION_DESCRIPTION,
  WEBSITE_DESCRIPTION,
} from '../publicSeo';

const read = (relativePath: string) =>
  fs.readFileSync(path.resolve(__dirname, relativePath), 'utf8');

const indexHtml = read('../../../index.html');
const seo = read('../../components/SEO.tsx');
const home = read('../../pages/Home.tsx');
const app = read('../../App.tsx');
const social = read('../social.ts');
const categoryIcons = read('../../components/CategoryIcons.tsx');
const header = read('../../components/Header.tsx');
const footer = read('../../components/Footer.tsx');
const faq = read('../../pages/FAQ.tsx');
const products = read('../../pages/Products.tsx');
const category = read('../../pages/Category.tsx');
const petType = read('../../pages/PetType.tsx');
const seoUtils = read('../../utils/seoUtils.ts');
const structuredData = read('../../components/StructuredData.tsx');

describe('public SEO copy stays one launch story', () => {
  test('homepage Google snippet stays locked', () => {
    expect(HOMEPAGE_TITLE).toContain('Petshiwu | Pet Food & Supplies');
    expect(HOMEPAGE_DESCRIPTION).toContain('Nationwide shipping soon');
    expect(HOMEPAGE_DESCRIPTION).toContain('Same-day NYC');
    expect(HOMEPAGE_DESCRIPTION).not.toMatch(/start accepting orders soon/i);
    expect(indexHtml).toContain(HOMEPAGE_TITLE);
    expect(indexHtml).toContain(HOMEPAGE_DESCRIPTION);
    expect(home).toContain('HOMEPAGE_DESCRIPTION');
    expect(seo).toContain('HOMEPAGE_DESCRIPTION');
  });

  test('helmet can replace every overlapping static head tag', () => {
    expect(seo).toContain('prioritizeSeoTags');
    expect(indexHtml).toMatch(/<title data-rh="true">/);
    expect(indexHtml).toMatch(/data-rh="true" name="description"/);
    expect(indexHtml).toMatch(/data-rh="true" name="keywords"/);
    expect(indexHtml).toMatch(/data-rh="true" name="author"/);
    expect(indexHtml).toMatch(/data-rh="true" name="robots"/);
    expect(indexHtml).toMatch(/data-rh="true" property="og:url"/);
    expect(indexHtml).toMatch(/data-rh="true" property="og:image"/);
    expect(indexHtml).toMatch(/data-rh="true" name="twitter:card"/);
    expect(indexHtml).toMatch(/data-rh="true" name="twitter:image"/);
    expect(indexHtml).not.toContain('twitter:site');
    expect(seo).not.toContain('twitter:site');
    expect(seo).not.toContain('application/ld+json');
  });

  test('organization copy is NYC ops plus nationwide soon, not USA shipping now', () => {
    expect(ORGANIZATION_DESCRIPTION).toMatch(/nationwide shipping opening soon/i);
    expect(ORGANIZATION_DESCRIPTION).toMatch(/not a walk-in store/i);
    expect(ORGANIZATION_DESCRIPTION).not.toMatch(/across the USA/i);
    expect(ORGANIZATION_DESCRIPTION).not.toMatch(/fast shipping/i);
    expect(indexHtml).toContain(ORGANIZATION_DESCRIPTION);
    expect(indexHtml).toContain(WEBSITE_DESCRIPTION);
    expect(app).toContain('ORGANIZATION_DESCRIPTION');
    expect(app).toContain('AREA_SERVED_NOW');
    expect(app).not.toContain("'United States', 'New York City'");
    expect(home).not.toContain('type="localBusiness"');
    expect(home).not.toContain('type="organization"');
    expect(home).not.toContain('type="website"');
    expect(seoUtils).toContain('ORGANIZATION_DESCRIPTION');
    expect(seoUtils).toContain('AREA_SERVED_NOW');
    expect(structuredData).toContain('WEBSITE_DESCRIPTION');
  });

  test('catalog metadata does not claim live nationwide fast shipping', () => {
    expect(CATALOG_META_PROOF).toContain('Nationwide shipping soon');
    expect(CATALOG_META_PROOF).not.toMatch(/fast shipping/i);
    expect(products).toContain('CATALOG_META_PROOF');
    expect(category).toContain('CATALOG_META_PROOF');
    expect(petType).toContain('CATALOG_META_PROOF');
    expect(products).not.toMatch(/fast shipping/i);
    expect(category).not.toMatch(/fast shipping/i);
    expect(petType).not.toMatch(/fast shipping/i);
    expect(category).toContain('noindex={hasFilteredParams}');
  });

  test('static JSON-LD blocks stay valid and drop dead Twitter URLs', () => {
    const blocks = [...indexHtml.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)];
    expect(blocks.length).toBeGreaterThanOrEqual(3);
    for (const block of blocks) {
      const parsed = JSON.parse(block[1]);
      const sameAs = JSON.stringify(parsed.sameAs || []);
      expect(sameAs).not.toContain('twitter.com');
      expect(sameAs).not.toContain('youtube.com');
      const blob = JSON.stringify(parsed);
      expect(blob).not.toMatch(/across the USA/i);
    }
    expect(social).not.toContain('twitter.com/petshiwu');
    expect(social).not.toContain('youtube.com/@petshiwu');
    expect(indexHtml).not.toContain('twitter.com/petshiwu');
    expect(indexHtml).not.toContain('youtube.com/@petshiwu');
    expect(app).not.toContain('twitter.com/petshiwu');
    expect(footer).toContain('FOOTER_SOCIAL');
    expect(footer).not.toContain('youtube.com');
  });

  test('search, newsletter, FAQ, and category images have accessible names', () => {
    expect(header).toContain('Search products or identify a product from a bag photo');
    expect(footer).toContain('Email address for delivery updates');
    expect(faq).toContain('Search frequently asked questions');
    expect(faq).toContain('FAQ category');
    expect(faq).toContain('id={`faq-answer-${faq._id}`}');
    expect(categoryIcons).toContain('alt={category.title}');
    expect(categoryIcons).not.toContain('alt=""');
  });
});
