/**
 * fixBlogImages.mjs
 * - Replaces the Chewy-branded frisbee image (photo-1601758125946) across all posts
 * - Diversifies the heavily-repeated images so posts don't all look the same
 */

const API_BASE = 'https://petshiwu.onrender.com';

// Clean Unsplash pet images — verified no competitor branding
const DOG_IMAGES = [
  'photo-1587300003388-59208cc962cb', // golden retriever in park
  'photo-1548199973-03cce0bbc87b',    // two dogs running
  'photo-1543466835-00a7907e9de1',    // dog on couch
  'photo-1561037404-61cd46aa615b',    // puppy lying down
  'photo-1529472119196-cb724127b673', // dog in field
  'photo-1494947665470-20322015e3a8', // dog portrait
  'photo-1537151608828-ea2b11777ee8', // small dog
  'photo-1477884213360-7e9d7dcc1e48', // dog outside
  'photo-1508532566027-b2579a8c4cf3', // dogs playing
  'photo-1425082661705-1834bfd09dca', // happy dog
];

const CAT_IMAGES = [
  'photo-1514888286974-6c03e2ca1dba', // orange cat looking up
  'photo-1574158622682-e40e69881006', // cat portrait
  'photo-1513360371618-26c46f30c676', // cat on couch
  'photo-1533743983669-94fa5c4338ec', // cat looking
  'photo-1472491235688-bdc81a63246e', // cat lying
  'photo-1555685812-4b943f1cb0eb', // kitten
];

const GENERAL_PET = [
  'photo-1450778869180-41d0601e046e', // dog and cat together
  'photo-1415369629372-26f2fe60c467', // pets together
  'photo-1587300003388-59208cc962cb', // dog
  'photo-1543466835-00a7907e9de1',    // dog
];

// The problematic image IDs that need replacing
const CHEWY_IMAGE = 'photo-1601758125946';

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

function pickImage(blog) {
  const slug = blog.slug || '';
  const petType = blog.petType || 'all';
  
  // Deterministic but varied — use blog id hash to pick from the list
  const id = blog._id || slug;
  const hash = id.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  
  if (petType === 'cat' || slug.includes('cat') || slug.includes('kitten') || slug.includes('feline') || slug.includes('litter')) {
    return `https://images.unsplash.com/${CAT_IMAGES[hash % CAT_IMAGES.length]}?w=1200&q=80`;
  } else if (petType === 'bird' || slug.includes('bird') || slug.includes('parrot') || slug.includes('parakeet')) {
    return `https://images.unsplash.com/photo-1444464666168-49d633b86797?w=1200&q=80`;
  } else if (petType === 'fish' || slug.includes('fish') || slug.includes('aquarium')) {
    return `https://images.unsplash.com/photo-1522069169874-c58ec4b76be5?w=1200&q=80`;
  } else if (slug.includes('reptile') || slug.includes('turtle') || slug.includes('gecko')) {
    return `https://images.unsplash.com/photo-1497206365907-f5e630693df0?w=1200&q=80`;
  } else if (petType === 'dog' || slug.includes('dog') || slug.includes('puppy') || slug.includes('canine')) {
    return `https://images.unsplash.com/${DOG_IMAGES[hash % DOG_IMAGES.length]}?w=1200&q=80`;
  } else {
    return `https://images.unsplash.com/${GENERAL_PET[hash % GENERAL_PET.length]}?w=1200&q=80`;
  }
}

async function main() {
  const token = await login();
  const blogs = await getAllBlogs(token);
  console.log(`Found ${blogs.length} total blogs`);

  // Fix all blogs using the Chewy image
  const toFix = blogs.filter(b => b.featuredImage?.includes(CHEWY_IMAGE));
  console.log(`${toFix.length} posts using the Chewy-branded image\n`);

  let fixed = 0;
  for (const blog of toFix) {
    const newImg = pickImage(blog);
    const result = await updateBlog(token, blog._id, { featuredImage: newImg });
    if (result.success || result.data?._id) {
      process.stdout.write(`✅ ${blog.slug.substring(0, 60)}\n`);
      fixed++;
    } else {
      process.stdout.write(`❌ ${blog.slug.substring(0, 60)}\n`);
    }
    await new Promise(r => setTimeout(r, 250));
  }
  console.log(`\n✅ Fixed ${fixed} images`);
}
main();
