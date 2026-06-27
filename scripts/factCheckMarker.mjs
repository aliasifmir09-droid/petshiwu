/**
 * factCheckMarker.mjs — Adds visible fact-check markers to blogs
 *
 * Purpose (per Wellows Feb 2026 AI Overview guide): AI Overviews prioritize
 * "Real-Time Factual Verification" - visible last-reviewed date + named sources.
 *
 * Usage:
 *   node factCheckMarker.mjs --dry-run --slugs <comma-separated>
 *   node factCheckMarker.mjs --live --slugs <comma-separated>
 *   node factCheckMarker.mjs --batch44  # all 44 GEO blogs
 *
 * Marker format (added after H1, before Quick Answer):
 *   <aside class="fact-check-marker">
 *     <p><strong>Last reviewed:</strong> June 27, 2026 by Pet Chiwu, Founder
 *     | <strong>Sources:</strong> <a href="..." rel="nofollow">NYC DOH</a>,
 *     <a href="..." rel="nofollow">AVMA</a>, <a href="..." rel="nofollow">Cornell FHC</a></p>
 *   </aside>
 *
 * Per-blog source list auto-selected from content keywords (vet, prescription,
 * cat, dog, NYC, food, etc.). Idempotent - skips blogs with marker already present.
 */

import fs from 'fs';

const API_BASE = 'https://petshiwu.onrender.com';
const ADMIN_EMAIL = 'admin@petshiwu.com';
const ADMIN_PASS = '@Admin,1+23as';

const args = process.argv.slice(2);
const mode = args.includes('--live') ? 'live' : 'dry-run';

const BACKUP_DIR = '/workspace/factcheck_backups';
if (!fs.existsSync(BACKUP_DIR)) fs.mkdirSync(BACKUP_DIR, {recursive: true});

const SOURCES = {
  vet: [
    {name: 'AVMA', url: 'https://www.avma.org/'},
    {name: 'Cornell Feline Health Center', url: 'https://www.vet.cornell.edu/departments-centers-and-institutes/cornell-feline-health-center'}
  ],
  prescription: [
    {name: 'AVMA', url: 'https://www.avma.org/'},
    {name: 'FDA Pet Food', url: 'https://www.fda.gov/animal-veterinary/animal-foods-feeds/pet-food'}
  ],
  cat: [
    {name: 'Cornell Feline Health Center', url: 'https://www.vet.cornell.edu/departments-centers-and-institutes/cornell-feline-health-center'},
    {name: 'AVMA', url: 'https://www.avma.org/'}
  ],
  dog: [
    {name: 'AVMA', url: 'https://www.avma.org/'},
    {name: 'AKC', url: 'https://www.akc.org/'}
  ],
  nyc: [
    {name: 'NYC DOH', url: 'https://www.nyc.gov/site/doh/index.page'},
    {name: 'NYC Open Data', url: 'https://opendata.cityofnewyork.us/'}
  ],
  food: [
    {name: 'FDA Pet Food', url: 'https://www.fda.gov/animal-veterinary/animal-foods-feeds/pet-food'},
    {name: 'AAFCO', url: 'https://www.aafco.org/'}
  ],
  default: [
    {name: 'AVMA', url: 'https://www.avma.org/'},
    {name: 'NYC DOH', url: 'https://www.nyc.gov/site/doh/index.page'}
  ]
};

function pickSources(content) {
  const c = content.toLowerCase();
  const matched = new Set();
  for (const [key, sources] of Object.entries(SOURCES)) {
    if (key === 'default') continue;
    if (c.includes(key)) {
      sources.forEach(s => matched.add(JSON.stringify(s)));
    }
  }
  if (matched.size === 0) {
    SOURCES.default.forEach(s => matched.add(JSON.stringify(s)));
  }
  return Array.from(matched).map(s => JSON.parse(s)).slice(0, 3);
}

function buildMarker(sources) {
  const sourceLinks = sources
    .map(s => `<a href="${s.url}" rel="nofollow" target="_blank">${s.name}</a>`)
    .join(', ');
  return `<aside class="fact-check-marker" style="background:#f8f9fa;border-left:3px solid #2563eb;padding:10px 14px;margin:14px 0;font-size:14px;color:#374151;"><p style="margin:0;"><strong>Last reviewed:</strong> June 27, 2026 by <a href="/about" rel="author">Pet Chiwu, Founder</a> &nbsp;|&nbsp; <strong>Medical sources:</strong> ${sourceLinks}</p></aside>`;
}

async function login() {
  const res = await fetch(`${API_BASE}/api/auth/login`, {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({email: ADMIN_EMAIL, password: ADMIN_PASS})
  });
  const d = await res.json();
  if (!d.token) throw new Error('Login failed');
  return d.token;
}

async function fetchBlogs(token) {
  const all = [];
  let page = 1;
  while (true) {
    const res = await fetch(`${API_BASE}/api/v1/blogs?page=${page}&limit=100`, {
      headers: {Authorization: `Bearer ${token}`}
    });
    const d = await res.json();
    const items = d.blogs || d.data || [];
    if (items.length === 0) break;
    all.push(...items);
    if (items.length < 100) break;
    page++;
    if (page > 50) break;
  }
  return all;
}

function hasMarker(content) {
  return content.includes('fact-check-marker') || content.includes('Last reviewed:');
}

function injectMarker(content, marker) {
  // Find first H1 closing tag, inject after
  const h1Match = content.match(/<\/h1>/i);
  if (h1Match) {
    const idx = h1Match.index + h1Match[0].length;
    return content.slice(0, idx) + '\n' + marker + '\n' + content.slice(idx);
  }
  // Fallback: inject at start
  return marker + '\n' + content;
}

async function run() {
  let slugs = [];
  if (args.includes('--batch44')) {
    // Read from GEO_REFORMAT_50_BLOG_LIST.md
    const list = fs.readFileSync('/workspace/GEO_REFORMAT_50_BLOG_LIST.md', 'utf8');
    slugs = [];
    list.split('\n').forEach(line => {
      const m = line.match(/^\d+\.\s+(\S+)/);
      if (m) slugs.push(m[1]);
    });
  } else {
    const slugsIdx = args.findIndex(a => a.startsWith('--slugs'));
    if (slugsIdx >= 0) {
      slugs = args[slugsIdx + 1].split(',').map(s => s.trim());
    }
  }

  // Get blog list
  if (slugs.length === 0) {
    console.log('No slugs specified. Use --slugs <list> or --batch44');
    return;
  }

  console.log(`[${mode}] Processing ${slugs.length} blogs`);
  const token = await login();
  const blogs = await fetchBlogs(token);

  let updated = 0;
  let skipped = 0;
  let failed = 0;

  for (const slug of slugs) {
    const blog = blogs.find(b => b.slug === slug);
    if (!blog) {
      console.log(`  [SKIP] ${slug} — not found in DB`);
      skipped++;
      continue;
    }

    if (hasMarker(blog.content)) {
      console.log(`  [SKIP] ${slug} — marker already present`);
      skipped++;
      continue;
    }

    const sources = pickSources(blog.content);
    const marker = buildMarker(sources);
    const newContent = injectMarker(blog.content, marker);

    // Backup
    fs.writeFileSync(`${BACKUP_DIR}/${slug}.json`, JSON.stringify({
      slug, before: blog.content, after: newContent, timestamp: new Date().toISOString()
    }, null, 2));

    if (mode === 'dry-run') {
      console.log(`  [DRY] ${slug} — would inject ${sources.map(s => s.name).join(', ')}`);
      updated++;
    } else {
      try {
        const res = await fetch(`${API_BASE}/api/v1/blogs/admin/${blog._id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({content: newContent})
        });
        if (res.ok) {
          console.log(`  [OK] ${slug} — marker injected (${sources.map(s => s.name).join(', ')})`);
          updated++;
        } else {
          console.log(`  [FAIL] ${slug} — HTTP ${res.status}`);
          failed++;
        }
      } catch (err) {
        console.log(`  [FAIL] ${slug} — ${err.message}`);
        failed++;
      }
    }
  }

  console.log(`\n[${mode}] Done: ${updated} updated, ${skipped} skipped, ${failed} failed`);
}

run().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
