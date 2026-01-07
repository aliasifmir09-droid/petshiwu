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
    console.warn(`⚠️  Failed to fetch sitemap: ${res.statusCode}`);
    console.warn('💡 Sitemap will be generated dynamically by the backend at /sitemap.xml');
    console.warn('💡 This is normal if the backend is not running locally');
    process.exit(0); // Exit gracefully - sitemap is generated dynamically
  }

  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    // Validate it's XML
    if (!data.trim().startsWith('<?xml')) {
      console.warn('⚠️  Response is not valid XML');
      console.warn('💡 Sitemap will be generated dynamically by the backend at /sitemap.xml');
      process.exit(0); // Exit gracefully
    }

    // Write to public folder
    try {
      fs.writeFileSync(OUTPUT_PATH, data, 'utf8');
      console.log(`✅ Sitemap generated successfully: ${OUTPUT_PATH}`);
      console.log(`📊 Size: ${(data.length / 1024).toFixed(2)} KB`);
      process.exit(0);
    } catch (error) {
      console.warn('⚠️  Failed to write sitemap file:', error.message);
      console.warn('💡 Sitemap will be generated dynamically by the backend at /sitemap.xml');
      process.exit(0); // Exit gracefully
    }
  });
});

request.on('error', (error) => {
  console.warn('⚠️  Error fetching sitemap:', error.message);
  console.warn('💡 Sitemap will be generated dynamically by the backend at /sitemap.xml');
  console.warn('💡 This is normal if the backend is not running locally');
  process.exit(0); // Exit gracefully - sitemap is generated dynamically
});

request.setTimeout(5000, () => {
  console.warn('⚠️  Request timeout (backend may not be running)');
  console.warn('💡 Sitemap will be generated dynamically by the backend at /sitemap.xml');
  request.destroy();
  process.exit(0); // Exit gracefully
});

