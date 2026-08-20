/**
 * Build site logos from the real Petshiwü wordmark (heart on i, paw on ü).
 * Crop tight, knock out the black field, sit it on the same navy as the
 * header (`#1E3A8A`) so the white letters match Support / Sign In.
 * Google still gets a filled badge, not a white icon. Do not replace the
 * lettering with a new font.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import sharp from 'sharp';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outDir = path.resolve(__dirname, '../public');
const SOURCE = path.join(__dirname, 'logo-source.png');

// Same navy as Header: bg-gradient-to-r from-[#1E3A8A] via-[#2563EB]
export const LOGO_BLUE = '#1E3A8A';
const GRADIENT_LEFT = '#1E3A8A';
const GRADIENT_RIGHT = '#1E3A8A';

async function wordmarkCutout() {
  const img = sharp(SOURCE).ensureAlpha();
  const { data, info } = await img.raw().toBuffer({ resolveWithObject: true });
  let minX = info.width;
  let minY = info.height;
  let maxX = 0;
  let maxY = 0;
  for (let y = 0; y < info.height; y++) {
    for (let x = 0; x < info.width; x++) {
      const i = (y * info.width + x) * info.channels;
      const lum = (data[i] + data[i + 1] + data[i + 2]) / 3;
      if (lum > 48 && data[i + 3] > 20) {
        data[i] = 255;
        data[i + 1] = 255;
        data[i + 2] = 255;
        data[i + 3] = 255;
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      } else {
        data[i] = 0;
        data[i + 1] = 0;
        data[i + 2] = 0;
        data[i + 3] = 0;
      }
    }
  }
  const pad = 8;
  const left = Math.max(0, minX - pad);
  const top = Math.max(0, minY - pad);
  const width = Math.min(info.width - left, maxX - minX + 1 + pad * 2);
  const height = Math.min(info.height - top, maxY - minY + 1 + pad * 2);
  const cutout = await sharp(data, { raw: info }).extract({ left, top, width, height }).png().toBuffer();
  return { cutout, width, height, left, top };
}

function badgeSvg(width, height, radius, fillFull = false) {
  if (fillFull) {
    return Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">
      <defs>
        <linearGradient id="g" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stop-color="${GRADIENT_LEFT}"/>
          <stop offset="100%" stop-color="${GRADIENT_RIGHT}"/>
        </linearGradient>
      </defs>
      <rect width="${width}" height="${height}" fill="url(#g)"/>
    </svg>`);
  }
  return Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">
    <defs>
      <linearGradient id="g" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%" stop-color="${GRADIENT_LEFT}"/>
        <stop offset="100%" stop-color="${GRADIENT_RIGHT}"/>
      </linearGradient>
    </defs>
    <rect width="${width}" height="${height}" rx="${radius}" fill="url(#g)"/>
  </svg>`);
}

async function placeOnBadge(cutout, { width, height, radius, fillFull = false, fitWidth, fitHeight, lift = 0 }) {
  const fitted = await sharp(cutout)
    .resize({ width: fitWidth, height: fitHeight, fit: 'inside' })
    .png()
    .toBuffer();
  const fm = await sharp(fitted).metadata();
  const left = Math.round((width - fm.width) / 2);
  const top = Math.max(0, Math.round((height - fm.height) / 2) - lift);
  return sharp(badgeSvg(width, height, radius, fillFull))
    .ensureAlpha()
    .composite([{ input: fitted, left, top }])
    .png({ compressionLevel: 9 })
    .toBuffer();
}

async function letterPCutout(cutout) {
  const { data, info } = await sharp(cutout).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const colCounts = new Array(info.width).fill(0);
  for (let y = 0; y < info.height; y++) {
    for (let x = 0; x < info.width; x++) {
      const i = (y * info.width + x) * info.channels;
      if (data[i + 3] > 20 && (data[i] + data[i + 1] + data[i + 2]) / 3 > 48) {
        colCounts[x] += 1;
      }
    }
  }
  // Valley between P and e: fill drops, then the next letter rises.
  let pEnd = Math.round(info.width * (154 / 1109));
  for (let x = 40; x < Math.min(info.width - 2, 220); x++) {
    if (colCounts[x] <= 62 && colCounts[x + 2] >= colCounts[x] + 12) {
      pEnd = x + 2; // first column of the next letter
      break;
    }
  }
  let minX = info.width;
  let minY = info.height;
  let maxX = 0;
  let maxY = 0;
  for (let y = 0; y < info.height; y++) {
    for (let x = 0; x < pEnd; x++) {
      const i = (y * info.width + x) * info.channels;
      if (data[i + 3] > 20 && (data[i] + data[i + 1] + data[i + 2]) / 3 > 48) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }
  const pad = 6;
  const left = minX;
  const top = Math.max(0, minY - pad);
  const right = Math.min(pEnd, maxX + 1);
  const bottom = Math.min(info.height, maxY + pad);
  return sharp(cutout)
    .extract({ left, top, width: Math.max(1, right - left), height: Math.max(1, bottom - top) })
    .png()
    .toBuffer();
}

export async function generateLogos() {
  const { cutout } = await wordmarkCutout();

  // Wide header / Google wordmark: tight crop, real letters fill the pill.
  const wideW = 720;
  const wideH = 148;
  const wide = await placeOnBadge(cutout, {
    width: wideW,
    height: wideH,
    radius: Math.round(wideH * 0.28),
    fitWidth: Math.round(wideW * 0.94),
    fitHeight: Math.round(wideH * 0.84),
    lift: 1,
  });
  await sharp(wide).png().toFile(path.join(outDir, 'logo.png'));
  await sharp(wide).webp({ quality: 92 }).toFile(path.join(outDir, 'logo.webp'));

  // Square app / schema icons: full wordmark, filled tile (no black corners).
  const square = await placeOnBadge(cutout, {
    width: 512,
    height: 512,
    radius: 0,
    fillFull: true,
    fitWidth: Math.round(512 * 0.90),
    fitHeight: Math.round(512 * 0.42),
    lift: Math.round(512 * 0.02),
  });
  await sharp(square).png().toFile(path.join(outDir, 'logo-square.png'));
  await sharp(square).resize(192, 192).png().toFile(path.join(outDir, 'logo-square-192.png'));
  await sharp(square).resize(512, 512).png().toFile(path.join(outDir, 'logo-square-512.png'));

  // Favicon: real P from the wordmark on a filled blue tile so Google never sees white.
  const p = await letterPCutout(cutout);
  for (const size of [16, 32, 48]) {
    const icon = await placeOnBadge(p, {
      width: size * 8,
      height: size * 8,
      radius: 0,
      fillFull: true,
      fitWidth: Math.round(size * 8 * 0.58),
      fitHeight: Math.round(size * 8 * 0.70),
    });
    await sharp(icon).resize(size, size).png().toFile(path.join(outDir, `favicon-${size}.png`));
  }
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  if (!fs.existsSync(SOURCE)) {
    throw new Error(`Missing ${SOURCE}`);
  }
  await generateLogos();
  console.log('Wrote cropped Petshiwü logo files to', outDir);
}
