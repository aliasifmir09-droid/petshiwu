/**
 * publishBrandPosts.mjs
 * One blog post per major brand targeting:
 * "[Brand] NYC", "[Brand] Queens delivery", "buy [Brand] online NYC"
 * These are high-intent commercial searches — people who already know what
 * they want and are looking for where to buy it locally.
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

const brands = [
  {
    name: 'Purina Pro Plan',
    slug: 'purina-pro-plan-nyc-queens-delivery',
    petType: 'dog',
    category: 'Dog Care',
    img: 'photo-1587300003388-59208cc962cb',
    path: 'dog/dog-food',
    tagLine: 'the #1 vet-recommended dog food brand in the US',
    description: 'Developed with over 400 scientists and backed by decades of research, Purina Pro Plan is the most trusted name in pet nutrition. Available in formulas for every breed size, life stage, and health need — from puppies to seniors, sensitive stomachs to active sport dogs.',
    highlights: [
      'High-quality protein (real chicken, salmon, or beef as #1 ingredient)',
      'Live probiotics for digestive and immune health',
      'DHA for brain and vision development (puppy formulas)',
      'Veterinarian-recommended for over 25 years',
      'Available in dry kibble, wet food, and treat formats',
    ],
    lines: ['Savor', 'Focus', 'Sport', 'Bright Mind (senior)', 'Puppy', 'Small & Toy Breed', 'Large Breed'],
  },
  {
    name: "Hill's Science Diet",
    slug: 'hills-science-diet-nyc-queens-delivery',
    petType: 'dog',
    category: 'Dog Care',
    img: 'photo-1548199973-03cce0bbc87b',
    path: 'dog/dog-food',
    tagLine: 'clinically proven nutrition developed by veterinarians',
    description: "Hill's Science Diet has been a cornerstone of veterinary nutrition for over 80 years. Every formula is developed with veterinarians and nutritionists, rigorously tested, and clinically proven to make a visible difference. It's one of the most-prescribed foods in vet offices across the US.",
    highlights: [
      'Clinically proven formulas — not just marketing claims',
      'No artificial colors, flavors, or preservatives',
      'Life-stage specific: puppy, adult, and senior formulas',
      'Available in prescription (Prescription Diet) and regular versions',
      'Extensive product line for dogs and cats',
    ],
    lines: ['Puppy', 'Adult', 'Senior 7+', 'Senior 11+', 'Small Paws', 'Large Breed', 'Perfect Weight'],
  },
  {
    name: 'Blue Buffalo',
    slug: 'blue-buffalo-nyc-queens-delivery',
    petType: 'dog',
    category: 'Dog Care',
    img: 'photo-1587300003388-59208cc962cb',
    path: 'dog/dog-food',
    tagLine: 'natural ingredients, no chicken by-products, no artificial additives',
    description: "Blue Buffalo's Life Protection Formula has made it one of the most recognizable pet food brands in America. Real meat is always the first ingredient, and their proprietary LifeSource Bits add a precise blend of antioxidants, vitamins, and minerals. No chicken by-products. No corn, wheat, or soy. No artificial flavors, colors, or preservatives.",
    highlights: [
      'Real meat as #1 ingredient in every formula',
      'LifeSource Bits — cold-formed to preserve potency of vitamins and antioxidants',
      'No chicken by-products, no artificial preservatives',
      'Wilderness line: grain-free, high-protein formulas',
      'Freedom line: grain-free without the high protein price',
    ],
    lines: ['Life Protection Formula', 'Wilderness (grain-free)', 'Freedom', 'True Solutions', 'Natural Veterinary Diet'],
  },
  {
    name: 'Royal Canin',
    slug: 'royal-canin-nyc-queens-delivery',
    petType: 'dog',
    category: 'Dog Care',
    img: 'photo-1589941013453-ec89f33b5e95',
    path: 'dog/dog-food',
    tagLine: 'breed-specific and size-specific nutrition for dogs and cats',
    description: "Royal Canin takes a precision approach to pet nutrition that no other brand matches. They manufacture formulas specific to individual breeds — French Bulldogs, Labrador Retrievers, German Shepherds, Maine Coons, Persians, and dozens more. Each formula accounts for the unique anatomy, jaw structure, coat, metabolism, and health predispositions of that specific breed.",
    highlights: [
      'Breed-specific formulas for 45+ dog breeds and 10+ cat breeds',
      'Size-specific lines: XS, Small, Medium, Large, XLarge',
      'Life-stage specific: puppy/kitten, adult, senior',
      'Prescription/Veterinary Diet line for health conditions',
      'Developed with veterinarians and nutritionists worldwide',
    ],
    lines: ['Breed Health Nutrition', 'Size Health Nutrition', 'Life Stage', 'Veterinary Diet', 'Indoor'],
  },
  {
    name: 'Taste of the Wild',
    slug: 'taste-of-the-wild-nyc-queens-delivery',
    petType: 'dog',
    category: 'Dog Care',
    img: 'photo-1605568427561-40dd23c2acea',
    path: 'dog/dog-food',
    tagLine: 'grain-free, high-protein formulas inspired by ancestral diets',
    description: 'Taste of the Wild offers grain-free, high-protein dog food formulas inspired by the ancestral diet of wolves. Using novel proteins like roasted bison, venison, smoked salmon, and wild boar — meats rarely found in mainstream dog food — it provides digestive variety and reduces the risk of protein-specific allergies.',
    highlights: [
      'Novel proteins: bison, venison, boar, salmon, duck',
      'Grain-free with legumes and sweet potato as carbohydrate sources',
      'K9 Strain Proprietary Probiotics — species-specific bacteria for dogs',
      'No artificial preservatives, colors, or flavors',
      'Made in the USA with globally sourced ingredients',
    ],
    lines: ['High Prairie (bison)', 'Pacific Stream (salmon)', 'Sierra Mountain (lamb)', 'Southwest Canyon (boar)', 'Wetlands (duck)'],
  },
  {
    name: 'Fancy Feast',
    slug: 'fancy-feast-nyc-queens-delivery',
    petType: 'cat',
    category: 'Cat Care',
    img: 'photo-1514888286974-6c03e2ca1dba',
    path: 'cat/cat-food',
    tagLine: 'the most-loved wet cat food brand in America',
    description: "Fancy Feast has been a household name in cat nutrition for decades — and for good reason. Even the most notoriously picky cats tend to accept Fancy Feast. With dozens of flavors in pâté, flaked, grilled, and broth formats, there's always a texture and protein source to match your cat's preferences.",
    highlights: [
      'Dozens of flavors across multiple textures: pâté, flaked, grilled, broths',
      'High moisture content for urinary and kidney health',
      'No artificial colors or preservatives',
      'Medleys line: premium recipe with vegetables and pasta',
      'Broths line: perfect topper or hydration supplement',
    ],
    lines: ['Classic Pâté', 'Grilled', 'Flaked', 'Elegant Medleys', 'Broths', 'Mornings'],
  },
  {
    name: 'Iams',
    slug: 'iams-dog-cat-food-nyc-queens-delivery',
    petType: 'dog',
    category: 'Dog Care',
    img: 'photo-1548199973-03cce0bbc87b',
    path: 'dog/dog-food',
    tagLine: 'complete everyday nutrition for dogs and cats at a great value',
    description: "Iams has provided complete, balanced pet nutrition for over 70 years. Proactive Health is their flagship line — real chicken or lamb as the first ingredient, no fillers, and a targeted blend of fiber for healthy digestion. Iams sits in the sweet spot of quality and affordability that many NYC pet owners appreciate.",
    highlights: [
      'Real chicken or lamb as #1 ingredient',
      'No fillers — no corn syrup, artificial flavors, or colors',
      'MiniChunks and SmartPuppy formulas for specific needs',
      'Proactive Health line for everyday nutrition',
      'Available for dogs and cats, all life stages',
    ],
    lines: ['Proactive Health', 'Smart Puppy', 'MiniChunks', 'Large Breed', 'Weight Control'],
  },
  {
    name: 'Purina ONE',
    slug: 'purina-one-nyc-queens-delivery',
    petType: 'dog',
    category: 'Dog Care',
    img: 'photo-1587300003388-59208cc962cb',
    path: 'dog/dog-food',
    tagLine: 'real meat first, high protein, trusted Purina quality at everyday prices',
    description: "Purina ONE bridges the gap between budget and premium — real chicken, beef, or salmon as the first ingredient, no artificial colors or flavors, and Purina's trusted manufacturing standards. It's one of the most popular dog and cat food brands among NYC pet owners who want quality without the premium price tag.",
    highlights: [
      'Real meat as #1 ingredient — no meat by-product meals',
      'High protein to support strong muscles',
      'No artificial colors, flavors, or preservatives',
      'SmartBlend: dual-defense antioxidants for immune health',
      'Available for dogs and cats, all life stages',
    ],
    lines: ['SmartBlend (dog)', 'True Instinct (grain-free)', 'Senior 7+', 'Healthy Weight', 'Indoor Advantage (cat)'],
  },
  {
    name: 'Fresh Step',
    slug: 'fresh-step-cat-litter-nyc-queens-delivery',
    petType: 'cat',
    category: 'Cat Care',
    img: 'photo-1574158622682-e40e69881006',
    path: 'cat/cat-litter',
    tagLine: 'powerful odor control cat litter delivered to your NYC apartment',
    description: "Fresh Step is one of America's most popular cat litters — and for NYC apartment dwellers, odor control isn't optional. Fresh Step's ClumpLock technology forms tight clumps that lock in odors, making scooping easy and keeping your small apartment fresh. Available in clumping and non-clumping, scented and unscented formats.",
    highlights: [
      'ClumpLock technology: tight clumps that lock in odor',
      'Activated charcoal for extra odor absorption',
      'Low-dust formula — important for small NYC apartments',
      'Scented and unscented options',
      'Lightweight formula (50% lighter, same odor control)',
    ],
    lines: ['Simply Unscented', 'Odor Shield', 'Febreze Freshness', 'Multi-Cat', 'Lightweight'],
  },
  {
    name: "Dr. Elsey's",
    slug: 'dr-elseys-cat-litter-nyc-queens-delivery',
    petType: 'cat',
    category: 'Cat Care',
    img: 'photo-1574158622682-e40e69881006',
    path: 'cat/cat-litter',
    tagLine: 'veterinarian-founded hypoallergenic cat litter for NYC apartments',
    description: "Dr. Elsey's Precious Cat Ultra is a veterinarian-founded cat litter brand built around solving real litter box problems. Hypoallergenic, low-tracking, and hard-clumping — it's especially popular among cat owners with allergy concerns or cats that are difficult to litter train. The hard clumps make scooping fast and clean, ideal for busy NYC schedules.",
    highlights: [
      'Founded by a feline veterinarian — designed around cat behavior',
      'Hypoallergenic: no plant proteins, perfumes, or deodorants',
      'Hard-clumping for easy, clean scooping',
      'Low-tracking — stays in the box, not on your floors',
      'Cat Attract formula: herbal attractant for difficult-to-train cats',
    ],
    lines: ['Precious Cat Ultra', 'Cat Attract', 'Touch of Outdoors', 'Respiratory Relief', 'Long Haired'],
  },
  {
    name: 'Greenies',
    slug: 'greenies-dental-treats-nyc-queens-delivery',
    petType: 'dog',
    category: 'Dog Care',
    img: 'photo-1587300003388-59208cc962cb',
    path: 'dog/dog-treats',
    tagLine: 'the #1 vet-recommended dental treat for dogs',
    description: "Greenies are the most-recommended dental treats by veterinarians in the US. Their unique chewy texture and patented shape let teeth sink in deep, cleaning all the way to the gum line while freshening breath. For NYC dogs who may not get as much recreational chewing as country dogs, Greenies help maintain dental health between vet cleanings.",
    highlights: [
      'VOHC-accepted (Veterinary Oral Health Council) — proven to reduce tartar',
      'Patented chewy texture cleans down to the gum line',
      'Freshens breath with natural flavors',
      'Made with easily digestible ingredients — no rawhide',
      'Available for every dog size from Teenie to Large',
    ],
    lines: ['Original', 'Grain-Free', 'Aging Care', 'Weight Management', 'Pill Pockets'],
  },
  {
    name: 'Kong',
    slug: 'kong-dog-toys-nyc-queens-delivery',
    petType: 'dog',
    category: 'Dog Care',
    img: 'photo-1587300003388-59208cc962cb',
    path: 'dog/dog-toys',
    tagLine: 'the iconic stuffable dog toy that keeps NYC apartment dogs busy',
    description: "For NYC apartment dogs that spend long hours indoors while their owners commute and work, the Kong is an essential tool. Stuff it with peanut butter or Kong Easy Treat, freeze it, and give it to your dog before you leave — most dogs spend 20–45 minutes working through a frozen Kong. It's mental stimulation, chew satisfaction, and anxiety reduction in one rubber toy.",
    highlights: [
      'Durable natural rubber — designed for power chewers',
      'Hollow center: stuffable with treats, peanut butter, or Kong recipes',
      'Freeze overnight for longer-lasting enrichment',
      'Available in puppy (pink/blue rubber), classic (red), and extreme (black) strengths',
      'Dishwasher safe for easy NYC apartment cleanup',
    ],
    lines: ['Classic (red)', 'Extreme (black — for power chewers)', 'Puppy', 'Senior (purple)', 'Wobbler (food-dispensing)'],
  },
];

function makePost(b) {
  const linesHtml = b.lines.map(l => `<li>${l}</li>`).join('\n');
  const highlightsHtml = b.highlights.map(h => `<li>${h}</li>`).join('\n');

  return {
    title: `${b.name} NYC — Delivered to Queens, Brooklyn & Manhattan | PetShiwu`,
    slug: b.slug,
    petType: b.petType,
    category: b.category,
    tags: [
      `${b.name} NYC`,
      `${b.name} Queens`,
      `buy ${b.name} online NYC`,
      `${b.name} delivery Queens`,
      `${b.name} Brooklyn`,
      `${b.name} Manhattan`,
    ],
    featuredImage: `https://images.unsplash.com/${b.img}?w=1200&q=80`,
    excerpt: `Buy ${b.name} online and get it delivered to Queens, Brooklyn, Manhattan, and all of NYC. PetShiwu carries the full ${b.name} lineup with free shipping on orders over $49.`,
    metaTitle: `${b.name} NYC — Queens & Brooklyn Delivery | PetShiwu`,
    metaDescription: `Buy ${b.name} online and get fast delivery to Queens, Brooklyn & Manhattan. PetShiwu carries the full ${b.name} product range. Free shipping over $49. NYC pet delivery.`,
    content: `<h2>Buy ${b.name} Online — Delivered to NYC</h2>
<p>${b.name} is ${b.tagLine}. ${b.description} PetShiwu carries the full ${b.name} lineup and delivers to Queens, Brooklyn, Manhattan, the Bronx, and Staten Island — free shipping on orders over $49.</p>

<h2>Why ${b.name}?</h2>
<ul>
${highlightsHtml}
</ul>

<h2>${b.name} Product Lines Available at PetShiwu</h2>
<ul>
${linesHtml}
</ul>

<h2>Delivered to All NYC Neighborhoods</h2>
<p>PetShiwu ships ${b.name} products to every NYC borough and neighborhood:</p>
<ul>
  <li><strong>Queens:</strong> Jackson Heights, Flushing, Astoria, Woodside, Forest Hills, Jamaica, Bayside, and all neighborhoods</li>
  <li><strong>Brooklyn:</strong> Park Slope, Williamsburg, Greenpoint, Bay Ridge, Flatbush, Crown Heights, and more</li>
  <li><strong>Manhattan:</strong> Upper West Side, Upper East Side, Harlem, Chelsea, Hell's Kitchen, and all neighborhoods</li>
  <li><strong>Bronx &amp; Staten Island:</strong> All neighborhoods covered</li>
</ul>
<p>Free shipping on orders over $49. Flat $6 on all other orders. Orders ship within 1 business day.</p>

<h2>Shop ${b.name} at PetShiwu</h2>
<p>Browse the full ${b.name} collection and add to your cart today. <a href="https://www.petshiwu.com/${b.path}">Shop ${b.name} →</a></p>
<p>Need help choosing the right ${b.name} formula? Use our <a href="https://www.petshiwu.com">AI Pet Advisor</a> for a personalized recommendation based on your pet's breed, age, and health needs.</p>`,
  };
}

async function main() {
  console.log('Logging in...');
  const token = await login();
  if (!token) { console.error('Login failed'); process.exit(1); }

  console.log(`\nPublishing ${brands.length} brand posts...\n`);
  let ok = 0, fail = 0;
  for (const b of brands) {
    const success = await publishPost(token, makePost(b));
    success ? ok++ : fail++;
    await new Promise(r => setTimeout(r, 380));
  }
  console.log(`\n✅ Done! Published: ${ok} | Failed: ${fail}`);
}

main();
