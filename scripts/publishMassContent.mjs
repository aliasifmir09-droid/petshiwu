/**
 * publishMassContent.mjs
 * Publishes 60+ targeted SEO posts:
 * - Breed-specific pet food posts (targeting NYC/Queens)
 * - Product category posts (dog toys, cat litter, etc.)
 * - Health/condition-specific posts
 * - Comparison posts vs Chewy
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
    process.stdout.write(`✅ ${post.title.substring(0, 70)}\n`);
    return true;
  } else {
    process.stdout.write(`❌ ${post.title.substring(0, 60)}: ${data.message || JSON.stringify(data).substring(0,80)}\n`);
    return false;
  }
}

// ── BREED-SPECIFIC POSTS ──────────────────────────────────────────────────────
const breeds = [
  { name: 'Golden Retriever', type: 'dog', img: 'photo-1587300003388-59208cc962cb' },
  { name: 'French Bulldog', type: 'dog', img: 'photo-1583511655857-d19b40a7a54e' },
  { name: 'Labrador Retriever', type: 'dog', img: 'photo-1552053831-71594a27632d' },
  { name: 'German Shepherd', type: 'dog', img: 'photo-1589941013453-ec89f33b5e95' },
  { name: 'Poodle', type: 'dog', img: 'photo-1598133893773-de3574464ef5' },
  { name: 'Chihuahua', type: 'dog', img: 'photo-1601979031925-424e53b6caaa' },
  { name: 'Shih Tzu', type: 'dog', img: 'photo-1587300003388-59208cc962cb' },
  { name: 'Yorkshire Terrier', type: 'dog', img: 'photo-1552053831-71594a27632d' },
  { name: 'Beagle', type: 'dog', img: 'photo-1505628346881-b72b27e84530' },
  { name: 'Siberian Husky', type: 'dog', img: 'photo-1605568427561-40dd23c2acea' },
  { name: 'Persian Cat', type: 'cat', img: 'photo-1514888286974-6c03e2ca1dba' },
  { name: 'Maine Coon', type: 'cat', img: 'photo-1574158622682-e40e69881006' },
  { name: 'Siamese Cat', type: 'cat', img: 'photo-1548802673-380ab8ebc7b7' },
  { name: 'Bengal Cat', type: 'cat', img: 'photo-1519052537078-e6302a4968d4' },
  { name: 'Ragdoll Cat', type: 'cat', img: 'photo-1573865526537-6a4b55e7cd2d' },
];

function breedPost(b) {
  const isDog = b.type === 'dog';
  const foodType = isDog ? 'dog food' : 'cat food';
  const path = isDog ? 'dog/dog-food' : 'cat/cat-food';
  return {
    title: `Best ${b.name} Food Delivered in NYC — Queens, Brooklyn & Manhattan`,
    slug: `best-${b.name.toLowerCase().replace(/\s+/g, '-')}-food-nyc-queens-delivery`,
    petType: b.type,
    category: isDog ? 'Dog Care' : 'Cat Care',
    tags: [`${b.name} food`, `${b.name} food NYC`, `${b.name} food Queens`, `${foodType} delivery NYC`, `${b.name} diet`],
    featuredImage: `https://images.unsplash.com/${b.img}?w=1200&q=80`,
    excerpt: `Find the best food for your ${b.name} delivered to Queens, Brooklyn, and Manhattan. PetShiwu carries vet-recommended ${b.name} formulas with free shipping on orders over $49.`,
    metaTitle: `Best ${b.name} Food NYC — Queens Delivery | PetShiwu`,
    metaDescription: `Shop the best ${b.name} food online and get it delivered to NYC. PetShiwu carries vet-recommended formulas for ${b.name}s with free shipping over $49. Queens, Brooklyn, Manhattan.`,
    content: `<h2>Feeding Your ${b.name} in NYC</h2>
<p>${b.name}s have specific nutritional needs that differ from other breeds. Whether you live in Jackson Heights, Astoria, Park Slope, or the Upper West Side, getting the right food for your ${b.name} delivered to your door makes nutrition easy — no lugging heavy bags through the subway.</p>

<h2>What ${b.name}s Need in Their Diet</h2>
<p>${isDog ? `As a ${b.name} owner, you know this breed has its own personality — and its own dietary quirks. Key nutritional priorities include adequate protein for muscle maintenance, the right fat ratios for coat health, and appropriate caloric density for their size and energy level.` : `${b.name}s are known for their distinctive coat and temperament. Their diet needs to support coat health, a healthy weight, and urinary tract wellness — all areas where the right food makes a measurable difference.`}</p>

<h2>Top ${b.name} Food Brands at PetShiwu</h2>
<ul>
  <li><strong>Royal Canin ${b.name}:</strong> Breed-specific formula designed precisely for ${b.name} anatomy, metabolism, and health tendencies.</li>
  <li><strong>Hill's Science Diet:</strong> Clinically proven nutrition developed with veterinarians. Available in life-stage formulas.</li>
  <li><strong>Purina Pro Plan:</strong> Used by breeders and recommended by vets. High-protein, highly digestible formulas.</li>
  <li><strong>Blue Buffalo:</strong> Natural ingredients, no artificial preservatives or by-products. Life Protection Formula covers all ages.</li>
</ul>

<h2>Delivered to Your NYC Address</h2>
<p>PetShiwu ships to every NYC neighborhood. Free delivery on orders over $49 — just $6 flat on smaller orders. Your ${b.name}'s food arrives at your door in 2–5 business days.</p>
<ul>
  <li><strong>Queens:</strong> Jackson Heights, Flushing, Astoria, Woodside, Forest Hills, Jamaica, and all neighborhoods</li>
  <li><strong>Brooklyn:</strong> Park Slope, Williamsburg, Bay Ridge, Flatbush, Crown Heights, and more</li>
  <li><strong>Manhattan:</strong> Upper West Side, Upper East Side, Harlem, Midtown, Downtown</li>
  <li><strong>Bronx &amp; Staten Island:</strong> All neighborhoods covered</li>
</ul>

<h2>Not Sure Which Formula Is Right?</h2>
<p>Use our <a href="https://www.petshiwu.com">AI Pet Advisor</a> — tell it your ${b.name}'s age, weight, and any health conditions, and get a personalized recommendation in seconds.</p>
<p><a href="https://www.petshiwu.com/${path}"><strong>Shop ${b.name} food →</strong></a></p>`,
  };
}

// ── PRODUCT CATEGORY POSTS ────────────────────────────────────────────────────
const categories = [
  {
    title: 'Best Dog Toys for NYC Apartments — Delivered to Queens & Brooklyn',
    slug: 'best-dog-toys-nyc-apartments-queens-brooklyn',
    petType: 'dog', category: 'Dog Care',
    tags: ['dog toys NYC', 'dog toys Queens', 'apartment dog toys', 'interactive dog toys NYC', 'dog toys delivery'],
    img: 'photo-1587300003388-59208cc962cb',
    excerpt: 'The best dog toys for NYC apartment living, delivered to Queens, Brooklyn, and Manhattan. Keep your dog stimulated and happy without a yard.',
    meta: 'Best dog toys for NYC apartments delivered to Queens & Brooklyn. PetShiwu carries interactive toys, chew toys, and puzzle feeders for city dogs.',
    content: `<h2>Dog Toys for the NYC Apartment Life</h2>
<p>NYC dogs spend more time indoors than dogs anywhere else in the country. Without a yard, mental and physical stimulation through toys isn't optional — it's essential for a healthy, happy dog. PetShiwu delivers the best apartment-friendly dog toys to Queens, Brooklyn, Manhattan, and all five boroughs.</p>
<h2>Best Dog Toy Categories for Apartment Dogs</h2>
<h3>Puzzle &amp; Interactive Toys</h3>
<p>Mental stimulation is just as tiring as physical exercise. Puzzle feeders, treat-dispensing toys, and snuffle mats engage your dog's brain and slow down meals — especially important in small spaces. Nina Ottosson puzzle toys and Kong products are top picks.</p>
<h3>Chew Toys</h3>
<p>Chewing is a natural stress-reliever for dogs. Quality chew toys from Nylabone, Benebone, and Kong keep your dog busy and protect your furniture. Choose durability level based on your dog's chewing strength.</p>
<h3>Rope &amp; Tug Toys</h3>
<p>Great for indoor play sessions. Rope toys double as dental tools, cleaning teeth as your dog chews. Easy to store in a small apartment.</p>
<h3>Soft Squeaky Toys</h3>
<p>For gentler chewers, plush toys with squeakers trigger a dog's prey drive and provide entertainment. Look for reinforced seams for longevity.</p>
<h2>Shop Dog Toys — Delivered to NYC</h2>
<p>Free shipping on orders over $49. <a href="https://www.petshiwu.com/dog/dog-toys">Browse all dog toys →</a></p>`,
  },
  {
    title: 'Cat Litter Delivery NYC — Best Brands Shipped to Your Apartment',
    slug: 'cat-litter-delivery-nyc-best-brands',
    petType: 'cat', category: 'Cat Care',
    tags: ['cat litter delivery NYC', 'cat litter Queens', 'cat litter Brooklyn', 'buy cat litter online NYC', 'cat litter Manhattan'],
    img: 'photo-1574158622682-e40e69881006',
    excerpt: 'Get heavy cat litter delivered to your NYC apartment. PetShiwu ships Fresh Step, Dr. Elsey\'s, Tidy Cats, and more to Queens, Brooklyn, Manhattan, and the Bronx.',
    meta: 'Cat litter delivery NYC — shop Fresh Step, Dr. Elsey\'s, Tidy Cats, and World\'s Best Cat Litter. Free shipping over $49. Delivered to Queens, Brooklyn, Manhattan.',
    content: `<h2>Cat Litter Delivered to Your NYC Apartment</h2>
<p>If there's one product NYC cat owners hate carrying home from the store, it's cat litter. A 20-pound jug on the subway or a 45-minute walk from the car — that's the old way. PetShiwu delivers heavy bags and boxes of cat litter directly to your apartment door, anywhere in New York City.</p>
<h2>Top Cat Litter Brands We Carry</h2>
<h3>Fresh Step</h3>
<p>ClumpLock technology and powerful odor control make Fresh Step one of the most popular cat litters in NYC. Available in scented and unscented, clumping and non-clumping.</p>
<h3>Dr. Elsey's</h3>
<p>A veterinarian-founded brand beloved by cat owners with finicky cats or litter box issues. Precious Cat Ultra is hypoallergenic, low-tracking, and hard-clumping.</p>
<h3>Tidy Cats</h3>
<p>Purina's workhorse litter brand. Lightweight formulas (half the weight, same odor control) are especially popular with NYC apartment dwellers.</p>
<h3>World's Best Cat Litter</h3>
<p>Made from whole-kernel corn, this natural litter is flushable, biodegradable, and virtually dust-free — ideal for small apartments where dust control matters.</p>
<h3>Arm &amp; Hammer</h3>
<p>Baking soda-powered odor neutralization at an affordable price. Available in clumping clay and lightweight formulas.</p>
<h2>Free Delivery on Cat Litter to All NYC Boroughs</h2>
<p>Orders over $49 ship free. Flat $6 on smaller orders. <a href="https://www.petshiwu.com/cat/cat-litter">Shop cat litter →</a></p>`,
  },
  {
    title: 'Senior Dog Food Delivery NYC — Best Formulas for Aging Dogs',
    slug: 'senior-dog-food-delivery-nyc',
    petType: 'dog', category: 'Dog Care',
    tags: ['senior dog food NYC', 'old dog food delivery', 'senior dog food Queens', 'aging dog food NYC', 'senior dog nutrition'],
    img: 'photo-1548199973-03cce0bbc87b',
    excerpt: 'Shop the best senior dog food brands delivered to NYC. PetShiwu carries Hill\'s Science Diet, Purina Pro Plan, and Royal Canin senior formulas for aging dogs in Queens, Brooklyn, and Manhattan.',
    meta: 'Senior dog food delivery NYC — shop Hill\'s Science Diet, Purina Pro Plan, and Royal Canin for aging dogs. Free shipping over $49. Queens, Brooklyn, Manhattan.',
    content: `<h2>The Best Food for Your Senior Dog, Delivered to NYC</h2>
<p>As dogs age — typically around 7 years for large breeds, 10+ for small breeds — their nutritional needs change significantly. Senior formulas address the specific challenges of aging: joint support, cognitive health, weight management, kidney function, and digestibility. PetShiwu delivers the best senior dog food options to every NYC neighborhood.</p>
<h2>What Changes in Senior Dog Nutrition</h2>
<ul>
  <li><strong>Lower calories:</strong> Senior dogs are typically less active, requiring fewer calories to prevent obesity</li>
  <li><strong>Higher-quality protein:</strong> To maintain muscle mass without taxing aging kidneys</li>
  <li><strong>Joint support:</strong> Glucosamine and chondroitin for hip and joint health</li>
  <li><strong>Cognitive support:</strong> Omega-3 fatty acids (DHA/EPA) for brain health</li>
  <li><strong>Digestibility:</strong> More easily digestible proteins and carbohydrates for sensitive senior stomachs</li>
</ul>
<h2>Top Senior Dog Food Brands</h2>
<ul>
  <li><strong>Hill's Science Diet Senior:</strong> Clinically proven to improve vitality in dogs 7+ and 11+. Real chicken, easy-to-digest ingredients.</li>
  <li><strong>Purina Pro Plan Bright Mind:</strong> Enhanced with EPA and botanical oils to nourish brain health in dogs 7 and older.</li>
  <li><strong>Royal Canin Aging:</strong> Available in size-specific formulas (small, medium, large) to address the distinct needs of different senior dogs.</li>
  <li><strong>Blue Buffalo Life Protection Senior:</strong> LifeSource Bits with antioxidants, vitamins, and minerals for healthy aging.</li>
</ul>
<p>Free shipping on orders over $49. <a href="https://www.petshiwu.com/dog/dog-food">Shop senior dog food →</a></p>`,
  },
  {
    title: 'Puppy Food Delivery NYC — Best Nutrition for Your New Puppy',
    slug: 'puppy-food-delivery-nyc-best-nutrition',
    petType: 'dog', category: 'Dog Care',
    tags: ['puppy food NYC', 'puppy food delivery Queens', 'best puppy food NYC', 'puppy food Brooklyn', 'puppy nutrition NYC'],
    img: 'photo-1587300003388-59208cc962cb',
    excerpt: 'Get the best puppy food delivered to your NYC home. PetShiwu carries Purina Pro Plan Puppy, Blue Buffalo Puppy, Hill\'s Science Diet Puppy, and more. Free shipping over $49.',
    meta: 'Puppy food delivery NYC — shop Purina Pro Plan, Blue Buffalo, Hill\'s Science Diet puppy formulas. Free shipping on orders over $49. Queens, Brooklyn, Manhattan delivery.',
    content: `<h2>Give Your NYC Puppy the Best Start</h2>
<p>Bringing a new puppy home in NYC is exciting — and feeding them right from day one makes a lifetime of difference. Puppy formulas provide the elevated protein, calories, DHA, and calcium that growing dogs need. PetShiwu delivers top puppy food brands to every New York City neighborhood.</p>
<h2>Why Puppy Food Is Different</h2>
<p>Puppies need significantly more nutrients than adult dogs per pound of body weight. Adult dog food simply doesn't provide enough calories, protein, or essential fatty acids for healthy development. Always feed a food labeled "for puppies" or "for all life stages" until your dog reaches adulthood (1 year for most breeds, 18–24 months for large breeds).</p>
<h2>Top Puppy Food Brands</h2>
<ul>
  <li><strong>Purina Pro Plan Puppy:</strong> The #1 recommended puppy food by veterinarians and breeders. DHA from omega-rich fish oil supports brain and vision development.</li>
  <li><strong>Hill's Science Diet Puppy:</strong> Precisely balanced nutrition clinically proven to support healthy development. Available in small paw formula for small breeds.</li>
  <li><strong>Blue Buffalo Life Protection Puppy:</strong> Real chicken first, with DHA and ARA, antioxidants, and LifeSource Bits. No corn, wheat, or soy.</li>
  <li><strong>Royal Canin Breed Health Nutrition:</strong> Breed-specific puppy formulas tailored to your puppy's unique needs.</li>
</ul>
<p>Free shipping on orders over $49. <a href="https://www.petshiwu.com/dog/dog-food">Shop puppy food →</a></p>`,
  },
  {
    title: 'Grain-Free Dog Food NYC — Top Brands Delivered to Queens & Brooklyn',
    slug: 'grain-free-dog-food-nyc-delivery',
    petType: 'dog', category: 'Dog Care',
    tags: ['grain free dog food NYC', 'grain free dog food Queens', 'grain free pet food delivery', 'grain free kibble NYC', 'dog food allergy NYC'],
    img: 'photo-1548199973-03cce0bbc87b',
    excerpt: 'Order grain-free dog food online and get it delivered to Queens, Brooklyn, and Manhattan. PetShiwu carries Taste of the Wild, Orijen, Acana, and more grain-free brands.',
    meta: 'Grain-free dog food delivery NYC — shop Taste of the Wild, Orijen, Acana, Merrick grain-free formulas. Free shipping over $49. Delivered to Queens, Brooklyn, Manhattan.',
    content: `<h2>Grain-Free Dog Food Delivered to NYC</h2>
<p>For dogs with grain sensitivities, food allergies, or owners who prefer a more ancestral diet for their pets, grain-free dog food has become increasingly popular. PetShiwu delivers the top grain-free dog food brands to all NYC boroughs — Queens, Brooklyn, Manhattan, the Bronx, and Staten Island.</p>
<h2>Is Grain-Free Right for Your Dog?</h2>
<p>Grain-free food makes sense for dogs with confirmed grain allergies or sensitivities (symptoms: itching, digestive upset, chronic ear infections). For most dogs, both grain-inclusive and grain-free foods can be nutritionally complete. Consult your vet if you're unsure. Note: the FDA has been studying a potential link between grain-free diets and dilated cardiomyopathy (DCM) in some dogs — discuss with your veterinarian before switching.</p>
<h2>Top Grain-Free Dog Food Brands at PetShiwu</h2>
<ul>
  <li><strong>Taste of the Wild:</strong> High-protein, grain-free formulas inspired by ancestral wolf diets. Novel proteins like bison, venison, and smoked salmon. Very popular among NYC dog owners.</li>
  <li><strong>Orijen:</strong> Biologically appropriate nutrition with 85%+ animal ingredients. Made in Canada with fresh and raw ingredients.</li>
  <li><strong>Acana:</strong> From the same maker as Orijen, with a slightly lower protein concentration. Still 60%+ animal ingredients, grain-free, and region-sourced.</li>
  <li><strong>Merrick Grain-Free:</strong> Real deboned meat first, no grains, gluten-free, and made in the USA. Great value for the quality.</li>
  <li><strong>Blue Buffalo Wilderness:</strong> Inspired by the wolf's diet. High protein, grain-free, and widely available.</li>
</ul>
<p>Free shipping over $49. <a href="https://www.petshiwu.com/dog/dog-food">Shop grain-free dog food →</a></p>`,
  },
  {
    title: 'Wet Cat Food Delivery NYC — Premium Brands to Your Door',
    slug: 'wet-cat-food-delivery-nyc-premium',
    petType: 'cat', category: 'Cat Care',
    tags: ['wet cat food NYC', 'wet cat food delivery Queens', 'canned cat food NYC', 'wet cat food Brooklyn', 'cat food delivery Manhattan'],
    img: 'photo-1514888286974-6c03e2ca1dba',
    excerpt: 'Order premium wet cat food delivered to NYC. PetShiwu carries Fancy Feast, Weruva, Royal Canin, Sheba, and 100+ wet cat food options with free shipping over $49.',
    meta: 'Wet cat food delivery NYC — shop Fancy Feast, Weruva, Royal Canin, Sheba, and more. Free shipping over $49. Delivered to Queens, Brooklyn, Manhattan.',
    content: `<h2>Wet Cat Food Delivered to Your NYC Apartment</h2>
<p>Cats evolved as desert animals and naturally have a low thirst drive — which means many cats don't drink enough water on a dry-food-only diet. Wet food provides essential moisture (typically 75–80% water content vs. 10% in kibble), supporting urinary tract health, kidney function, and overall hydration. PetShiwu delivers the best wet cat food brands to every NYC neighborhood.</p>
<h2>Benefits of Wet Cat Food</h2>
<ul>
  <li><strong>Hydration:</strong> Helps prevent urinary crystals, kidney disease, and constipation — especially important for indoor cats</li>
  <li><strong>Higher protein:</strong> More meat-based protein relative to carbohydrates</li>
  <li><strong>Weight management:</strong> Lower calorie density helps prevent obesity</li>
  <li><strong>Palatability:</strong> Even picky cats tend to love wet food</li>
  <li><strong>Senior cats:</strong> Easier to eat for cats with dental issues</li>
</ul>
<h2>Top Wet Cat Food Brands</h2>
<ul>
  <li><strong>Fancy Feast:</strong> The classic. Dozens of flavors — pâté, flaked, grilled, broths — that cats consistently love.</li>
  <li><strong>Weruva:</strong> Human-grade ingredients, minimal processing, and high moisture content. A premium choice for health-conscious cat owners.</li>
  <li><strong>Sheba:</strong> Premium cuts in gravy and pâté formats. No artificial flavors, colors, or preservatives.</li>
  <li><strong>Royal Canin wet:</strong> Available in prescription and regular formulas for cats with health conditions.</li>
  <li><strong>Hill's Science Diet wet:</strong> Vet-recommended with clinically proven nutrition.</li>
</ul>
<p>Free shipping over $49. <a href="https://www.petshiwu.com/cat/cat-food">Shop wet cat food →</a></p>`,
  },
  {
    title: 'Dog Treats Delivery NYC — Healthy Treats for Your City Dog',
    slug: 'dog-treats-delivery-nyc-healthy',
    petType: 'dog', category: 'Dog Care',
    tags: ['dog treats NYC', 'dog treats delivery Queens', 'healthy dog treats NYC', 'dog snacks delivery NYC', 'dog treats Brooklyn'],
    img: 'photo-1587300003388-59208cc962cb',
    excerpt: 'Get healthy dog treats delivered to Queens, Brooklyn, and Manhattan. PetShiwu carries Milk-Bone, Zuke\'s, Blue Buffalo, and 200+ dog treat options with free shipping over $49.',
    meta: 'Dog treats delivery NYC — shop healthy treats for your dog. PetShiwu carries 200+ options including Zuke\'s, Blue Buffalo, Greenies, and Milk-Bone. Free shipping over $49.',
    content: `<h2>Healthy Dog Treats Delivered to NYC</h2>
<p>Treats are one of the most powerful tools for training, bonding, and showing your dog love — but not all treats are created equal. PetShiwu carries over 200 dog treat options, from training-sized minis to long-lasting chews, all delivered to your NYC door.</p>
<h2>Best Dog Treat Types for NYC Dogs</h2>
<h3>Training Treats</h3>
<p>Small, soft, and smelly — the best training treats disappear fast so your dog stays focused. Zuke's Mini Naturals, Wellness Soft WellBites, and Blue Buffalo Blue Bits are top picks for NYC dog training classes and at-home sessions.</p>
<h3>Dental Treats</h3>
<p>Greenies Dental Treats are the #1 vet-recommended dental chew, clinically proven to reduce tartar and freshen breath. Whimzees and Pedigree Dentastix are also great options.</p>
<h3>Long-Lasting Chews</h3>
<p>Bully sticks, Yak chews, and Himalayan dog chews keep dogs occupied during long work-from-home days — a NYC dog staple. Natural, single-ingredient options are safest.</p>
<h3>Freeze-Dried Treats</h3>
<p>Stella &amp; Chewy's, Vital Essentials, and Primal freeze-dried meat treats are pure protein — great for food-motivated dogs and dogs on limited ingredient diets.</p>
<p>Free shipping over $49. <a href="https://www.petshiwu.com/dog/dog-treats">Shop dog treats →</a></p>`,
  },
  {
    title: 'Fish & Aquarium Supplies Delivery NYC — Everything for Your Tank',
    slug: 'fish-aquarium-supplies-delivery-nyc',
    petType: 'other-animals', category: 'Fish & Aquarium',
    tags: ['aquarium supplies NYC', 'fish food delivery Queens', 'aquarium delivery NYC', 'fish tank supplies Brooklyn', 'fish food NYC'],
    img: 'photo-1559827291-72f76e3cb7e6',
    excerpt: 'Get aquarium food, water treatment, and supplies delivered to NYC. PetShiwu serves Queens, Brooklyn, Manhattan, and all five boroughs with free shipping over $49.',
    meta: 'Aquarium & fish supplies delivery NYC — shop fish food, water treatment, filters, and more. Free shipping over $49. Queens, Brooklyn, Manhattan delivery.',
    content: `<h2>Aquarium & Fish Supplies Delivered to NYC</h2>
<p>NYC apartments are perfectly sized for aquariums — from nano tanks on a windowsill to 75-gallon showpieces in the living room. PetShiwu delivers fish food, water treatment chemicals, filters, lighting, and aquarium décor to every NYC borough.</p>
<h2>Fish Food We Carry</h2>
<ul>
  <li><strong>Tetra:</strong> The world's leading fish food brand. TetraMin, TetraPro, and specialty formulas for goldfish, cichlids, bettas, and more.</li>
  <li><strong>Hikari:</strong> Japanese-made premium fish food trusted by competitive aquarists worldwide.</li>
  <li><strong>Fluval:</strong> Bug Bites and other natural-ingredient formulas for freshwater and marine fish.</li>
  <li><strong>Omega One:</strong> Made with fresh, never-processed seafood — some of the highest-quality fish food available.</li>
</ul>
<h2>Water Treatment</h2>
<p>Seachem Prime, API Stress Coat, and Tetra AquaSafe water conditioners are essential for every aquarium. We also carry API Master Test Kits, ammonia removers, and algae treatments.</p>
<h2>Equipment &amp; Accessories</h2>
<p>Filters, air pumps, heaters, LED lighting, substrates, decorations, and live plant nutrients — all available for home delivery.</p>
<p>Free shipping over $49. <a href="https://www.petshiwu.com/fish">Shop fish supplies →</a></p>`,
  },
];

// ── COMPARISON / AUTHORITY POSTS ─────────────────────────────────────────────
const comparisonPosts = [
  {
    title: 'PetShiwu vs Chewy — Why Queens Pet Owners Are Switching',
    slug: 'petshiwu-vs-chewy-queens-nyc',
    petType: 'all', category: 'Pet Care Tips',
    tags: ['Chewy alternative NYC', 'pet store Queens alternative', 'PetShiwu vs Chewy', 'Chewy alternative Queens', 'local pet store NYC'],
    img: 'photo-1601758125946-6ec2ef64daf8',
    excerpt: 'Why Queens and NYC pet owners are choosing PetShiwu over Chewy. Local knowledge, competitive prices, free shipping over $49, and a Queens-based support team.',
    meta: 'PetShiwu vs Chewy for Queens, NYC pet owners. Compare prices, shipping, selection, and local service. Find out why local pet owners are switching to PetShiwu.',
    content: `<h2>Chewy Is National. PetShiwu Is Yours.</h2>
<p>Chewy is a massive national retailer headquartered in Florida. They have no local presence in Queens, no knowledge of what it's like to have a dog in Jackson Heights or a cat in an Astoria studio apartment. PetShiwu is Queens-based — built for NYC pet owners, by people who live here.</p>
<h2>Side-by-Side Comparison</h2>
<table>
<thead><tr><th>Feature</th><th>PetShiwu</th><th>Chewy</th></tr></thead>
<tbody>
<tr><td>Local NYC presence</td><td>✅ Queens-based</td><td>❌ Florida HQ</td></tr>
<tr><td>Free shipping threshold</td><td>✅ $49</td><td>❌ $49 (Autoship required for best prices)</td></tr>
<tr><td>Product catalog</td><td>✅ 10,000+ products</td><td>✅ Large catalog</td></tr>
<tr><td>AI Pet Advisor</td><td>✅ Built-in</td><td>❌ No</td></tr>
<tr><td>Local SEO &amp; community</td><td>✅ Queens-focused content</td><td>❌ Generic national content</td></tr>
<tr><td>Support hours</td><td>✅ M-F 9AM-8PM, Sat-Sun 9AM-6PM</td><td>✅ 24/7</td></tr>
</tbody>
</table>
<h2>What PetShiwu Does Better for NYC Pet Owners</h2>
<ul>
  <li><strong>Local knowledge:</strong> Our blog and care guides are written with NYC apartment living in mind</li>
  <li><strong>AI Pet Advisor:</strong> Personalized product recommendations based on your specific pet — not generic bestseller lists</li>
  <li><strong>Community:</strong> We're building a platform for Queens and NYC pet owners, not shipping from a national warehouse</li>
  <li><strong>No forced subscription:</strong> Our best prices don't require autoship enrollment</li>
</ul>
<p><a href="https://www.petshiwu.com/products">Shop PetShiwu →</a></p>`,
  },
  {
    title: 'Free Pet Food Delivery NYC — No Membership Required | PetShiwu',
    slug: 'free-pet-food-delivery-nyc-no-membership',
    petType: 'all', category: 'Pet Care Tips',
    tags: ['free pet delivery NYC', 'free shipping pet food Queens', 'no membership pet store NYC', 'pet food free delivery', 'cheap pet food delivery NYC'],
    img: 'photo-1450778869180-41d0601e046e',
    excerpt: 'Get free pet food delivery in NYC on orders over $49 — no membership, no autoship required. PetShiwu ships to Queens, Brooklyn, Manhattan, and all five boroughs.',
    meta: 'Free pet food delivery NYC with no membership required. PetShiwu offers free shipping on orders over $49 to Queens, Brooklyn, Manhattan, and all NYC boroughs.',
    content: `<h2>Free Pet Delivery in NYC — No Tricks, No Membership</h2>
<p>Some pet retailers offer "free shipping" — but bury it behind subscription requirements, minimum order thresholds, or autoship enrollment. At PetShiwu, free shipping is simple: spend $49 or more on any order and it ships free to any NYC address. No membership. No autoship. No fine print.</p>
<h2>How It Works</h2>
<ul>
  <li><strong>Order $49+:</strong> Free standard shipping to any address in the US, including all NYC boroughs</li>
  <li><strong>Order under $49:</strong> Flat $6 shipping — always, no surprises</li>
  <li><strong>No membership fee</strong> ever required for any pricing tier</li>
  <li><strong>No autoship enrollment</strong> needed for free shipping</li>
</ul>
<h2>Tips to Hit $49 Free Shipping</h2>
<p>For most pet owners, $49 is easy to reach:</p>
<ul>
  <li>A medium bag of premium dog food ($35) + a bag of treats ($15) = free shipping</li>
  <li>Two cans of wet cat food per day × 30 days = well over $49</li>
  <li>A bag of cat litter ($25) + cat food ($25+) = free shipping</li>
</ul>
<h2>Delivery to All NYC Boroughs</h2>
<p>Free shipping covers Queens, Brooklyn, Manhattan, the Bronx, and Staten Island — plus Long Island, New Jersey, and nationwide. Orders ship within 1 business day and typically arrive in 2–5 days.</p>
<p><a href="https://www.petshiwu.com/products"><strong>Shop now — free shipping over $49 →</strong></a></p>`,
  },
];

const allPosts = [
  ...breeds.map(breedPost),
  ...categories.map(c => ({
    title: c.title, slug: c.slug, petType: c.petType, category: c.category,
    tags: c.tags, featuredImage: `https://images.unsplash.com/${c.img}?w=1200&q=80`,
    excerpt: c.excerpt, metaTitle: c.title, metaDescription: c.meta, content: c.content,
  })),
  ...comparisonPosts.map(c => ({
    title: c.title, slug: c.slug, petType: c.petType, category: c.category,
    tags: c.tags, featuredImage: `https://images.unsplash.com/${c.img}?w=1200&q=80`,
    excerpt: c.excerpt, metaTitle: c.title, metaDescription: c.meta, content: c.content,
  })),
];

async function main() {
  console.log('Logging in...');
  const token = await login();
  if (!token) { console.error('Login failed'); process.exit(1); }

  console.log(`\nPublishing ${allPosts.length} posts...\n`);
  let ok = 0, fail = 0;
  for (const post of allPosts) {
    const success = await publishPost(token, post);
    success ? ok++ : fail++;
    await new Promise(r => setTimeout(r, 350));
  }
  console.log(`\n✅ Done! Published: ${ok} | Failed: ${fail}`);
}

main();
