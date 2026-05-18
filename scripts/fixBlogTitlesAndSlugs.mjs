/**
 * fixBlogTitlesAndSlugs.mjs
 * Fixes all blog posts that have HTML-encoded characters in their titles/slugs.
 * - Replaces &amp; → and, &039; → ' in titles
 * - Rebuilds clean slugs from fixed titles
 * - Removes "| PetShiwu" suffix from titles (already in site branding)
 */

const API_BASE = 'https://petshiwu.onrender.com';

async function login() {
  const res = await fetch(`${API_BASE}/api/auth/login`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@petshiwu.com', password: '@Admin,1+23as' }),
  });
  return (await res.json()).token;
}

function cleanTitle(title) {
  return title
    .replace(/&amp;/g, 'and')
    .replace(/&#039;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/\s*\|\s*PetShiwu\s*$/i, '')  // remove trailing "| PetShiwu"
    .trim();
}

function titleToSlug(title) {
  return title
    .toLowerCase()
    .replace(/['']/g, '')          // remove apostrophes
    .replace(/[^a-z0-9\s-]/g, '') // remove non-alphanumeric
    .replace(/\s+/g, '-')         // spaces to dashes
    .replace(/-+/g, '-')          // collapse multiple dashes
    .replace(/^-|-$/g, '');       // trim leading/trailing dashes
}

async function getAllBlogs(token) {
  const res = await fetch(`${API_BASE}/api/v1/blogs/admin/all?limit=300`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  const d = await res.json();
  return d.data || d.blogs || [];
}

async function updateBlog(token, id, updates) {
  const res = await fetch(`${API_BASE}/api/v1/blogs/admin/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify(updates),
  });
  return (await res.json());
}

async function main() {
  console.log('Logging in...');
  const token = await login();

  console.log('Fetching all blogs...');
  const blogs = await getAllBlogs(token);
  console.log(`Found ${blogs.length} total blogs\n`);

  const needsFix = blogs.filter(b =>
    b.title?.includes('&amp;') ||
    b.title?.includes('&#039;') ||
    b.title?.includes('| PetShiwu') ||
    b.slug?.includes('amp-') ||
    b.slug?.includes('-amp-') ||
    b.slug?.includes('039')
  );

  console.log(`${needsFix.length} posts need fixing\n`);

  let fixed = 0, failed = 0;
  for (const blog of needsFix) {
    const newTitle = cleanTitle(blog.title);
    const newSlug = titleToSlug(newTitle);

    const result = await updateBlog(token, blog._id, {
      title: newTitle,
      slug: newSlug,
    });

    if (result.success || result.data?._id) {
      process.stdout.write(`✅ ${newTitle.substring(0, 65)}\n   slug: ${newSlug}\n`);
      fixed++;
    } else {
      // Try with metaTitle preserved
      process.stdout.write(`❌ ${blog.title.substring(0, 60)}: ${result.message || JSON.stringify(result).substring(0,80)}\n`);
      failed++;
    }
    await new Promise(r => setTimeout(r, 300));
  }

  console.log(`\n✅ Fixed: ${fixed} | Failed: ${failed}`);
}

main();
