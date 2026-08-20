import { describe, expect, test } from 'vitest';
import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

const publicDir = path.resolve(__dirname, '../../../public');
const sourceFile = path.resolve(__dirname, '../../../scripts/logo-source.png');

function pixel(data: Buffer, width: number, channels: number, x: number, y: number) {
  const i = (y * width + x) * channels;
  return [data[i], data[i + 1], data[i + 2], data[i + 3]];
}

function isWhite(p: number[]) {
  return p[0] > 230 && p[1] > 230 && p[2] > 230 && p[3] > 200;
}

async function readRgba(file: string) {
  const { data, info } = await sharp(file).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  return { data, info, get: (x: number, y: number) => pixel(data, info.width, info.channels, x, y) };
}

describe('Petshiwu logo assets', () => {
  test('keeps the real cropped Petshiwü artwork as the source', () => {
    expect(fs.existsSync(sourceFile)).toBe(true);
  });

  test('favicon is a blue tile with the real capital P, not a white icon', async () => {
    const { info, get } = await readRgba(path.join(publicDir, 'favicon-32.png'));
    expect(info.width).toBe(32);
    const corner = get(2, 2);
    expect(corner[2]).toBeGreaterThan(140);
    expect(corner[0] + corner[1] + corner[2]).toBeLessThan(520);
    expect(corner[2]).toBeGreaterThan(corner[0]);
    expect(isWhite(get(16, 16))).toBe(true);

    const whites: Array<[number, number]> = [];
    for (let y = 0; y < info.height; y++) {
      for (let x = 0; x < info.width; x++) {
        if (isWhite(get(x, y))) whites.push([x, y]);
      }
    }
    const maxX = Math.max(...whites.map(([x]) => x));
    expect(whites.length).toBeGreaterThan(80);
    // Isolated P — a chopped next letter would push white to the right edge.
    expect(maxX).toBeLessThan(info.width - 8);
  });

  test('wide wordmark is the real letters on a blue-to-purple pill', async () => {
    const file = path.join(publicDir, 'logo.png');
    const { info, get } = await readRgba(file);
    expect(info.width).toBe(720);
    expect(info.height).toBe(148);

    const left = get(20, Math.floor(info.height / 2));
    const right = get(info.width - 21, Math.floor(info.height / 2));
    const center = get(Math.floor(info.width / 2), Math.floor(info.height / 2));
    const corner = get(0, 0);

    expect(left[2]).toBeGreaterThan(180);
    expect(left[2]).toBeGreaterThan(left[0]);
    expect(right[0]).toBeGreaterThan(70);
    expect(right[2]).toBeGreaterThan(180);
    expect(isWhite(center)).toBe(true);
    expect(corner[3]).toBe(0);
  });

  test('square icon fills the tile so Google does not show a black box', async () => {
    const { info, get } = await readRgba(path.join(publicDir, 'logo-square-192.png'));
    const corner = get(0, 0);
    const center = get(96, 96);
    expect(corner[3]).toBeGreaterThan(200);
    expect(corner[2]).toBeGreaterThan(140);
    expect(isWhite(center)).toBe(true);
    expect(info.width).toBe(192);
  });
});
