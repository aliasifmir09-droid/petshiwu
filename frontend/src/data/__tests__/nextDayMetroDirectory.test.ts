import { describe, expect, test } from 'vitest';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { filterNextDayGroups, groupNextDayZipsByState, NEXT_DAY_ZIP_COUNT } from '../nextDayMetroDirectory';

const dir = dirname(fileURLToPath(import.meta.url));

describe('next-day ZIP directory', () => {
  test('groups 601 metro ZIPs by NY, NJ, and CT', () => {
    const groups = groupNextDayZipsByState();
    expect(NEXT_DAY_ZIP_COUNT).toBeGreaterThan(500);
    expect(groups.map((group) => group.state)).toEqual(['NY', 'NJ', 'CT']);
    const hicksville = groups[0].cities.find((city) => city.city === 'Hicksville');
    expect(hicksville?.zips).toContain('11801');
    const greenwich = groups[2].cities.find((city) => city.city === 'Greenwich');
    expect(greenwich?.zips).toContain('06830');
    expect(groups.flatMap((group) => group.cities.flatMap((city) => city.zips))).not.toContain('11432');
  });

  test('the public page publishes the ZIP list and is routed', () => {
    const page = readFileSync(join(dir, '../../pages/NextDayDeliveryZips.tsx'), 'utf8');
    const app = readFileSync(join(dir, '../../App.tsx'), 'utf8');
    const sitemapScript = readFileSync(join(dir, '../../../scripts/generate-sitemap.js'), 'utf8');
    expect(app).toContain('/delivery-zips');
    expect(page).toContain('url="/delivery-zips"');
    expect(page).toContain('{NEXT_DAY_RADIUS_MILES} miles of Queens');
    expect(page).toContain('50 Miles of Queens');
    expect(page).toMatch(/Nationwide shipping soon/);
    expect(page).not.toMatch(/do not claim/i);
    expect(page).toContain('NEXT_DAY_ZIP_COUNT');
    expect(sitemapScript).toContain("'delivery-zips'");
  });

  test('search finds Hicksville, Greenwich, and Bay Shore and skips Queens Hillside', () => {
    const groups = groupNextDayZipsByState();
    const hicksville = filterNextDayGroups(groups, '11801');
    expect(hicksville).toHaveLength(1);
    expect(hicksville[0].cities[0]).toMatchObject({ city: 'Hicksville', zips: expect.arrayContaining(['11801']) });

    const greenwich = filterNextDayGroups(groups, '06830');
    expect(greenwich.some((group) => group.cities.some((city) => city.city === 'Greenwich' && city.zips.includes('06830')))).toBe(true);

    const bayShore = filterNextDayGroups(groups, '11706');
    expect(bayShore.some((group) => group.cities.some((city) => city.city === 'Bay Shore' && city.zips.includes('11706')))).toBe(true);

    expect(filterNextDayGroups(groups, '11432')).toEqual([]);
    expect(filterNextDayGroups(groups, 'Greenwich')[0]?.cities.some((city) => city.city === 'Greenwich')).toBe(true);
  });
});
