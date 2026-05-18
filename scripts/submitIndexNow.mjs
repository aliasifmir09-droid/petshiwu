/**
 * submitIndexNow.mjs
 * Submits all petshiwu.com URLs to IndexNow (Bing, Yandex, etc.)
 * for instant crawling — no waiting weeks for organic discovery.
 *
 * Usage: node scripts/submitIndexNow.mjs
 */

import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

const KEY = '2489121cdb894a84ae9b185a2568b0f9';
const HOST = 'www.petshiwu.com';
const BASE = `https://${HOST}`;
const INDEXNOW_ENDPOINT = 'https://api.indexnow.org/indexnow';

// Fetch sitemap and extract all URLs
async function getSitemapUrls() {
  console.log('Fetching sitemap from live site...');
  const res = await fetch(`${BASE}/sitemap.xml`);
  const xml = await res.text();
  
  const matches = xml.match(/<loc>(https?:\/\/[^<]+)<\/loc>/g) || [];
  const urls = matches
    .map(m => m.replace(/<\/?loc>/g, '').trim())
    .filter(url => url.startsWith(BASE))
    // Skip API/filter URLs - IndexNow only wants canonical user-facing pages
    .filter(url => !url.includes('?') || url.includes('?petType='));
  
  return [...new Set(urls)]; // deduplicate
}

// Submit URLs in batches of 10,000 (IndexNow limit)
async function submitBatch(urls, batchNum) {
  const payload = {
    host: HOST,
    key: KEY,
    keyLocation: `${BASE}/${KEY}.txt`,
    urlList: urls,
  };

  const res = await fetch(INDEXNOW_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
    body: JSON.stringify(payload),
  });

  console.log(`Batch ${batchNum}: ${urls.length} URLs → HTTP ${res.status}`);
  if (res.status !== 200 && res.status !== 202) {
    const body = await res.text().catch(() => '');
    console.error('  Error:', body.substring(0, 200));
  }
  return res.status;
}

async function main() {
  try {
    const allUrls = await getSitemapUrls();
    console.log(`Total URLs found: ${allUrls.length}`);

    // Batch into chunks of 10,000
    const batchSize = 10000;
    const batches = [];
    for (let i = 0; i < allUrls.length; i += batchSize) {
      batches.push(allUrls.slice(i, i + batchSize));
    }

    console.log(`Submitting ${batches.length} batch(es)...`);
    for (let i = 0; i < batches.length; i++) {
      await submitBatch(batches[i], i + 1);
      // Small delay between batches
      if (i < batches.length - 1) await new Promise(r => setTimeout(r, 1000));
    }

    console.log('\n✅ IndexNow submission complete!');
    console.log('Bing, Yandex, and other IndexNow partners will crawl these URLs shortly.');
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
}

main();
