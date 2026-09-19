import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, test } from 'vitest';

const dir = dirname(fileURLToPath(import.meta.url));
const page = readFileSync(join(dir, '../Brand.tsx'), 'utf8');
const app = readFileSync(join(dir, '../../App.tsx'), 'utf8');

describe('brand collection pages', () => {
  test('brand URLs are routed before the pet/category catch-all', () => {
    expect(app).toContain('path="/brand"');
    expect(app).toContain('path="/brand/:slug"');
    expect(app.indexOf('path="/brand/:slug"')).toBeLessThan(app.indexOf('path="/:petType/:categorySlug"'));
  });

  test('the page is indexable, shoppable, and keeps nationwide soon', () => {
    expect(page).toContain('noindex={hasQueryVariant}');
    expect(page).not.toMatch(/noindex=\{true\}/);
    expect(page).toContain('id="in-stock"');
    expect(page).toContain('ProductCard');
    expect(page).toContain('Nationwide shipping soon');
    expect(page).not.toMatch(/do not claim/i);
    expect(page).toContain("getShopBrand(slug)");
  });
});
