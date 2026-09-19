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

  test('bot HTML publishes Hicksville, Greenwich, and the 50-mile rule', () => {
    const html = buildNextDayZipDirectoryHtml();
    expect(NEXT_DAY_ZIP_COUNT).toBeGreaterThan(500);
    expect(html).toContain('11801');
    expect(html).toContain('Hicksville');
    expect(html).toContain('06830');
    expect(html).toContain('Greenwich');
    expect(html).toContain('11706');
    expect(html).toMatch(/50 miles of Queens/);
    expect(html).toMatch(/We do not claim same-day nationwide/);
    expect(html).not.toContain('11432');
  });

  test('sitemap lists /delivery-zips', () => {
    const sitemap = fs.readFileSync(
      path.join(__dirname, '../../../controllers/sitemapController.ts'),
      'utf8'
    );
    expect(sitemap).toContain("path: '/delivery-zips'");
  });
});
