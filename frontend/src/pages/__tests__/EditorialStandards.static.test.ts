import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, test } from 'vitest';

const dir = dirname(fileURLToPath(import.meta.url));
const app = readFileSync(join(dir, '../../App.tsx'), 'utf8');
const home = readFileSync(join(dir, '../Home.tsx'), 'utf8');
const editorial = readFileSync(join(dir, '../EditorialStandards.tsx'), 'utf8');
const detail = readFileSync(join(dir, '../BlogDetail.tsx'), 'utf8');

describe('Google attention surfaces', () => {
  test('home and routes publish the new playbook and editorial page', () => {
    expect(home).toContain('HomeFeaturedLearning');
    expect(home).toContain('NycHubLinkGrid');
    expect(app).toContain('/editorial-standards');
    expect(editorial).toContain('Fall 2026 pet care playbook');
    expect(editorial).toContain('next-day delivery guide');
    expect(editorial).toMatch(/do not delete/i);
  });

  test('articles link to related guides instead of noindex search tags', () => {
    expect(detail).toContain('relatedLearningPosts');
    expect(detail).toContain('Keep reading');
    expect(detail).not.toMatch(/learning\?search=/);
  });
});
