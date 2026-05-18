/**
 * publishLocalBlogPosts.mjs
 * Publishes geo-targeted blog posts to dominate local NYC/Queens/Jackson Heights SEO.
 *
 * Usage: node scripts/publishLocalBlogPosts.mjs
 */

const API = 'https://petshiwu.onrender.com/api/v1';

async function login() {
  const res = await fetch(`${API}/auth/login`.replace('/v1/', '/'), {
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
    console.log(`✅ Published: ${post.title}`);
  } else {
    console.error(`❌ Failed: ${post.title}`, JSON.stringify(data).substring(0, 200));
  }
}

const posts = [
  {
    title: 'Best Pet Store in Jackson Heights, Queens NY — PetShiwu',
    slug: 'best-pet-store-jackson-heights-queens-ny',
    petType: 'all',
    category: 'Pet Care Tips',
    tags: ['Jackson Heights', 'Queens NY', 'pet store', 'pet supplies', 'NYC pets'],
    featuredImage: 'https://images.unsplash.com/photo-1601758125946-6ec2ef64daf8?w=1200&q=80',
    excerpt: 'Looking for premium pet food, toys, and supplies in Jackson Heights, Queens? PetShiwu delivers top brands to your door with fast shipping across NYC.',
    metaTitle: 'Best Pet Store Jackson Heights Queens NY | PetShiwu',
    metaDescription: 'Shop premium pet food, toys, and supplies in Jackson Heights, Queens. PetShiwu offers top brands for dogs, cats, birds, and reptiles with fast NYC delivery.',
    content: `<h2>Your Neighborhood Pet Store, Online</h2>
<p>Finding quality pet supplies in Jackson Heights, Queens used to mean a trip to a big-box store across town. PetShiwu changes that. We're a Jackson Heights-based online pet store offering over 10,000 products — from premium dog food and cat food to bird supplies, reptile gear, and small animal accessories — delivered fast to your door anywhere in Queens, Brooklyn, Manhattan, and the Bronx.</p>

<h2>What We Carry</h2>
<p>Our catalog covers every pet you love:</p>
<ul>
  <li><strong>Dog food &amp; treats:</strong> Purina Pro Plan, Blue Buffalo, Hill's Science Diet, Royal Canin, Taste of the Wild, and dozens more premium brands</li>
  <li><strong>Cat food &amp; litter:</strong> Fancy Feast, Iams, Friskies, Fresh Step, Dr. Elsey's, and premium grain-free options</li>
  <li><strong>Bird supplies:</strong> Kaytee, ZuPreem, and Lafeber seed mixes, pellets, and treats</li>
  <li><strong>Reptile supplies:</strong> Zoo Med, Exo Terra, and Fluker's lighting, heating, and nutrition</li>
  <li><strong>Small animal:</strong> Oxbow, Kaytee, and Vitakraft food and bedding for rabbits, hamsters, guinea pigs, and ferrets</li>
</ul>

<h2>Why Queens Pet Owners Choose PetShiwu</h2>
<p>We built PetShiwu for busy New Yorkers who want the best for their pets without the hassle. Here's what sets us apart from big chains:</p>
<ul>
  <li><strong>Free shipping on orders over $49</strong> — no membership fee required</li>
  <li><strong>Flat $6 shipping</strong> on orders under $49 — always affordable</li>
  <li><strong>10,000+ products</strong> in stock and ready to ship</li>
  <li><strong>Expert pet care blog</strong> with guides written by pet specialists</li>
  <li><strong>AI Pet Advisor</strong> — get personalized recommendations for your pet's breed, age, and health</li>
</ul>

<h2>Serving All of NYC</h2>
<p>Whether you're in Jackson Heights, Flushing, Astoria, Long Island City, Jamaica, or anywhere else in New York City, PetShiwu ships to you. We know NYC apartments come in all sizes — and so do our pet parents. From studio apartments with a single cat to families with multiple dogs, we have what you need.</p>

<h2>Today's Deals for Queens Pet Owners</h2>
<p>Check out our <a href="https://www.petshiwu.com/products?featured=true">Today's Deals</a> section for the best prices on dog food, cat food, and pet accessories. New deals added daily.</p>

<h2>Shop by Pet Type</h2>
<ul>
  <li><a href="https://www.petshiwu.com/dog">Dog supplies &amp; food</a></li>
  <li><a href="https://www.petshiwu.com/cat">Cat supplies &amp; food</a></li>
  <li><a href="https://www.petshiwu.com/bird">Bird food &amp; accessories</a></li>
  <li><a href="https://www.petshiwu.com/reptile">Reptile supplies &amp; food</a></li>
  <li><a href="https://www.petshiwu.com/small-pet">Small animal supplies</a></li>
</ul>

<p>Questions? Contact us at <a href="mailto:support@petshiwu.com">support@petshiwu.com</a> or call <a href="tel:+16263420419">+1 (626) 342-0419</a>. We're here Monday–Friday 9AM–8PM and Saturday–Sunday 9AM–6PM EST.</p>`,
  },
  {
    title: 'Pet Food Delivery in NYC — Fast Shipping to Queens, Brooklyn & Manhattan',
    slug: 'pet-food-delivery-nyc-queens-brooklyn-manhattan',
    petType: 'all',
    category: 'Pet Care Tips',
    tags: ['NYC pet food delivery', 'pet food Queens', 'pet supplies Brooklyn', 'Manhattan pet store', 'online pet store NYC'],
    featuredImage: 'https://images.unsplash.com/photo-1548199973-03cce0bbc87b?w=1200&q=80',
    excerpt: 'Get premium pet food delivered across NYC — Queens, Brooklyn, Manhattan, the Bronx, and Staten Island. Top brands, competitive prices, free shipping over $49.',
    metaTitle: 'Pet Food Delivery NYC — Queens, Brooklyn, Manhattan | PetShiwu',
    metaDescription: 'Order pet food online and get it delivered fast across NYC. PetShiwu ships dog food, cat food, bird supplies, and more to Queens, Brooklyn, Manhattan, and the Bronx.',
    content: `<h2>Premium Pet Food, Delivered Across NYC</h2>
<p>New York City pet owners deserve better than settling for whatever's at the corner bodega. PetShiwu brings over 10,000 premium pet products to your doorstep — whether you're in a Queens walk-up, a Brooklyn brownstone, or a Manhattan high-rise.</p>

<h2>How Our Delivery Works</h2>
<p>Shopping with PetShiwu is simple:</p>
<ol>
  <li>Browse our catalog of 10,000+ products by pet type, brand, or category</li>
  <li>Add to cart — no account required to browse</li>
  <li>Checkout with secure payment</li>
  <li>Your order ships fast — 2–5 business days to any NYC address</li>
</ol>
<p><strong>Free shipping on orders over $49.</strong> Flat $6 shipping on all other orders. No subscription required.</p>

<h2>Top Pet Food Brands We Carry</h2>
<h3>Dog Food Brands</h3>
<ul>
  <li>Purina Pro Plan — vet-recommended, science-backed nutrition</li>
  <li>Blue Buffalo — natural ingredients, no artificial preservatives</li>
  <li>Hill's Science Diet — prescription and regular formulas</li>
  <li>Royal Canin — breed-specific and size-specific formulas</li>
  <li>Taste of the Wild — grain-free, high-protein options</li>
  <li>Orijen, Acana, Merrick, Wellness, and more</li>
</ul>
<h3>Cat Food Brands</h3>
<ul>
  <li>Fancy Feast — classic wet food favorites</li>
  <li>Iams — complete nutrition for all life stages</li>
  <li>Blue Buffalo Wilderness — high-protein grain-free</li>
  <li>Royal Canin — veterinary formulas and breed-specific</li>
  <li>Purina ONE, Friskies, Sheba, and premium pâtés</li>
</ul>

<h2>Delivery Areas We Serve</h2>
<p>PetShiwu delivers to all five boroughs and beyond:</p>
<ul>
  <li><strong>Queens:</strong> Jackson Heights, Flushing, Astoria, Long Island City, Jamaica, Forest Hills, Bayside, and more</li>
  <li><strong>Brooklyn:</strong> Park Slope, Williamsburg, Bay Ridge, Flatbush, Crown Heights, and all neighborhoods</li>
  <li><strong>Manhattan:</strong> Upper West Side, Upper East Side, Harlem, Midtown, Downtown, and all neighborhoods</li>
  <li><strong>Bronx:</strong> Riverdale, Fordham, Pelham Bay, and surrounding areas</li>
  <li><strong>Staten Island:</strong> St. George, Tottenville, and all neighborhoods</li>
  <li><strong>Long Island, New Jersey, and beyond</strong> — we ship nationwide</li>
</ul>

<h2>Special Diets &amp; Health Needs</h2>
<p>Many NYC pets have specific dietary needs. We carry:</p>
<ul>
  <li>Grain-free and limited ingredient diets</li>
  <li>Senior pet formulas</li>
  <li>Puppy and kitten nutrition</li>
  <li>Weight management formulas</li>
  <li>Sensitive stomach and digestive health options</li>
  <li>High-protein raw-inspired diets</li>
</ul>
<p>Not sure what's right for your pet? Try our <a href="https://www.petshiwu.com">AI Pet Advisor</a> for personalized recommendations based on your pet's breed, age, and health conditions.</p>

<h2>Start Shopping</h2>
<p><a href="https://www.petshiwu.com/dog">Shop dog food</a> | <a href="https://www.petshiwu.com/cat">Shop cat food</a> | <a href="https://www.petshiwu.com/products">Browse all products</a></p>`,
  },
  {
    title: 'Dog Food in Queens NY — Top Brands at the Best Prices',
    slug: 'dog-food-queens-ny-top-brands',
    petType: 'dog',
    category: 'Dog Care',
    tags: ['dog food Queens NY', 'dog food Jackson Heights', 'buy dog food NYC', 'premium dog food New York', 'dog food delivery Queens'],
    featuredImage: 'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=1200&q=80',
    excerpt: 'Find the best dog food brands in Queens NY. PetShiwu delivers Purina Pro Plan, Blue Buffalo, Royal Canin, and more to Jackson Heights, Flushing, Astoria, and all of Queens.',
    metaTitle: 'Dog Food Queens NY — Best Brands & Prices | PetShiwu',
    metaDescription: 'Shop premium dog food in Queens NY. PetShiwu delivers Purina Pro Plan, Blue Buffalo, Hill\'s Science Diet, Royal Canin, and 1,000+ more dog food options to your door.',
    content: `<h2>The Best Dog Food, Delivered to Queens</h2>
<p>Queens is one of the most dog-friendly boroughs in NYC — with Flushing Meadows Park, Astoria Park, and dozens of neighborhood dog runs, Queens dog owners take their pets seriously. So does PetShiwu. We carry over 1,000 dog food products from the most trusted brands in pet nutrition, all delivered fast to Jackson Heights, Flushing, Astoria, Woodside, and every corner of Queens.</p>

<h2>Top Dog Food Brands Available at PetShiwu</h2>
<h3>Purina Pro Plan</h3>
<p>Developed with veterinarians and backed by 400+ scientists, Purina Pro Plan is one of the most recommended dog foods by vets in the US. Available in formulas for every life stage, breed size, and health need — including sensitive stomach, weight management, sport, and breed-specific options. <a href="https://www.petshiwu.com/dog/dog-food">Shop Purina Pro Plan</a>.</p>

<h3>Blue Buffalo</h3>
<p>Blue Buffalo's Life Protection Formula starts with real meat as the first ingredient, adding wholesome grains, vegetables, and their proprietary LifeSource Bits — a blend of antioxidants, vitamins, and minerals. No chicken by-products, no corn, wheat, or soy, and no artificial flavors. <a href="https://www.petshiwu.com/dog/dog-food">Shop Blue Buffalo</a>.</p>

<h3>Hill's Science Diet</h3>
<p>Hill's Science Diet is clinically proven nutrition developed by veterinarians and nutritionists. Perfect for dogs with specific health needs — joint support, digestive health, healthy weight, and more. Available in both dry kibble and wet food formats.</p>

<h3>Royal Canin</h3>
<p>Royal Canin takes breed-specific nutrition to another level, with formulas designed specifically for French Bulldogs, Labrador Retrievers, German Shepherds, Chihuahuas, and dozens of other breeds. Their size-specific formulas (XS, S, M, L, XL) also address the unique metabolic needs of different dog sizes.</p>

<h3>Taste of the Wild</h3>
<p>Inspired by the ancestral diet of wild canines, Taste of the Wild offers grain-free, high-protein kibble with real roasted meats — bison, venison, smoked salmon, wild boar, and more. A favorite among active dogs and dogs with grain sensitivities.</p>

<h2>Choosing the Right Dog Food</h2>
<p>Every dog is different. Here are the key factors to consider:</p>
<ul>
  <li><strong>Life stage:</strong> Puppies, adults, and seniors have different nutritional needs. Always choose food labeled for your dog's life stage.</li>
  <li><strong>Size:</strong> Large breeds have different joint and metabolic needs than small breeds. Look for size-appropriate formulas.</li>
  <li><strong>Health conditions:</strong> Dogs with allergies, sensitive stomachs, kidney disease, or other conditions may need prescription or specialized diets. Consult your vet.</li>
  <li><strong>Activity level:</strong> Highly active dogs (working dogs, sporting breeds) need more calories and protein than low-activity companions.</li>
</ul>

<h2>Free Shipping to All Queens Zip Codes</h2>
<p>Order $49 or more and get free shipping to any Queens address — 11354, 11355, 11372, 11373, 11374, 11377, 11378, 11379, 11385, and every other Queens zip code. Under $49? Just $6 flat shipping.</p>

<p><a href="https://www.petshiwu.com/dog">Browse all dog products</a> or <a href="https://www.petshiwu.com/dog/dog-food">shop dog food now</a>.</p>`,
  },
  {
    title: 'Cat Food Delivery NYC — Premium Brands Shipped to Your Apartment',
    slug: 'cat-food-delivery-nyc-premium-brands',
    petType: 'cat',
    category: 'Cat Care',
    tags: ['cat food delivery NYC', 'cat food Queens', 'cat supplies New York', 'online cat food NYC', 'cat food Manhattan'],
    featuredImage: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=1200&q=80',
    excerpt: 'Order premium cat food online and get it delivered to your NYC apartment. PetShiwu carries Fancy Feast, Blue Buffalo, Royal Canin, Purina ONE, and 500+ cat food options.',
    metaTitle: 'Cat Food Delivery NYC — Premium Brands to Your Door | PetShiwu',
    metaDescription: 'Get premium cat food delivered to your NYC apartment. Shop Fancy Feast, Blue Buffalo, Royal Canin, Hill\'s Science Diet, and 500+ cat food brands at PetShiwu.',
    content: `<h2>Premium Cat Food, Delivered to Your NYC Apartment</h2>
<p>New York City apartments aren't always near a well-stocked pet store. And lugging heavy bags of cat food on the subway is nobody's idea of fun. PetShiwu brings over 500 cat food products — wet food, dry kibble, treats, toppers, and raw-inspired options — directly to your door, anywhere in NYC.</p>

<h2>Wet Cat Food</h2>
<p>Most cats don't drink enough water, making moisture-rich wet food an important part of a healthy diet. We carry:</p>
<ul>
  <li><strong>Fancy Feast:</strong> The classic. Dozens of flavors in pâté, flaked, and grilled formats that even the pickiest cats love.</li>
  <li><strong>Sheba:</strong> Premium cuts in gravy and pâté, with no artificial flavors or preservatives.</li>
  <li><strong>Weruva:</strong> Human-grade ingredients, minimal processing, and high-moisture recipes perfect for cats prone to urinary issues.</li>
  <li><strong>Royal Canin wet food:</strong> Prescription and regular formulas for cats with health conditions.</li>
</ul>

<h2>Dry Cat Food (Kibble)</h2>
<p>Dry food is convenient, shelf-stable, and great for dental health when cats chew. Our top sellers include:</p>
<ul>
  <li><strong>Purina ONE:</strong> High-protein, no fillers, made with real chicken or salmon as the first ingredient.</li>
  <li><strong>Blue Buffalo Wilderness:</strong> Grain-free, high-protein formulas inspired by a cat's wild diet.</li>
  <li><strong>Hill's Science Diet:</strong> Vet-recommended with proven clinical nutrition for every life stage.</li>
  <li><strong>Iams Proactive Health:</strong> Great everyday nutrition at an affordable price point.</li>
</ul>

<h2>Specialty &amp; Prescription Diets</h2>
<p>City cats can develop specific health needs. We carry options for:</p>
<ul>
  <li>Urinary tract health (Royal Canin Urinary, Hill's c/d)</li>
  <li>Hairball control</li>
  <li>Indoor cats with lower activity levels</li>
  <li>Senior cats (7+)</li>
  <li>Sensitive stomach and limited ingredient diets</li>
  <li>Weight management</li>
  <li>Kitten nutrition (growth formulas)</li>
</ul>

<h2>Cat Treats &amp; Toppers</h2>
<p>Keep your cat engaged and reward good behavior with our selection of treats. Temptations, Greenies dental treats, Churu lickable treats, freeze-dried meat toppers, and broth-based food toppers are all available for fast NYC delivery.</p>

<h2>Fast Delivery, No Membership Required</h2>
<p>Unlike some pet retailers, we don't charge a monthly membership fee. Free shipping on orders over $49. Flat $6 on everything else. Orders ship in 1 business day.</p>

<p>Not sure what to feed your cat? Use our <a href="https://www.petshiwu.com">AI Pet Advisor</a> and get a recommendation in seconds based on your cat's age, breed, weight, and health goals.</p>

<p><a href="https://www.petshiwu.com/cat">Browse all cat products</a> | <a href="https://www.petshiwu.com/cat/cat-food">Shop cat food</a></p>`,
  },
  {
    title: 'Pet Supplies Near Me — Why NYC Pet Owners Order from PetShiwu',
    slug: 'pet-supplies-near-me-nyc',
    petType: 'all',
    category: 'Pet Care Tips',
    tags: ['pet supplies near me', 'pet store near me NYC', 'pet supplies New York', 'online pet store near me', 'pet shop Queens'],
    featuredImage: 'https://images.unsplash.com/photo-1450778869180-41d0601e046e?w=1200&q=80',
    excerpt: 'Searching for pet supplies near you in NYC? PetShiwu is a Jackson Heights-based pet store delivering 10,000+ products to every neighborhood in New York City.',
    metaTitle: 'Pet Supplies Near Me NYC — PetShiwu | Jackson Heights, Queens',
    metaDescription: 'Find pet supplies near you in NYC. PetShiwu is a Jackson Heights, Queens-based online pet store with 10,000+ products and fast delivery across New York City.',
    content: `<h2>"Pet Supplies Near Me" — We're Right Here</h2>
<p>If you're searching for pet supplies near you in New York City, you've found us. PetShiwu is based in Jackson Heights, Queens, and we deliver premium pet food, toys, accessories, and health products to every neighborhood in NYC — typically within 2–5 business days.</p>

<h2>Why Shop Online Instead of a Local Store?</h2>
<p>We get it — sometimes you need a bag of food tonight. But for most pet supply needs, ordering online from PetShiwu has clear advantages:</p>
<ul>
  <li><strong>Better selection:</strong> 10,000+ products vs. the limited shelf space of a physical store</li>
  <li><strong>Better prices:</strong> Lower overhead means lower prices and regular deals</li>
  <li><strong>No carrying heavy bags:</strong> Your 30-pound bag of dog food comes to your door</li>
  <li><strong>Shop anytime:</strong> 24/7, from your couch, in your pajamas</li>
  <li><strong>Expert advice:</strong> Our AI Pet Advisor and Learning Center help you make the right choice</li>
</ul>

<h2>What We Carry</h2>
<p>Whatever pet you have, we have what you need:</p>
<ul>
  <li><a href="https://www.petshiwu.com/dog"><strong>Dog supplies:</strong></a> Food, treats, toys, leashes, beds, grooming, health &amp; wellness</li>
  <li><a href="https://www.petshiwu.com/cat"><strong>Cat supplies:</strong></a> Food, litter, toys, beds, carriers, grooming, health</li>
  <li><a href="https://www.petshiwu.com/bird"><strong>Bird supplies:</strong></a> Food, cages, perches, toys, treats</li>
  <li><a href="https://www.petshiwu.com/reptile"><strong>Reptile supplies:</strong></a> Food, lighting, heating, habitats, substrate</li>
  <li><a href="https://www.petshiwu.com/small-pet"><strong>Small animal:</strong></a> Rabbit, hamster, guinea pig, ferret, chinchilla food and accessories</li>
  <li><a href="https://www.petshiwu.com/fish"><strong>Fish supplies:</strong></a> Aquarium food, water treatment, accessories</li>
</ul>

<h2>Neighborhoods We Serve in NYC</h2>
<p>We ship to every address in New York City and beyond. Some neighborhoods we regularly serve:</p>
<p><strong>Queens:</strong> Jackson Heights, Flushing, Astoria, Long Island City, Woodside, Sunnyside, Elmhurst, Corona, Forest Hills, Rego Park, Jamaica, Bayside, Whitestone, Fresh Meadows</p>
<p><strong>Brooklyn:</strong> Park Slope, Williamsburg, Greenpoint, DUMBO, Brooklyn Heights, Crown Heights, Flatbush, Bay Ridge, Bensonhurst, Sheepshead Bay</p>
<p><strong>Manhattan:</strong> Upper West Side, Upper East Side, Harlem, East Harlem, Washington Heights, Inwood, Hell's Kitchen, Chelsea, SoHo, Tribeca, Lower East Side</p>
<p><strong>Bronx:</strong> Riverdale, Fieldston, Pelham Bay, Morris Park, Tremont, Fordham</p>
<p><strong>Staten Island:</strong> St. George, New Brighton, Tottenville, Great Kills</p>

<h2>Our Promise to NYC Pet Owners</h2>
<p>Quality products. Fair prices. Fast delivery. Expert advice. And a support team that actually answers — call us at <a href="tel:+16263420419">+1 (626) 342-0419</a> or email <a href="mailto:support@petshiwu.com">support@petshiwu.com</a>, Monday–Friday 9AM–8PM, weekends 9AM–6PM EST.</p>

<p><a href="https://www.petshiwu.com/products">Browse all products now →</a></p>`,
  },
];

async function main() {
  console.log('Logging in...');
  const token = await login();
  if (!token) { console.error('Login failed'); process.exit(1); }

  console.log(`Publishing ${posts.length} geo-targeted blog posts...\n`);
  for (const post of posts) {
    await publishPost(token, post);
    await new Promise(r => setTimeout(r, 500));
  }
  console.log('\nDone!');
}

main();
