/**
 * bulkRemoveChewy2.mjs — Resilient version: simpler regex, log every 5, retry on connection errors
 */

import fs from 'fs';

const API_BASE = 'https://petshiwu.onrender.com';
const ADMIN_EMAIL = 'admin@petshiwu.com';
const ADMIN_PASS = '@Admin,1+23as';
const args = process.argv.slice(2);
const pauseMs = parseInt(args.find(a => a.startsWith('--pause'))?.split('=')[1] || '2000');

async function login() {
  for (let i = 0; i < 3; i++) {
    try {
      const r = await fetch(`${API_BASE}/api/v1/auth/login`, {
        method: 'POST', headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({email: ADMIN_EMAIL, password: ADMIN_PASS})
      });
      if (r.ok) return (await r.json()).token;
    } catch (e) {}
    await new Promise(r => setTimeout(r, 5000));
  }
  throw new Error('Login failed after 3 attempts');
}

async function getAllBlogs(token) {
  const blogs = [];
  for (let page = 1; page < 30; page++) {
    const r = await fetch(`${API_BASE}/api/v1/blogs/admin/all?limit=500&page=${page}`, {
      headers: {'Authorization': `Bearer ${token}`}
    });
    const data = (await r.json()).data || [];
    if (!data.length) break;
    blogs.push(...data);
    if (data.length < 500) break;
  }
  return blogs;
}

async function updateBlog(token, blogId, body) {
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const r = await fetch(`${API_BASE}/api/v1/blogs/admin/${blogId}`, {
        method: 'PUT',
        headers: {'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json'},
        body: JSON.stringify(body)
      });
      const j = await r.json();
      if (j.success || j.data?._id) return {ok: true};
      return {ok: false, error: j.message};
    } catch (e) {
      if (attempt < 2) await new Promise(r => setTimeout(r, 3000));
    }
  }
  return {ok: false, error: '3 connection failures'};
}

function chewifyContent(content) {
  if (!content || !/Chewy/.test(content)) return content;

  // 1. Protect product brand name
  let out = content.replace(/Stella\s*(?:&amp;|&)\s*Chewy(?:&apos;|')?s?/g, '__STELLA_CHEWY__');

  // 2. Common comparison patterns
  out = out.replace(/Petshiwu[\s-]*vs[\s-]*Chewy(?:\s+(?:comparison|page|article|breakdown))?/gi, 'Petshiwu comparison');
  out = out.replace(/\/petshiwu[\s-]*vs[\s-]*chewy/gi, '/petshiwu-comparison');

  // 3. Common phrase patterns
  out = out.replace(/vs\.?\s+Chewy(?:'s)?/gi, "vs. other online retailers");
  out = out.replace(/over\s+Chewy/gi, 'over other online retailers');
  out = out.replace(/than\s+Chewy/gi, 'than other online retailers');
  out = out.replace(/competing\s+with\s+Chewy/gi, 'positioned against other retailers');
  out = out.replace(/Chewy\s+forces\s+Autoship/gi, 'most retailers require subscriptions for best pricing');
  out = out.replace(/Chewy'?s\s+Autoship/gi, 'mandatory recurring subscriptions');
  out = out.replace(/Chewy\s+forces\s+/gi, 'most retailers force ');
  out = out.replace(/Chewy'?s\s+1-2\s+day/gi, 'industry-standard 1-2 day');
  out = out.replace(/Chewy'?s\s+\d+/g, 'industry-standard');
  out = out.replace(/Chewy,?\s+the\s+\$[\d.]+[BMK+]?\+?\s+national\s+pet\s+retailer[^.]*\./gi, 'most major online pet retailers.');
  out = out.replace(/Same\s+vet-quality\s+brands\s+as\s+Chewy/gi, 'Same vet-quality brands as other online retailers');
  out = out.replace(/same\s+brands\s+as\s+Chewy/gi, 'same brands as other online retailers');
  out = out.replace(/matching\s+or\s+beating\s+Chewy/gi, 'matching or beating other online retailers');
  out = out.replace(/competitor\s+Chewy/gi, 'competitor retailers');

  // 4. Catch remaining bare Chewy/Chewy's
  out = out.replace(/\bChewy's\b/g, 'their');
  out = out.replace(/\bChewy\b/g, 'online retailers');

  // 5. Restore product brand
  out = out.replace(/__STELLA_CHEWY__/g, "Stella & Chewy's");
  return out;
}

async function run() {
  console.log(`\n=== bulkRemoveChewy2.mjs — resilient ===\n`);
  const token = await login();
  const allBlogs = await getAllBlogs(token);
  console.log(`Total blogs: ${allBlogs.length}`);

  const affected = allBlogs.filter(b => /Chewy/.test(b.content || ''));
  console.log(`Blogs containing Chewy: ${affected.length}\n`);

  let fixed = 0, skipped = 0, failed = 0;
  const failures = [];

  for (let i = 0; i < affected.length; i++) {
    const blog = affected[i];
    const newContent = chewifyContent(blog.content);
    if (newContent === blog.content) {
      skipped++;
      continue;
    }

    const result = await updateBlog(token, blog._id, { content: newContent });
    if (result.ok) {
      fixed++;
      if (i % 5 === 0) console.log(`  [${i+1}/${affected.length}] ✓ ${blog.slug}`);
    } else {
      failed++;
      failures.push({slug: blog.slug, error: result.error});
      if (failed < 5) console.log(`  [${i+1}] ✗ ${blog.slug}: ${result.error?.slice(0,80)}`);
    }

    if (i < affected.length - 1) await new Promise(r => setTimeout(r, pauseMs));
  }

  console.log(`\n=== DONE ===`);
  console.log(`Fixed: ${fixed}, Skipped (no change): ${skipped}, Failed: ${failed}`);
  if (failures.length) fs.writeFileSync('/workspace/bulkRemoveChewy2_results.json', JSON.stringify(failures, null, 2));
}

run().catch(err => { console.error('FATAL:', err); process.exit(1); });
