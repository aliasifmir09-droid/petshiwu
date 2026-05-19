/**
 * Generate sitemap.xml at build time
 * 1. Tries to fetch from live backend (petshiwu.onrender.com/sitemap.xml)
 * 2. Falls back to a comprehensive static sitemap if backend is unreachable
 */
import https from 'https';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SITE_URL = 'https://www.petshiwu.com';
const OUTPUT_PATH = path.join(__dirname, '../public/sitemap.xml');

// Try live backend first, then fall back to static
const SITEMAP_SOURCES = [
  'https://petshiwu.onrender.com/sitemap.xml',
  process.env.VITE_API_URL
    ? process.env.VITE_API_URL.replace('/api', '') + '/sitemap.xml'
    : null,
].filter(Boolean);

const today = new Date().toISOString().split('T')[0];

// Comprehensive static fallback — covers all known routes
const STATIC_SITEMAP = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml">

  <!-- Homepage -->
  <url>
    <loc>${SITE_URL}/</loc>
    <lastmod>${today}</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>

  <!-- Pet Type Pages -->
  <url><loc>${SITE_URL}/dog</loc><lastmod>${today}</lastmod><changefreq>daily</changefreq><priority>0.9</priority></url>
  <url><loc>${SITE_URL}/cat</loc><lastmod>${today}</lastmod><changefreq>daily</changefreq><priority>0.9</priority></url>
  <url><loc>${SITE_URL}/bird</loc><lastmod>${today}</lastmod><changefreq>weekly</changefreq><priority>0.8</priority></url>
  <url><loc>${SITE_URL}/reptile</loc><lastmod>${today}</lastmod><changefreq>weekly</changefreq><priority>0.8</priority></url>
  <url><loc>${SITE_URL}/fish</loc><lastmod>${today}</lastmod><changefreq>weekly</changefreq><priority>0.8</priority></url>
  <url><loc>${SITE_URL}/small-pet</loc><lastmod>${today}</lastmod><changefreq>weekly</changefreq><priority>0.8</priority></url>

  <!-- Shop Pages -->
  <url><loc>${SITE_URL}/products</loc><lastmod>${today}</lastmod><changefreq>daily</changefreq><priority>0.9</priority></url>
  <url><loc>${SITE_URL}/shop</loc><lastmod>${today}</lastmod><changefreq>daily</changefreq><priority>0.8</priority></url>

  <!-- Learning & Blog -->
  <url><loc>${SITE_URL}/learning</loc><lastmod>${today}</lastmod><changefreq>weekly</changefreq><priority>0.8</priority></url>
  <url><loc>${SITE_URL}/care-guides</loc><lastmod>${today}</lastmod><changefreq>weekly</changefreq><priority>0.8</priority></url>

  <!-- SEO Landing Pages — high value, target specific keywords -->
  <url>
    <loc>${SITE_URL}/best-dog-food-sensitive-stomach-diarrhea</loc>
    <lastmod>${today}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.9</priority>
  </url>
  <url>
    <loc>${SITE_URL}/high-protein-dog-food-picky-eaters</loc>
    <lastmod>${today}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.9</priority>
  </url>
  <url>
    <loc>${SITE_URL}/durable-dog-toys-aggressive-chewers</loc>
    <lastmod>${today}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.9</priority>
  </url>
  <url>
    <loc>${SITE_URL}/learning/best-dog-food-sensitive-stomach</loc>
    <lastmod>${today}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>${SITE_URL}/learning/best-dog-foods-sensitive-stomachs</loc>
    <lastmod>${today}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>

  <!-- Static Info Pages -->
  <url><loc>${SITE_URL}/about</loc><lastmod>${today}</lastmod><changefreq>monthly</changefreq><priority>0.7</priority></url>
  <url><loc>${SITE_URL}/contact</loc><lastmod>${today}</lastmod><changefreq>monthly</changefreq><priority>0.7</priority></url>
  <url><loc>${SITE_URL}/faq</loc><lastmod>${today}</lastmod><changefreq>monthly</changefreq><priority>0.7</priority></url>
  <url><loc>${SITE_URL}/return-policy</loc><lastmod>${today}</lastmod><changefreq>monthly</changefreq><priority>0.6</priority></url>
  <url><loc>${SITE_URL}/donate</loc><lastmod>${today}</lastmod><changefreq>monthly</changefreq><priority>0.6</priority></url>

</urlset>`;

// Fetch sitemap from a URL with timeout
function fetchSitemap(url) {
  return new Promise((resolve, reject) => {
    console.log(`📡 Trying: ${url}`);
    const req = https.get(url, (res) => {
      if (res.statusCode !== 200) {
        reject(new Error(`HTTP ${res.statusCode}`));
        res.resume();
        return;
      }
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        if (!data.trim().startsWith('<?xml')) {
          reject(new Error('Response is not valid XML'));
        } else {
          resolve(data);
        }
      });
    });
    req.on('error', reject);
    req.setTimeout(8000, () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });
  });
}

async function generateSitemap() {
  console.log('🔍 Generating sitemap.xml...');

  // Try each source in order
  for (const source of SITEMAP_SOURCES) {
    try {
      const xml = await fetchSitemap(source);
      fs.writeFileSync(OUTPUT_PATH, xml, 'utf8');
      console.log(`✅ Sitemap fetched from backend: ${source}`);
      console.log(`📊 Size: ${(xml.length / 1024).toFixed(2)} KB`);
      return;
    } catch (err) {
      console.warn(`⚠️  ${source} failed: ${err.message}`);
    }
  }

  // All sources failed — write static fallback
  console.log('📝 Writing static fallback sitemap...');
  fs.writeFileSync(OUTPUT_PATH, STATIC_SITEMAP, 'utf8');
  console.log(`✅ Static sitemap written: ${OUTPUT_PATH}`);
  console.log(`📊 Size: ${(STATIC_SITEMAP.length / 1024).toFixed(2)} KB`);
  console.log('💡 Note: Product & category URLs will come from backend dynamic sitemap at /sitemap.xml');
}

generateSitemap().catch((err) => {
  console.warn('⚠️  Sitemap generation failed:', err.message);
  process.exit(0); // Never fail the build
});
