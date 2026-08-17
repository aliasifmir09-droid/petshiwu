/**
 * Build Petshiwu logo files: Chewy-like (bold, blue, high contrast) but original.
 * Do not copy Chewy's y-tail trademark. Blue badge + white rounded wordmark.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import sharp from 'sharp';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outDir = path.resolve(__dirname, '../public');

export const LOGO_BLUE = '#0067C7';
export const LOGO_ORANGE = '#F5A524';

function wordmarkSvg({ width, height, fill, textFill, showHeart = true }) {
  const fontSize = Math.round(height * 0.46);
  const y = Math.round(height * 0.66);
  const heartR = Math.max(4, Math.round(fontSize * 0.09));
  // Approximate "petshi" width in Inter Bold to sit the heart on the i.
  const heartX = Math.round(width * 0.545);
  const heartY = Math.round(height * 0.32);
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <rect width="${width}" height="${height}" rx="${Math.round(height * 0.28)}" fill="${fill}"/>
  <text x="50%" y="${y}" text-anchor="middle" font-family="Inter" font-weight="700" font-size="${fontSize}" fill="${textFill}" letter-spacing="-1">petshiwu</text>
  ${showHeart ? `<circle cx="${heartX}" cy="${heartY}" r="${heartR}" fill="${LOGO_ORANGE}"/>` : ''}
</svg>`;
}

function markSvg(size) {
  const r = Math.round(size * 0.22);
  const fontSize = Math.round(size * 0.58);
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <rect width="${size}" height="${size}" rx="${r}" fill="${LOGO_BLUE}"/>
  <text x="50%" y="54%" text-anchor="middle" dominant-baseline="middle" font-family="Inter" font-weight="700" font-size="${fontSize}" fill="#ffffff">P</text>
  <circle cx="${Math.round(size * 0.72)}" cy="${Math.round(size * 0.28)}" r="${Math.max(2, Math.round(size * 0.07))}" fill="${LOGO_ORANGE}"/>
</svg>`;
}

async function writePng(svg, file, width, height) {
  await sharp(Buffer.from(svg)).resize(width, height).png({ compressionLevel: 9 }).toFile(path.join(outDir, file));
}

async function writeWebp(svg, file, width, height) {
  await sharp(Buffer.from(svg)).resize(width, height).webp({ quality: 92 }).toFile(path.join(outDir, file));
}

export async function generateLogos() {
  const wide = wordmarkSvg({ width: 640, height: 160, fill: LOGO_BLUE, textFill: '#ffffff', showHeart: false });
  await writePng(wide, 'logo.png', 640, 160);
  await writeWebp(wide, 'logo.webp', 640, 160);

  for (const size of [16, 32, 48]) {
    await writePng(markSvg(size * 4), `favicon-${size}.png`, size, size);
  }
  await writePng(markSvg(512), 'logo-square.png', 512, 512);
  await writePng(markSvg(192), 'logo-square-192.png', 192, 192);
  await writePng(markSvg(512), 'logo-square-512.png', 512, 512);
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  await generateLogos();
  console.log('Wrote Petshiwu blue logo files to', outDir);
}
