import fs from 'fs';
import path from 'path';
import { describe, expect, test } from 'vitest';

describe('FAQ answers stay in the document', () => {
  const src = fs.readFileSync(path.resolve(__dirname, '../FAQ.tsx'), 'utf8');

  test('collapsed answers use sr-only instead of the hidden attribute', () => {
    expect(src).toContain('sr-only');
    expect(src).not.toMatch(/hidden=\{!isExpanded\}/);
  });

  test('transactional questions stay in FAQPage JSON-LD', () => {
    expect(src).toContain('FAQPage');
    expect(src).toContain('itemProp="text"');
    expect(src).toContain('aria-expanded');
    expect(src).toContain('aria-controls');
  });
});
