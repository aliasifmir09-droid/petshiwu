/**
 * Generate sitemap.xml at build time
 * Fetches sitemap from backend API and saves it to public folder
 */

import https from 'https';
import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const API_URL = process.env.VITE_API_URL || 'http://127.0.0.1:5000';
const SITEMAP_URL = API_URL.replace('/api', '') + '/sitemap.xml';
const OUTPUT_PATH = path.join(__dirname, '../public/sitemap.xml');

console.log('🔍 Generating sitemap.xml...');
console.log(`📡 Fetching from: ${SITEMAP_URL}`);

const protocol = SITEMAP_URL.startsWith('https') ? https : http;

const request = protocol.get(SITEMAP_URL, (res) => {
  if (res.statusCode !== 200) {
    console.error(`❌ Failed to fetch sitemap: ${res.statusCode}`);
    process.exit(1);
  }

  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    // Validate it's XML
    if (!data.trim().startsWith('<?xml')) {
      console.error('❌ Response is not valid XML');
      console.error('Response:', data.substring(0, 200));
      process.exit(1);
    }

    // Write to public folder
    fs.writeFileSync(OUTPUT_PATH, data, 'utf8');
    console.log(`✅ Sitemap generated successfully: ${OUTPUT_PATH}`);
    console.log(`📊 Size: ${(data.length / 1024).toFixed(2)} KB`);
  });
});

request.on('error', (error) => {
  console.error('❌ Error fetching sitemap:', error.message);
  console.error('💡 Make sure the backend is running and accessible');
  process.exit(1);
});

request.setTimeout(30000, () => {
  console.error('❌ Request timeout');
  request.destroy();
  process.exit(1);
});

