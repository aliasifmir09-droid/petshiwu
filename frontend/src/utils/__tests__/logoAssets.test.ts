import { describe, expect, test } from 'vitest';
import fs from 'fs';
import path from 'path';
import sharp from 'sharp';
import { LOGO_BLUE } from '../../../scripts/generate-logo.mjs';

const publicDir = path.resolve(__dirname, '../../../public');

function hexToRgb(hex: string) {
  const n = hex.replace('#', '');
  return {
    r: parseInt(n.slice(0, 2), 16),
    g: parseInt(n.slice(2, 4), 16),
    b: parseInt(n.slice(4, 6), 16),
  };
}

function isNear(actual: number, expected: number, slack = 18) {
  return Math.abs(actual - expected) <= slack;
}

describe('Petshiwu logo assets', () => {
  test('favicon is a blue badge, not a white-on-white icon', async () => {
    const file = path.join(publicDir, 'favicon-32.png');
    expect(fs.existsSync(file)).toBe(true);
    const { data, info } = await sharp(file).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
    const i = ((2 * info.width) + 2) * info.channels;
    const expected = hexToRgb(LOGO_BLUE);
    expect(isNear(data[i], expected.r)).toBe(true);
    expect(isNear(data[i + 1], expected.g)).toBe(true);
    expect(isNear(data[i + 2], expected.b)).toBe(true);
    // Must not be a near-white pixel in the corner
    expect(data[i] + data[i + 1] + data[i + 2]).toBeLessThan(500);
  });

  test('wide wordmark sits on the same blue badge', async () => {
    const file = path.join(publicDir, 'logo.png');
    const { data, info } = await sharp(file).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
    const i = ((8 * info.width) + 20) * info.channels;
    const expected = hexToRgb(LOGO_BLUE);
    expect(isNear(data[i], expected.r)).toBe(true);
    expect(isNear(data[i + 1], expected.g)).toBe(true);
    expect(isNear(data[i + 2], expected.b)).toBe(true);
  });
});
