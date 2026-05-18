/**
 * publishManhattanBronxPosts.mjs
 * Publishes neighborhood delivery posts for Manhattan and the Bronx.
 */

const API_BASE = 'https://petshiwu.onrender.com';

async function login() {
  const res = await fetch(`${API_BASE}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@petshiwu.com', password: '@Admin,1+23as' }),
  });
  return (await res.json()).token;
}

async function publishPost(token, post) {
  const res = await fetch(`${API_BASE}/api/v1/blogs/admin`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ ...post, isPublished: true, publishedAt: new Date().toISOString() }),
  });
  const data = await res.json();
  const ok = data.success || data._id || data.data?._id;
  process.stdout.write(`${ok ? '✅' : '❌'} ${post.title.substring(0, 72)}\n`);
  return ok;
}

const manhattan = [
  { name: 'Upper West Side', zip: '10023, 10024, 10025', desc: 'one of NYC\'s most pet-dense neighborhoods, famous for Riverside Park and Central Park dog runs' },
  { name: 'Upper East Side', zip: '10021, 10028, 10065, 10075', desc: 'a classic Manhattan neighborhood where pet owners take exceptional care of their animals' },
  { name: 'Harlem', zip: '10027, 10030, 10037', desc: 'a vibrant and culturally rich Manhattan neighborhood with a large and growing pet-owner community' },
  { name: 'Astoria', zip: '11102, 11103', desc: 'one of the most dog-friendly areas in NYC with numerous parks and pet-welcoming businesses' },
  { name: 'Hell\'s Kitchen', zip: '10036, 10019', desc: 'a bustling midtown Manhattan neighborhood where busy professionals love their pets' },
  { name: 'Washington Heights', zip: '10032, 10033, 10040', desc: 'a lively upper Manhattan neighborhood with a passionate pet-owning community' },
  { name: 'Chelsea', zip: '10001, 10011', desc: 'a trendy Manhattan neighborhood where pet owners expect the best for their companions' },
  { name: 'Lower East Side', zip: '10002', desc: 'a hip downtown Manhattan neighborhood with a young, pet-loving population' },
];

const bronx = [
  { name: 'Riverdale', zip: '10463, 10471', desc: 'an affluent Bronx neighborhood known for its green spaces and devoted pet owners' },
  { name: 'Fordham', zip: '10458', desc: 'a central Bronx neighborhood with many families who rely on home delivery for their pets' },
  { name: 'Pelham Bay', zip: '10461, 10462', desc: 'home to NYC\'s largest park and a community of active, outdoor-loving pet owners' },
  { name: 'Morris Park', zip: '10462', desc: 'a close-knit Bronx community where pets are beloved members of every household' },
  { name: 'Tremont', zip: '10457', desc: 'a diverse Bronx neighborhood with a growing community of dedicated pet owners' },
  { name: 'Concourse', zip: '10451, 10452', desc: 'a central Bronx area where pet delivery services save owners time and effort' },
];

function makePost(n, borough) {
  const slug = `pet-food-delivery-${n.name.toLowerCase().replace(/['\s]+/g, '-').replace(/-+/g, '-')}-${borough.toLowerCase()}-ny`;
  return {
    title: `Pet Food & Supplies Delivery in ${n.name}, ${borough} NY | PetShiwu`,
    slug,
    petType: 'all',
    category: 'Pet Care Tips',
    tags: [
      `pet store ${n.name}`,
      `pet food ${n.name} ${borough}`,
      `pet supplies ${n.name} NY`,
      `dog food ${n.name}`,
      `cat food ${n.name} ${borough}`,
      `pet delivery ${n.name} NYC`,
    ],
    featuredImage: 'https://images.unsplash.com/photo-1601758125946-6ec2ef64daf8?w=1200&q=80',
    excerpt: `Premium pet food and supplies delivered to ${n.name}, ${borough}. PetShiwu ships dog food, cat food, treats, toys, and more — free shipping on orders over $49.`,
    metaTitle: `Pet Food Delivery ${n.name} ${borough} NY | PetShiwu`,
    metaDescription: `Order pet food and supplies delivered to ${n.name}, ${borough}. PetShiwu carries 10,000+ products from Purina, Blue Buffalo, Royal Canin & more. Free shipping over $49. ZIP: ${n.zip}.`,
    content: `<h2>Pet Food & Supplies Delivered to ${n.name}, ${borough}</h2>
<p>${n.name} is ${n.desc}. PetShiwu delivers premium pet food, toys, treats, and accessories directly to your ${n.name} door — skip the heavy bags and the store trip entirely.</p>

<h2>Why ${n.name} Pet Owners Love PetShiwu</h2>
<ul>
  <li><strong>10,000+ products</strong> — dog food, cat food, bird, reptile, fish, small animals</li>
  <li><strong>Free shipping on orders over $49</strong> — no membership needed</li>
  <li><strong>Flat $6 shipping</strong> on orders under $49</li>
  <li><strong>Fast delivery</strong> to ${n.name} zip codes: ${n.zip}</li>
  <li><strong>Top brands:</strong> Purina Pro Plan, Blue Buffalo, Royal Canin, Hill's Science Diet, Taste of the Wild, Fancy Feast, Fresh Step, and 100+ more</li>
  <li><strong>AI Pet Advisor</strong> for personalized recommendations</li>
</ul>

<h2>Shop by Pet</h2>
<ul>
  <li><a href="https://www.petshiwu.com/dog">🐕 Dog food, treats &amp; toys</a></li>
  <li><a href="https://www.petshiwu.com/cat">🐈 Cat food, litter &amp; accessories</a></li>
  <li><a href="https://www.petshiwu.com/bird">🦜 Bird food &amp; supplies</a></li>
  <li><a href="https://www.petshiwu.com/reptile">🦎 Reptile supplies</a></li>
  <li><a href="https://www.petshiwu.com/small-pet">🐹 Small animal supplies</a></li>
  <li><a href="https://www.petshiwu.com/fish">🐟 Fish &amp; aquarium</a></li>
</ul>

<h2>How to Order</h2>
<ol>
  <li>Browse <a href="https://www.petshiwu.com/products">10,000+ products</a></li>
  <li>Add to cart — enter your ${n.name} address at checkout</li>
  <li>Ships within 1 business day — arrives in 2–5 days</li>
</ol>

<p>Questions? <a href="mailto:support@petshiwu.com">support@petshiwu.com</a> | <a href="tel:+16263420419">+1 (626) 342-0419</a> | Mon–Fri 9AM–8PM, Sat–Sun 9AM–6PM EST</p>
<p><a href="https://www.petshiwu.com/products"><strong>Start shopping — free shipping over $49 →</strong></a></p>`,
  };
}

async function main() {
  console.log('Logging in...');
  const token = await login();
  if (!token) { console.error('Login failed'); process.exit(1); }

  const all = [
    ...manhattan.map(n => makePost(n, 'Manhattan')),
    ...bronx.map(n => makePost(n, 'Bronx')),
  ];

  console.log(`\nPublishing ${all.length} posts (${manhattan.length} Manhattan + ${bronx.length} Bronx)...\n`);
  let ok = 0, fail = 0;
  for (const post of all) {
    const success = await publishPost(token, post);
    success ? ok++ : fail++;
    await new Promise(r => setTimeout(r, 380));
  }
  console.log(`\n✅ Done! Published: ${ok} | Failed: ${fail}`);
}

main();
