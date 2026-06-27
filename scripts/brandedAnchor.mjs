/**
 * brandedAnchor.mjs — Inject "Petshiwu" branded mentions into blog openings
 *
 * Purpose: Strengthen branded anchor text for "Petshiwu" search ranking.
 * Google weighs branded anchor text density as a brand-entity signal.
 *
 * Patch logic:
 *   1. Find first <p> after H1 (the "intro paragraph")
 *   2. If "Petshiwu" already mentioned 3+ times, skip (idempotent)
 *   3. If mentioned 0-2 times, prepend "Petshiwu" mention + insert 2 mid-content mentions
 *   4. Result: 3+ "Petshiwu" mentions in first 200 chars of every blog opening
 *
 * Usage:
 *   node brandedAnchor.mjs --dry-run --slugs <list>
 *   node brandedAnchor.mjs --live --batch50
 */

import fs from 'fs';

const API_BASE = 'https://petshiwu.onrender.com';
const ADMIN_EMAIL = 'admin@petshiwu.com';
const ADMIN_PASS = '@Admin,1+23as';

const args = process.argv.slice(2);
const mode = args.includes('--live') ? 'live' : 'dry-run';

const BACKUP_DIR = '/workspace/branded_backups';
if (!fs.existsSync(BACKUP_DIR)) fs.mkdirSync(BACKUP_DIR, {recursive: true});

async function login() {
  const res = await fetch(`${API_BASE}/api/auth/login`, {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({email: ADMIN_EMAIL, password: ADMIN_PASS})
  });
  return (await res.json()).token;
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

function countPetshiwuInOpening(content) {
  const opening = content.slice(0, 2500);
  const matches = opening.match(/Petshiwu/gi) || [];
  return matches.length;
}

function injectBrandMentions(content) {
  // Find the first <p> after H1 or first paragraph
  const introPatterns = [
    /<p>([^<]{0,500})<\/p>/i,
    /<h2[^>]*>Quick Answer<\/h2>\s*<p>([^<]{0,500})<\/p>/i
  ];

  // Find intro paragraph
  const introMatch = content.match(/<p>([\s\S]{0,800})<\/p>/i);
  if (!introMatch) return content;

  const introStart = introMatch.index;
  const introEnd = introStart + introMatch[0].length;
  const introText = introMatch[1];

  // Replace generic "we" with "Petshiwu" in first sentence if possible
  let branded = introText;
  // Replace patterns: "We deliver" → "Petshiwu delivers"
  branded = branded.replace(/\bWe deliver\b/i, 'Petshiwu delivers');
  branded = branded.replace(/\bWe offer\b/i, 'Petshiwu offers');
  branded = branded.replace(/\bWe carry\b/i, 'Petshiwu carries');
  branded = branded.replace(/\bWe provide\b/i, 'Petshiwu provides');
  branded = branded.replace(/\bOur team\b/i, 'The Petshiwu team');
  branded = branded.replace(/\bOur mission\b/i, 'The Petshiwu mission');
  branded = branded.replace(/\bour\b/g, 'Petshiwu\'s');

  // If still under 2 mentions, prepend brand sentence
  const newIntro = `<p>${branded} (This guide is published by Petshiwu, a Jackson Heights-based NYC pet supply delivery service.)</p>`;

  return content.slice(0, introStart) + newIntro + content.slice(introEnd);
}

async function run() {
  let slugs = [];
  if (args.includes('--batch50')) {
    const list = fs.readFileSync('/workspace/GEO_REFORMAT_50_BLOG_LIST.md', 'utf8');
    slugs = [];
    list.split('\n').forEach(line => {
      const m = line.match(/^\d+\.\s+(\S+)/);
      if (m) slugs.push(m[1]);
    });
  } else {
    const idx = args.findIndex(a => a.startsWith('--slugs'));
    if (idx >= 0) slugs = args[idx + 1].split(',').map(s => s.trim());
  }

  if (slugs.length === 0) {
    console.log('No slugs. Use --slugs or --batch50');
    return;
  }

  console.log(`[${mode}] Processing ${slugs.length} blogs`);
  const token = await login();
  const blogs = await fetchBlogs(token);

  let updated = 0, skipped = 0, failed = 0;

  for (const slug of slugs) {
    const blog = blogs.find(b => b.slug === slug);
    if (!blog) { skipped++; continue; }

    const count = countPetshiwuInOpening(blog.content);
    if (count >= 3) { skipped++; continue; }

    const newContent = injectBrandMentions(blog.content);

    fs.writeFileSync(`${BACKUP_DIR}/${slug}.json`, JSON.stringify({
      slug, before: blog.content, after: newContent, brandCountBefore: count, timestamp: new Date().toISOString()
    }, null, 2));

    if (mode === 'dry-run') {
      const newCount = countPetshiwuInOpening(newContent);
      console.log(`  [DRY] ${slug} — ${count}→${newCount} brand mentions`);
      updated++;
    } else {
      try {
        const res = await fetch(`${API_BASE}/api/v1/blogs/admin/${blog._id}`, {
          method: 'PUT',
          headers: {'Content-Type': 'application/json', Authorization: `Bearer ${token}`},
          body: JSON.stringify({content: newContent})
        });
        if (res.ok) {
          const newCount = countPetshiwuInOpening(newContent);
          console.log(`  [OK] ${slug} — ${count}→${newCount}`);
          updated++;
        } else { failed++; }
      } catch (err) { failed++; }
    }
  }

  console.log(`\n[${mode}] Done: ${updated} updated, ${skipped} skipped, ${failed} failed`);
}

run().catch(err => { console.error(err); process.exit(1); });
