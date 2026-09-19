import { describe, expect, test } from 'vitest';
import {
  escapeBareXmlAmpersands,
  sanitizeLegacySitemapEntries,
  validateSitemapXml,
} from './generate-sitemap.js';

const imageUrl = 'https://s7d2.scene7.com/is/image/PetSmart/5379608?$sclp-prd-main_large$&fmt=jpeg&qlt=80';

describe('generate-sitemap sanitizer', () => {
  test('escapes bare ampersands in Scene7 image URLs', () => {
    const escaped = escapeBareXmlAmpersands(`<image:loc>${imageUrl}</image:loc>`);
    expect(escaped).toContain('&amp;fmt=jpeg&amp;qlt=80');
    expect(escaped).not.toMatch(/&fmt=/);
  });

  test('keeps already-escaped entities', () => {
    expect(escapeBareXmlAmpersands('Hill&amp;apos;s')).toBe('Hill&amp;apos;s');
  });

  test('validates a urlset after escaping image query strings', () => {
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
  <url>
    <loc>https://www.petshiwu.com/about</loc>
    <image:image>
      <image:loc>${imageUrl}</image:loc>
    </image:image>
  </url>
</urlset>
`;
    const { xml: sanitized } = sanitizeLegacySitemapEntries(xml);
    expect(() => validateSitemapXml(sanitized)).not.toThrow();
  });

  test('keeps the next-day ZIP directory in the sitemap', () => {
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url><loc>https://www.petshiwu.com/delivery-zips</loc></url>
</urlset>
`;
    const { xml: sanitized, removed } = sanitizeLegacySitemapEntries(xml);
    expect(removed).toBe(0);
    expect(sanitized).toContain('https://www.petshiwu.com/delivery-zips');
  });
});
