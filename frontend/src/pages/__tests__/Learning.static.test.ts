import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, test } from 'vitest';

const dir = dirname(fileURLToPath(import.meta.url));
const learning = readFileSync(join(dir, '../Learning.tsx'), 'utf8');

describe('Learning hub lists the full education library', () => {
  test('uses server pagination instead of a local 80-card merge', () => {
    expect(learning).toContain('pagination?.total');
    expect(learning).toContain('limit: PAGE_SIZE');
    expect(learning).not.toContain('mergeBlogLists');
    expect(learning).not.toMatch(/limit:\s*50/);
  });

  test('tells shoppers they can page through every published article', () => {
    expect(learning).toMatch(/full education library/i);
    expect(learning).toContain('toLocaleString()');
  });
});
