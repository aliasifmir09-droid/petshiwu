/**
 * addInternalLinks.mjs
 * Adds a "Related Guides" section to every blog post linking to 3-5 related posts.
 * This creates internal link equity across all 200+ posts.
 */
const API_BASE = 'https://petshiwu.onrender.com';
async function login() {
  const res = await fetch(`${API_BASE}/api/auth/login`, { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({email:'admin@petshiwu.com',password:'@Admin,1+23as'}) });
  return (await res.json()).token;
}
async function getAllBlogs(token) {
  const res = await fetch(`${API_BASE}/api/v1/blogs/admin/all?limit=300`, { headers:{Authorization:`Bearer ${token}`} });
  const d = await res.json();
  return d.data||d.blogs||[];
}
async function updateBlog(token, id, updates) {
  const res = await fetch(`${API_BASE}/api/v1/blogs/admin/${id}`, { method:'PUT', headers:{'Content-Type':'application/json','Authorization':`Bearer ${token}`}, body:JSON.stringify(updates) });
  return await res.json();
}

// Topic matching — assign each post to topics based on slug keywords
function getTopics(slug) {
  const s = slug.toLowerCase();
  const topics = [];
  if (s.includes('dog-food')||s.includes('dog-nutrition')||s.includes('dog-feed')) topics.push('dog-food');
  if (s.includes('cat-food')||s.includes('cat-nutrition')||s.includes('cat-feed')) topics.push('cat-food');
  if (s.includes('puppy')) topics.push('puppy');
  if (s.includes('senior')) topics.push('senior');
  if (s.includes('cat-litter')||s.includes('litter-box')) topics.push('litter');
  if (s.includes('dental')||s.includes('teeth')) topics.push('dental');
  if (s.includes('breed')||s.includes('labrador')||s.includes('golden')||s.includes('bulldog')||s.includes('poodle')||s.includes('german-shepherd')||s.includes('beagle')||s.includes('chihuahua')||s.includes('yorkshire')) topics.push('breed');
  if (s.includes('nyc')||s.includes('queens')||s.includes('brooklyn')||s.includes('manhattan')||s.includes('bronx')) topics.push('nyc');
  if (s.includes('queens')) topics.push('queens');
  if (s.includes('brooklyn')) topics.push('brooklyn');
  if (s.includes('training')||s.includes('leash')||s.includes('behav')||s.includes('potty')||s.includes('scratch')) topics.push('training');
  if (s.includes('supplement')||s.includes('vitamin')||s.includes('zesty')) topics.push('supplement');
  if (s.includes('treat')) topics.push('treats');
  if (s.includes('cat')||s.includes('kitten')||s.includes('feline')) topics.push('cat');
  if (s.includes('dog')||s.includes('canine')) topics.push('dog');
  if (s.includes('bird')||s.includes('parrot')||s.includes('parakeet')) topics.push('bird');
  if (s.includes('fish')||s.includes('aquarium')) topics.push('fish');
  if (s.includes('anxiety')||s.includes('stress')||s.includes('calm')) topics.push('anxiety');
  if (s.includes('allerg')) topics.push('allergy');
  if (s.includes('urinary')||s.includes('kidney')) topics.push('urinary');
  if (s.includes('vet')||s.includes('health')||s.includes('medical')) topics.push('health');
  return topics;
}

function scoreMatch(a, b) {
  const topicsA = getTopics(a.slug);
  const topicsB = getTopics(b.slug);
  return topicsA.filter(t => topicsB.includes(t)).length;
}

function buildRelatedSection(post, allPosts) {
  const others = allPosts.filter(p => p._id !== post._id && p.slug);
  const scored = others.map(p => ({ p, score: scoreMatch(post, p) }))
    .filter(x => x.score > 0)
    .sort((a,b) => b.score - a.score)
    .slice(0, 5);

  if (scored.length === 0) return null;

  const links = scored.map(x => 
    `<li><a href="https://www.petshiwu.com/learning/${x.p.slug}">${x.p.title ? x.p.title.replace(/&amp;/g,'and').replace(/&#039;/g,"'") : x.p.slug}</a></li>`
  ).join('\n');

  return `\n<hr/>\n<h3>Related Guides</h3>\n<ul>\n${links}\n</ul>`;
}

async function main() {
  const token = await login();
  const blogs = await getAllBlogs(token);
  console.log(`Building internal links for ${blogs.length} posts...\n`);

  let updated = 0, skipped = 0;
  for (const blog of blogs) {
    // Skip if already has Related Guides section
    if (blog.content?.includes('Related Guides')) {
      skipped++;
      continue;
    }

    const related = buildRelatedSection(blog, blogs);
    if (!related) { skipped++; continue; }

    const newContent = (blog.content || '') + related;
    const result = await updateBlog(token, blog._id, { content: newContent });
    if (result.success || result.data?._id) {
      process.stdout.write(`✅ ${blog.slug.substring(0,60)}\n`);
      updated++;
    } else {
      process.stdout.write(`❌ ${blog.slug.substring(0,60)}\n`);
    }
    await new Promise(r => setTimeout(r, 200));
  }
  console.log(`\n✅ Updated: ${updated} | Skipped: ${skipped}`);
}
main();
