import fs from 'fs';
import path from 'path';
import { describe, expect, test } from 'vitest';

const walk = (dir: string, files: string[] = []) => {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === '__tests__' || entry.name === 'node_modules' || entry.name === 'dist') continue;
      walk(full, files);
      continue;
    }
    if (/\.(test|spec)\.(ts|tsx|js)$/.test(entry.name)) continue;
    if (/\.(ts|tsx|js|jsx|html|css)$/.test(entry.name)) files.push(full);
  }
  return files;
};

describe('private family coupon', () => {
  test('FAMILY15 is never shown on public storefront pages', () => {
    const src = path.resolve(__dirname, '../..');
    const hits = walk(src)
      .filter((file) => /FAMILY15/i.test(fs.readFileSync(file, 'utf8')))
      .map((file) => path.relative(src, file));

    expect(hits).toEqual([]);
  });

  test('private free-delivery test code is never shown on public storefront pages', () => {
    const src = path.resolve(__dirname, '../..');
    const hits = walk(src)
      .filter((file) => /TESTSHIP/i.test(fs.readFileSync(file, 'utf8')))
      .map((file) => path.relative(src, file));

    expect(hits).toEqual([]);
  });

  test('checkout only hints at the two public codes', () => {
    const checkout = fs.readFileSync(path.resolve(__dirname, '../../pages/Checkout.tsx'), 'utf8');
    expect(checkout).toContain('FIRST_ORDER_CODE');
    expect(checkout).toContain('REPEAT_ORDER_CODE');
    expect(checkout).not.toMatch(/FAMILY15/i);
    expect(checkout).not.toMatch(/TESTSHIP/i);
    expect(checkout).not.toMatch(/AUTOSHIP_COUPON/);
  });
});
