import fs from 'fs';
import path from 'path';
import { buildNextDayZipDirectoryHtml, NEXT_DAY_ZIP_COUNT } from '../../../seo/nextDayZipDirectory';
import { classifyRoute } from '../../../seo/routeClassifier';

describe('next-day ZIP directory for Google', () => {
  test('/delivery-zips is indexable', () => {
    expect(classifyRoute('/delivery-zips')).toMatchObject({
      indexable: true,
      status: 'indexable',
      canonicalPath: '/delivery-zips',
    });
  });

  test('bot HTML publishes NYC same-day only and closes the metro list', () => {
    const html = buildNextDayZipDirectoryHtml();
    expect(NEXT_DAY_ZIP_COUNT).toBeGreaterThan(500);
    expect(html).toMatch(/Same-day delivery in New York City/);
    expect(html).toMatch(/eligible for same-day delivery/i);
    expect(html).toMatch(/NYC same-day only/);
    expect(html).toMatch(/Nationwide shipping in 3-5 business days on shipped items/);
    expect(html).not.toMatch(/accepts orders for next-day/i);
    expect(html).not.toContain('11801');
    expect(html).not.toContain('Hicksville');
    expect(html).not.toMatch(/do not claim/i);
  });

  test('sitemap lists /delivery-zips', () => {
    const sitemap = fs.readFileSync(
      path.join(__dirname, '../../../controllers/sitemapController.ts'),
      'utf8'
    );
    expect(sitemap).toContain("path: '/delivery-zips'");
  });
});
