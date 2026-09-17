import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, test } from 'vitest';

const appSource = readFileSync(
  join(dirname(fileURLToPath(import.meta.url)), 'App.tsx'),
  'utf8'
);

describe('App route elements', () => {
  test('every Route element component is imported or lazily defined', () => {
    const used = new Set(
      [...appSource.matchAll(/element=\{<(?:RequireAuth>)?([A-Z][A-Za-z0-9]+)/g)].map((m) => m[1])
    );
    const defined = new Set<string>([
      'Navigate',
      ...[...appSource.matchAll(/^import\s+(\w+)\s+from/gm)].map((m) => m[1]),
      ...[...appSource.matchAll(/^import\s+\{\s*([^}]+)\s*\}/gm)]
        .flatMap((m) => m[1].split(',').map((s) => s.trim().split(/\s+as\s+/).pop() || ''))
        .filter((s) => /^[A-Z]/.test(s)),
      ...[...appSource.matchAll(/^const\s+(\w+)\s+=\s+lazy\(/gm)].map((m) => m[1]),
      ...[...appSource.matchAll(/^function\s+(\w+)/gm)].map((m) => m[1]),
    ]);

    const missing = [...used].filter((name) => !defined.has(name)).sort();
    expect(missing, `Route elements with no import: ${missing.join(', ')}`).toEqual([]);
    expect(defined.has('PrivacyPolicy')).toBe(true);
    expect(defined.has('CookiePolicy')).toBe(true);
  });
});
