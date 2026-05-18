/**
 * removeCompetitorMentions.mjs
 * Scans every published blog post and removes competitor name mentions.
 * Replaces with generic language that reads naturally and doesn't name competitors.
 */
const API_BASE = 'https://petshiwu.onrender.com';

async function login() {
  const res = await fetch(`${API_BASE}/api/auth/login`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@petshiwu.com', password: '@Admin,1+23as' }),
  });
  return (await res.json()).token;
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
  return await res.json();
}

// Replacement rules — order matters, most specific first
const REPLACEMENTS = [
  // Keep brand names that contain competitor words (Stella & Chewy's is a product brand)
  // We protect those by temporarily replacing them, then restoring
  
  // Neighborhood posts: "Big national retailers like Chewy and Petco ship from warehouses..."
  {
    from: /Big national retailers like Chewy and Petco ship from (out-of-state warehouses|warehouses across the country)\./gi,
    to: 'Large national online retailers ship from out-of-state warehouses.'
  },
  // "Chewy and Petco" together
  { from: /Chewy and Petco/gi, to: 'national big-box retailers' },
  // "like Chewy" or "like Petco"
  { from: /like (Chewy|Petco)/gi, to: 'like national retailers' },
  // "vs Chewy" comparison table rows/headers
  { from: /<th>Chewy<\/th>/gi, to: '<th>National Retailers</th>' },
  { from: /<td>Chewy<\/td>/gi, to: '<td>National Retailers</td>' },
  // Heading: "Chewy Is National. PetShiwu Is Yours."
  { from: /Chewy Is National\. PetShiwu Is Yours\./gi, to: 'National Retailers Are Everywhere. PetShiwu Is Yours.' },
  // "Chewy is a massive national retailer..."
  { from: /Chewy is a massive national retailer headquartered in Florida\. They have no local presence in Queens, no knowledge of what it/gi,
    to: 'National retailers are headquartered far from NYC. They have no local presence in Queens, no real knowledge of what it' },
  // standalone "Chewy" mentions (not part of "Stella & Chewy's")
  { from: /(?<!Stella & )(?<!Stella &amp; )\bChewy\b(?!'s)(?! brand)(?! treat)/gi, to: 'national online retailers' },
  // "Petco" standalone
  { from: /\bPetco\b/gi, to: 'big-box pet stores' },
  // "PetSmart" standalone
  { from: /\bPetSmart\b/gi, to: 'big-box pet stores' },
  // "Amazon" when referring to shopping (not Amazon AWS, not "amazingly")
  { from: /\bAmazon\.com\b/gi, to: 'large online marketplaces' },
  { from: /\bon Amazon\b/gi, to: 'on large marketplaces' },
  { from: /\bfrom Amazon\b/gi, to: 'from large online retailers' },
];

function cleanContent(text) {
  if (!text) return text;
  
  // Protect "Stella & Chewy's" brand name
  const STELLA_PLACEHOLDER = '___STELLA_CHEWYS___';
  let result = text
    .replace(/Stella &amp; Chewy's/gi, STELLA_PLACEHOLDER)
    .replace(/Stella & Chewy's/gi, STELLA_PLACEHOLDER);
  
  // Apply competitor replacements
  for (const rule of REPLACEMENTS) {
    result = result.replace(rule.from, rule.to);
  }
  
  // Restore Stella & Chewy's
  result = result.replace(new RegExp(STELLA_PLACEHOLDER, 'g'), "Stella & Chewy's");
  
  return result;
}

async function main() {
  const token = await login();
  const blogs = await getAllBlogs(token);
  console.log(`Scanning ${blogs.length} blogs for competitor mentions...\n`);

  const competitors = ['chewy', 'petco', 'petsmart'];
  const toFix = blogs.filter(b => {
    const text = ((b.content || '') + (b.excerpt || '') + (b.title || '')).toLowerCase();
    // Allow "stella & chewy's" — check for OTHER chewy mentions
    const hasCompetitor = competitors.some(c => {
      if (c === 'chewy') {
        // Remove stella & chewy's occurrences first
        const cleaned = text.replace(/stella &(?:amp;)? chewy's/gi, '');
        return cleaned.includes('chewy');
      }
      return text.includes(c);
    });
    return hasCompetitor;
  });

  console.log(`Found ${toFix.length} posts with competitor mentions\n`);

  let fixed = 0;
  for (const blog of toFix) {
    const newContent = cleanContent(blog.content);
    const newExcerpt = cleanContent(blog.excerpt);
    const newTitle = cleanContent(blog.title);
    
    if (newContent === blog.content && newExcerpt === blog.excerpt && newTitle === blog.title) {
      process.stdout.write(`⏭️  No change needed: ${blog.slug.substring(0, 55)}\n`);
      continue;
    }

    const updates = {};
    if (newContent !== blog.content) updates.content = newContent;
    if (newExcerpt !== blog.excerpt) updates.excerpt = newExcerpt;
    if (newTitle !== blog.title) updates.title = newTitle;

    const result = await updateBlog(token, blog._id, updates);
    if (result.success || result.data?._id) {
      process.stdout.write(`✅ ${blog.slug.substring(0, 60)}\n`);
      fixed++;
    } else {
      process.stdout.write(`❌ ${blog.slug.substring(0, 60)}: ${result.message || 'error'}\n`);
    }
    await new Promise(r => setTimeout(r, 280));
  }

  console.log(`\n✅ Fixed ${fixed} posts`);
}
main();
