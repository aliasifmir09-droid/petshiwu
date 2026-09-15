import { escapeBareXmlAmpersands, escapeXml } from '../../controllers/sitemapController';

const scene7 =
  'https://s7d2.scene7.com/is/image/PetSmart/5284286?$sclp-prd-main_large$&fmt=jpeg&qlt=80';

describe('sitemap XML escaping', () => {
  test('escapes Scene7 query ampersands so GSC can parse the sitemap', () => {
    const loc = `<image:loc>${escapeXml(scene7)}</image:loc>`;
    expect(loc).toContain('&amp;fmt=jpeg&amp;qlt=80');
    expect(loc).not.toMatch(/&fmt=/);
  });

  test('final pass does not double-escape existing entities', () => {
    const xml = escapeBareXmlAmpersands(
      `<image:title>Hill&apos;s</image:title><image:loc>${escapeXml(scene7)}</image:loc>`
    );
    expect(xml).toContain('Hill&apos;s');
    expect(xml).toContain('&amp;fmt=jpeg');
    expect(xml).not.toContain('&amp;amp;');
  });

  test('the live failing image:loc line is repaired', () => {
    const broken = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
  <url>
    <loc>https://www.petshiwu.com/cat/veterinary-diets/example</loc>
    <image:image>
      <image:loc>${scene7}</image:loc>
      <image:title>Hill&apos;s Prescription Diet</image:title>
    </image:image>
  </url>
</urlset>`;
    expect(broken).toMatch(/&fmt=/);
    const fixed = escapeBareXmlAmpersands(broken);
    expect(fixed).not.toMatch(/&fmt=/);
    expect(fixed).toContain('&amp;fmt=jpeg&amp;qlt=80');
    expect(fixed).toContain('Hill&apos;s Prescription Diet');
  });
});
