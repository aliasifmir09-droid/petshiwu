/**
 * publishNeighborhoodPosts.mjs
 * Publishes one targeted blog post per major Queens neighborhood.
 * Each post targets "[pet supplies/food/store] + [neighborhood]" searches
 * that large national brands like Chewy can never rank for.
 */

const API = 'https://petshiwu.onrender.com/api/v1';

async function login() {
  const res = await fetch(`https://petshiwu.onrender.com/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@petshiwu.com', password: '@Admin,1+23as' }),
  });
  const data = await res.json();
  return data.token;
}

async function publishPost(token, post) {
  const res = await fetch(`${API}/blogs/admin`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ ...post, isPublished: true, publishedAt: new Date().toISOString() }),
  });
  const data = await res.json();
  if (data.success || data._id || data.data?._id) {
    console.log(`✅ ${post.title}`);
  } else {
    console.error(`❌ ${post.title}:`, JSON.stringify(data).substring(0, 150));
  }
}

const neighborhoods = [
  { name: 'Flushing', zip: '11354, 11355', desc: 'home to one of NYC\'s most vibrant pet-loving communities' },
  { name: 'Astoria', zip: '11102, 11103, 11105, 11106', desc: 'one of the most dog-friendly neighborhoods in all of New York City' },
  { name: 'Woodside', zip: '11377', desc: 'a tight-knit neighborhood where pets are part of the family' },
  { name: 'Sunnyside', zip: '11104', desc: 'a neighborhood known for its community spirit and pet-friendly streets' },
  { name: 'Elmhurst', zip: '11373', desc: 'one of the most diverse neighborhoods in Queens' },
  { name: 'Corona', zip: '11368', desc: 'home to Flushing Meadows-Corona Park and thousands of pet owners' },
  { name: 'Jamaica', zip: '11432, 11433, 11434, 11435, 11436', desc: 'a major Queens hub with a large and growing pet-owning community' },
  { name: 'Forest Hills', zip: '11375', desc: 'an affluent Queens neighborhood known for its parks and pet-friendly lifestyle' },
  { name: 'Rego Park', zip: '11374', desc: 'a convenient Queens neighborhood with pet owners who demand the best' },
  { name: 'Bayside', zip: '11360, 11361', desc: 'a waterfront Queens community where pets are cherished family members' },
  { name: 'Whitestone', zip: '11357', desc: 'a quiet residential Queens neighborhood with dedicated pet owners' },
  { name: 'Fresh Meadows', zip: '11365, 11366', desc: 'a family-friendly Queens neighborhood with a growing pet-owner population' },
];

function makePost(n) {
  const slug = `pet-food-delivery-${n.name.toLowerCase().replace(/\s+/g, '-')}-queens-ny`;
  return {
    title: `Pet Food & Supplies Delivery in ${n.name}, Queens NY | PetShiwu`,
    slug,
    petType: 'all',
    category: 'Pet Care Tips',
    tags: [
      `pet store ${n.name}`,
      `pet food ${n.name} Queens`,
      `pet supplies ${n.name} NY`,
      `dog food ${n.name}`,
      `cat food ${n.name} Queens`,
      `pet delivery ${n.name} NYC`,
    ],
    featuredImage: 'https://images.unsplash.com/photo-1601758125946-6ec2ef64daf8?w=1200&q=80',
    excerpt: `Get premium pet food and supplies delivered to ${n.name}, Queens. PetShiwu ships dog food, cat food, bird supplies, and more to every address in ${n.name} with free shipping on orders over $49.`,
    metaTitle: `Pet Food Delivery ${n.name} Queens NY | PetShiwu`,
    metaDescription: `Order pet food and supplies online and get them delivered to ${n.name}, Queens. PetShiwu carries 10,000+ products from top brands. Free shipping over $49. Fast delivery to ${n.name} zip codes: ${n.zip}.`,
    content: `<h2>Pet Food & Supplies Delivered to ${n.name}, Queens</h2>
<p>${n.name} is ${n.desc}. At PetShiwu, we make it easy to get premium pet food, toys, treats, and accessories delivered directly to your door — no trip to a store required, no heavy bags on the subway.</p>

<h2>Why ${n.name} Pet Owners Choose PetShiwu</h2>
<p>Big national retailers like Chewy and Petco ship from warehouses across the country. PetShiwu is Queens-based — we understand what it means to live and care for pets in NYC. We've built our catalog and service around what New York City pet owners actually need:</p>
<ul>
  <li><strong>10,000+ products</strong> from the most trusted pet brands in the industry</li>
  <li><strong>Free shipping on orders over $49</strong> — no membership required</li>
  <li><strong>Flat $6 shipping</strong> on all orders under $49</li>
  <li><strong>Fast delivery</strong> to all ${n.name} addresses (zip codes: ${n.zip})</li>
  <li><strong>Expert pet care advice</strong> in our Learning Center</li>
  <li><strong>AI Pet Advisor</strong> for personalized product recommendations</li>
</ul>

<h2>What We Deliver to ${n.name}</h2>
<h3>Dog Food & Treats</h3>
<p>From everyday kibble to premium grain-free and prescription formulas — Purina Pro Plan, Blue Buffalo, Hill's Science Diet, Royal Canin, Taste of the Wild, Orijen, and 50+ more brands delivered to your ${n.name} address. <a href="https://www.petshiwu.com/dog/dog-food">Shop dog food →</a></p>

<h3>Cat Food & Litter</h3>
<p>Wet food, dry kibble, treats, litter, and accessories for cats of every age and dietary need. Fancy Feast, Purina ONE, Blue Buffalo Wilderness, Royal Canin, and more. <a href="https://www.petshiwu.com/cat/cat-food">Shop cat food →</a></p>

<h3>Bird Supplies</h3>
<p>Seed mixes, pellets, treats, and accessories for parakeets, cockatiels, parrots, and all birds. <a href="https://www.petshiwu.com/bird">Shop bird supplies →</a></p>

<h3>Reptile Supplies</h3>
<p>Lighting, heating, food, substrate, and habitats for snakes, lizards, turtles, and more. <a href="https://www.petshiwu.com/reptile">Shop reptile supplies →</a></p>

<h3>Small Animal Supplies</h3>
<p>Everything for rabbits, hamsters, guinea pigs, ferrets, and chinchillas — food, bedding, toys, and cages. <a href="https://www.petshiwu.com/small-pet">Shop small animal supplies →</a></p>

<h2>How to Order Pet Supplies Delivered to ${n.name}</h2>
<ol>
  <li>Browse our <a href="https://www.petshiwu.com/products">10,000+ product catalog</a> by pet type, brand, or need</li>
  <li>Add items to your cart</li>
  <li>Enter your ${n.name} delivery address at checkout</li>
  <li>Your order ships within 1 business day — delivered in 2–5 business days</li>
</ol>
<p>Orders over $49 ship free. All others ship for just $6.</p>

<h2>Today's Best Deals</h2>
<p>Check our <a href="https://www.petshiwu.com/products?featured=true">Today's Deals</a> page for the lowest prices on dog food, cat food, and pet accessories — updated daily.</p>

<h2>Questions? We're Here.</h2>
<p>Our Queens-based support team is available Monday–Friday 9AM–8PM and Saturday–Sunday 9AM–6PM EST.</p>
<ul>
  <li>Email: <a href="mailto:support@petshiwu.com">support@petshiwu.com</a></li>
  <li>Phone: <a href="tel:+16263420419">+1 (626) 342-0419</a></li>
</ul>
<p><a href="https://www.petshiwu.com/products"><strong>Start shopping for ${n.name} pet delivery →</strong></a></p>`,
  };
}

async function main() {
  console.log('Logging in...');
  const token = await login();
  if (!token) { console.error('Login failed'); process.exit(1); }

  console.log(`Publishing ${neighborhoods.length} neighborhood posts...\n`);
  for (const n of neighborhoods) {
    await publishPost(token, makePost(n));
    await new Promise(r => setTimeout(r, 400));
  }
  console.log('\n✅ All neighborhood posts published!');
}

main();
