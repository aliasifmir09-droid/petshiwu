/**
 * bulkRemoveChewy.mjs — Remove "Chewy" retailer mentions from 632 blog posts.
 *
 * Strategy:
 *   1. Temporarily replace "Stella & Chewy's" with placeholder (it's a product brand, keep)
 *   2. Replace retailer "Chewy" / "Chewy's" with generic "online pet retailers" / "their"
 *   3. Restore "Stella & Chewy's" from placeholder
 *   4. PUT each updated blog back
 *
 * Plus removes "Petshiwu vs Chewy" comparison language entirely.
 */

import fs from 'fs';

const API_BASE = 'https://petshiwu.onrender.com';
const ADMIN_EMAIL = 'admin@petshiwu.com';
const ADMIN_PASS = '@Admin,1+23as';
const args = process.argv.slice(2);
const pauseMs = parseInt(args.find(a => a.startsWith('--pause'))?.split('=')[1] || '1500');

async function login() {
  const r = await fetch(`${API_BASE}/api/v1/auth/login`, {
    method: 'POST', headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({email: ADMIN_EMAIL, password: ADMIN_PASS})
  });
  return (await r.json()).token;
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
  const r = await fetch(`${API_BASE}/api/v1/blogs/admin/${blogId}`, {
    method: 'PUT',
    headers: {'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json'},
    body: JSON.stringify(body)
  });
  const j = await r.json();
  return {ok: !!(j.success || j.data?._id), error: j.message};
}

function chewifyContent(content) {
  if (!content || !/Chewy/.test(content)) return content;

  // 1. Protect product brand name
  let out = content.replace(/Stella (?:&amp;|&) Chewy(?:&apos;|')s/g, '__STELLA_CHEWY__');
  out = out.replace(/Stella &amp; Chewy&apos;s/g, '__STELLA_CHEWY__');
  out = out.replace(/Stella & Chewy'?s?/g, '__STELLA_CHEWY__');

  // 2. Drop "Petshiwu vs Chewy" comparison titles/links
  out = out.replace(/Petshiwu vs Chewy (?:comparison|page|article|breakdown)/gi, 'Petshiwu comparison');
  out = out.replace(/Petshiwu-vs-chewy/gi, 'petshiwu-comparison');
  out = out.replace(/\/petshiwu-vs-chewy/gi, '/petshiwu-comparison');

  // 3. Replace common retailer-mention patterns
  out = out.replace(/vs Chewy's/gi, "vs their");
  out = out.replace(/vs Chewy/gi, 'vs other online retailers');
  out = out.replace(/over Chewy/gi, 'over other online retailers');
  out = out.replace(/than Chewy/gi, 'than other online retailers');
  out = out.replace(/Chewy forces Autoship/gi, 'most online retailers force a subscription');
  out = out.replace(/Chewy's Autoship/gi, 'mandatory recurring subscriptions');
  out = out.replace(/Chewy forces /gi, 'most retailers force ');
  out = out.replace(/Chewy's 1-2 day/gi, 'industry-standard 1-2 day');
  out = out.replace(/Chewy's [0-9]+/gi, 'industry-standard');
  out = out.replace(/Chewy, the [^.]+/g, 'most online retailers');
  out = out.replace(/Same vet-quality brands as Chewy/gi, 'Same vet-quality brands as other online retailers');
  out = out.replace(/same brands as Chewy/gi, 'same brands as other online retailers');
  out = out.replace(/matching or beating Chewy/gi, 'matching or beating other online retailers');
  out = out.replace(/competing with Chewy/gi, 'positioned against other online retailers');
  out = out.replace(/competitor Chewy/gi, 'competitor retailers');

  // 4. Generic bare Chewy / Chewy's (use word boundary to skip Stella restoration later)
  out = out.replace(/\bChewy's\b/g, 'their');
  out = out.replace(/\bChewy\b/g, 'online retailers');

  // 5. Restore product brand
  out = out.replace(/__STELLA_CHEWY__/g, "Stella & Chewy's");

  return out;
}

async function run() {
  console.log(`\n=== bulkRemoveChewy.mjs ===\n`);
  const token = await login();
  const allBlogs = await getAllBlogs(token);
  console.log(`Total blogs: ${allBlogs.length}`);

  const affected = allBlogs.filter(b => /Chewy/.test(b.content || ''));
  console.log(`Blogs containing "Chewy": ${affected.length}`);

  let fixed = 0, failed = 0;
  const failures = [];

  for (let i = 0; i < affected.length; i++) {
    const blog = affected[i];
    const newContent = chewifyContent(blog.content);
    if (newContent === blog.content) continue;

    try {
      const result = await updateBlog(token, blog._id, { content: newContent });
      if (result.ok) {
        fixed++;
        if (i % 50 === 0) console.log(`  [${i+1}/${affected.length}] ✓ ${blog.slug}`);
      } else {
        failed++;
        failures.push({slug: blog.slug, error: result.error});
      }
    } catch (err) {
      failed++;
      failures.push({slug: blog.slug, error: err.message});
    }

    if (i < affected.length - 1) await new Promise(r => setTimeout(r, pauseMs));
  }

  console.log(`\n=== DONE ===`);
  console.log(`Fixed: ${fixed}, Failed: ${failed}`);
  if (failures.length) {
    fs.writeFileSync('/workspace/bulkRemoveChewy_results.json', JSON.stringify(failures, null, 2));
    console.log(`Failures logged to /workspace/bulkRemoveChewy_results.json`);
  }
}

run().catch(err => { console.error(err); process.exit(1); });
