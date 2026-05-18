/**
 * publishBrooklynPosts.mjs
 * Publishes one targeted delivery post per major Brooklyn neighborhood.
 * Phase 2 of borough expansion after Queens.
 */

const API_BASE = 'https://petshiwu.onrender.com';

async function login() {
  const res = await fetch(`${API_BASE}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@petshiwu.com', password: '@Admin,1+23as' }),
  });
  const data = await res.json();
  return data.token;
}

async function publishPost(token, post) {
  const res = await fetch(`${API_BASE}/api/v1/blogs/admin`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ ...post, isPublished: true, publishedAt: new Date().toISOString() }),
  });
  const data = await res.json();
  if (data.success || data._id || data.data?._id) {
    process.stdout.write(`✅ ${post.title.substring(0, 72)}\n`);
    return true;
  } else {
    process.stdout.write(`❌ ${post.title.substring(0,60)}: ${data.message||''}\n`);
    return false;
  }
}

const neighborhoods = [
  { name: 'Park Slope', zip: '11215, 11217', desc: 'one of NYC\'s most dog-friendly neighborhoods, famous for its tree-lined streets and Prospect Park access' },
  { name: 'Williamsburg', zip: '11211, 11249', desc: 'a vibrant Brooklyn neighborhood with a huge population of young pet owners' },
  { name: 'Greenpoint', zip: '11222', desc: 'a tight-knit Brooklyn community known for its love of animals and neighborhood charm' },
  { name: 'Bay Ridge', zip: '11209', desc: 'a classic Brooklyn neighborhood with many families and devoted pet owners' },
  { name: 'Flatbush', zip: '11226, 11210', desc: 'a large, diverse Brooklyn neighborhood with thousands of dog and cat owners' },
  { name: 'Crown Heights', zip: '11213, 11216, 11225', desc: 'a culturally rich Brooklyn neighborhood with a passionate pet-owning community' },
  { name: 'Bensonhurst', zip: '11204, 11214', desc: 'a family-oriented Brooklyn neighborhood where pets are beloved members of every household' },
  { name: 'Sheepshead Bay', zip: '11235', desc: 'a waterfront Brooklyn community with active outdoor-loving pet owners' },
  { name: 'Brooklyn Heights', zip: '11201', desc: 'one of Brooklyn\'s most historic and pet-welcoming neighborhoods' },
  { name: 'Bed-Stuy', zip: '11216, 11221, 11233', desc: 'Bedford-Stuyvesant — a dynamic Brooklyn neighborhood with a growing community of pet owners' },
  { name: 'Sunset Park', zip: '11220, 11232', desc: 'a diverse and close-knit Brooklyn community with many dedicated pet owners' },
  { name: 'Borough Park', zip: '11219', desc: 'a densely populated Brooklyn neighborhood where pet care is taken seriously' },
];

function makePost(n) {
  return {
    title: `Pet Food & Supplies Delivery in ${n.name}, Brooklyn NY | PetShiwu`,
    slug: `pet-food-delivery-${n.name.toLowerCase().replace(/[\s-]+/g, '-')}-brooklyn-ny`,
    petType: 'all',
    category: 'Pet Care Tips',
    tags: [
      `pet store ${n.name}`,
      `pet food ${n.name} Brooklyn`,
      `pet supplies ${n.name} NY`,
      `dog food ${n.name}`,
      `cat food ${n.name} Brooklyn`,
      `pet delivery ${n.name} NYC`,
    ],
    featuredImage: 'https://images.unsplash.com/photo-1548199973-03cce0bbc87b?w=1200&q=80',
    excerpt: `Get premium pet food and supplies delivered to ${n.name}, Brooklyn. PetShiwu ships dog food, cat food, bird supplies, and more with free shipping on orders over $49.`,
    metaTitle: `Pet Food Delivery ${n.name} Brooklyn NY | PetShiwu`,
    metaDescription: `Order pet food and supplies online and get them delivered to ${n.name}, Brooklyn. 10,000+ products from top brands. Free shipping over $49. Fast delivery to ${n.name} zip codes: ${n.zip}.`,
    content: `<h2>Pet Food & Supplies Delivered to ${n.name}, Brooklyn</h2>
<p>${n.name} is ${n.desc}. PetShiwu makes it easy to get premium pet food, toys, treats, and accessories delivered directly to your Brooklyn door — no heavy bags, no long trips to the store.</p>

<h2>Why ${n.name} Pet Owners Choose PetShiwu</h2>
<p>PetShiwu is Queens-based — we know what it's like to care for pets in New York City. We've built our catalog and service around what NYC pet owners actually need:</p>
<ul>
  <li><strong>10,000+ products</strong> from the most trusted pet brands</li>
  <li><strong>Free shipping on orders over $49</strong> — no membership required</li>
  <li><strong>Flat $6 shipping</strong> on all orders under $49</li>
  <li><strong>Fast delivery</strong> to all ${n.name} addresses (zip codes: ${n.zip})</li>
  <li><strong>AI Pet Advisor</strong> for personalized product recommendations</li>
</ul>

<h2>What We Deliver to ${n.name}</h2>
<h3>Dog Food & Treats</h3>
<p>Purina Pro Plan, Blue Buffalo, Hill's Science Diet, Royal Canin, Taste of the Wild, and 50+ more brands. <a href="https://www.petshiwu.com/dog/dog-food">Shop dog food →</a></p>

<h3>Cat Food & Litter</h3>
<p>Fancy Feast, Purina ONE, Blue Buffalo, Royal Canin, Fresh Step, Dr. Elsey's, and more. <a href="https://www.petshiwu.com/cat/cat-food">Shop cat food →</a></p>

<h3>Bird, Reptile & Small Animal</h3>
<p>Full supplies for all pets — seed mixes, pellets, habitats, lighting, bedding, and toys. <a href="https://www.petshiwu.com/products">Browse all →</a></p>

<h2>How to Order</h2>
<ol>
  <li>Browse our <a href="https://www.petshiwu.com/products">10,000+ product catalog</a></li>
  <li>Add to cart and enter your ${n.name} delivery address</li>
  <li>Ships within 1 business day — arrives in 2–5 days</li>
</ol>

<h2>Questions?</h2>
<p>Email <a href="mailto:support@petshiwu.com">support@petshiwu.com</a> or call <a href="tel:+16263420419">+1 (626) 342-0419</a>. Mon–Fri 9AM–8PM, Sat–Sun 9AM–6PM EST.</p>
<p><a href="https://www.petshiwu.com/products"><strong>Start shopping — free shipping over $49 →</strong></a></p>`,
  };
}

async function main() {
  console.log('Logging in...');
  const token = await login();
  if (!token) { console.error('Login failed'); process.exit(1); }

  console.log(`\nPublishing ${neighborhoods.length} Brooklyn neighborhood posts...\n`);
  let ok = 0, fail = 0;
  for (const n of neighborhoods) {
    const success = await publishPost(token, makePost(n));
    success ? ok++ : fail++;
    await new Promise(r => setTimeout(r, 380));
  }
  console.log(`\n✅ Done! Published: ${ok} | Failed: ${fail}`);
}

main();
