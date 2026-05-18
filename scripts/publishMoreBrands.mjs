/**
 * publishMoreBrands.mjs — Round 2 brand posts
 * Covers all remaining major brands petshiwu carries
 */
const API_BASE = 'https://petshiwu.onrender.com';

async function login() {
  const res = await fetch(`${API_BASE}/api/auth/login`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@petshiwu.com', password: '@Admin,1+23as' }),
  });
  return (await res.json()).token;
}

async function pub(token, post) {
  const res = await fetch(`${API_BASE}/api/v1/blogs/admin`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ ...post, isPublished: true, publishedAt: new Date().toISOString() }),
  });
  const d = await res.json();
  const ok = d.success || d._id || d.data?._id;
  process.stdout.write(`${ok ? '✅' : '❌'} ${post.title.substring(0, 70)}\n`);
  return ok;
}

const brands = [
  { name: 'Orijen', slug: 'orijen-dog-cat-food-nyc-delivery', petType: 'dog', category: 'Dog Care', img: 'photo-1587300003388-59208cc962cb', path: 'dog/dog-food',
    excerpt: 'Buy Orijen biologically appropriate dog and cat food online — delivered to Queens, Brooklyn, and Manhattan. 85%+ animal ingredients, locally sourced, made in the USA.',
    meta: 'Orijen dog & cat food NYC delivery — Queens, Brooklyn, Manhattan. 85%+ animal ingredients. Biologically appropriate nutrition. Free shipping over $49.',
    content: `<h2>Orijen — Biologically Appropriate Nutrition, Delivered to NYC</h2><p>Orijen is widely considered the gold standard of dry dog and cat food. With 85%+ animal ingredients — including fresh and raw meats, organs, and cartilage — Orijen mirrors the diet dogs and cats evolved to eat. No compromise, no filler. PetShiwu delivers Orijen to Queens, Brooklyn, Manhattan, and all NYC boroughs.</p><h2>What Makes Orijen Different</h2><ul><li>85%+ animal ingredients — meat, organs, cartilage, and bone</li><li>Fresh, regional ingredients — never frozen before use</li><li>Freeze-dried liver coating for irresistible palatability</li><li>Made in USA with globally sourced ingredients</li><li>WholePrey ratios: the natural diet replicated in every bag</li></ul><h2>Orijen Lines</h2><ul><li>Original (chicken, turkey, fish)</li><li>Regional Red (red meats)</li><li>Six Fish (all-fish formula)</li><li>Puppy & Puppy Large</li><li>Senior</li><li>Tundra (novel proteins)</li></ul><p>Free shipping over $49. <a href="https://www.petshiwu.com/dog/dog-food">Shop Orijen →</a></p>` },

  { name: 'Acana', slug: 'acana-dog-cat-food-nyc-delivery', petType: 'dog', category: 'Dog Care', img: 'photo-1548199973-03cce0bbc87b', path: 'dog/dog-food',
    excerpt: 'Buy Acana dog and cat food online — delivered to Queens, Brooklyn, and Manhattan. 60-70% animal ingredients, grain-free, made in the USA.',
    meta: 'Acana dog & cat food NYC delivery — Queens, Brooklyn, Manhattan. 60%+ animal ingredients, grain-free. Free shipping over $49.',
    content: `<h2>Acana — Premium Nutrition at a Step Below Orijen</h2><p>From the same maker as Orijen, Acana uses 60-70% animal ingredients and similar WholePrey ratios at a more accessible price point. Grain-free, regionally sourced, and made in USA — Acana is one of the most trusted names in premium pet nutrition. PetShiwu delivers Acana to Queens, Brooklyn, Manhattan, and all of NYC.</p><h2>What Makes Acana Stand Out</h2><ul><li>60-70% animal ingredients — fresh, regional meats and fish</li><li>Grain-free with vegetables, legumes, and botanicals</li><li>WholePrey ratios: meat, organs, and cartilage in every formula</li><li>No artificial preservatives, colors, or flavors</li><li>Made in USA in Acana's own kitchens</li></ul><h2>Acana Lines</h2><ul><li>Heritage (chicken, beef, mixed)</li><li>Regionals (Meadowland, Grasslands, Wild Atlantic)</li><li>Singles (limited ingredient — duck, lamb, fish)</li><li>Puppy & Junior</li><li>Senior Dog</li></ul><p>Free shipping over $49. <a href="https://www.petshiwu.com/dog/dog-food">Shop Acana →</a></p>` },

  { name: 'Merrick', slug: 'merrick-dog-cat-food-nyc-delivery', petType: 'dog', category: 'Dog Care', img: 'photo-1587300003388-59208cc962cb', path: 'dog/dog-food',
    excerpt: 'Buy Merrick grain-free and classic dog and cat food online — delivered to Queens, Brooklyn, Manhattan and NYC. Real deboned meat first, made in USA.',
    meta: 'Merrick dog & cat food NYC delivery. Real meat first, grain-free options, made in USA. Free shipping over $49 to Queens, Brooklyn, Manhattan.',
    content: `<h2>Merrick — Real Meat, Made in USA, Delivered to NYC</h2><p>Merrick uses real deboned meat as the first ingredient across every formula — no meals, no by-products. Made in the USA in Merrick's own Texas kitchen, it's a brand that NYC pet owners trust for transparency and quality. PetShiwu delivers Merrick to Queens, Brooklyn, Manhattan, and all NYC boroughs.</p><h2>Why Merrick</h2><ul><li>Real deboned meat or fish as #1 ingredient</li><li>Made in USA — own manufacturing facility in Texas</li><li>Grain-free and grain-inclusive options</li><li>No artificial preservatives, colors, or flavors</li><li>High protein, moderate fat — balanced for active and indoor pets</li></ul><h2>Merrick Lines</h2><ul><li>Classic (grain-inclusive, real meat first)</li><li>Grain-Free (multiple protein options)</li><li>Lil' Plates (small breed)</li><li>Limited Ingredient (single protein)</li><li>Backcountry (raw-infused)</li></ul><p>Free shipping over $49. <a href="https://www.petshiwu.com/dog/dog-food">Shop Merrick →</a></p>` },

  { name: 'Wellness', slug: 'wellness-dog-cat-food-nyc-delivery', petType: 'dog', category: 'Dog Care', img: 'photo-1548199973-03cce0bbc87b', path: 'dog/dog-food',
    excerpt: 'Buy Wellness pet food online — delivered to Queens, Brooklyn, Manhattan and NYC. Natural ingredients, no fillers, grain-free options for dogs and cats.',
    meta: 'Wellness dog & cat food NYC delivery. Natural, grain-free, no fillers. Free shipping over $49 to Queens, Brooklyn, Manhattan.',
    content: `<h2>Wellness Pet Food — Natural Nutrition Delivered to NYC</h2><p>Wellness has been creating natural pet food since 1997 — long before "natural" was a marketing buzzword. Every formula is crafted with wholesome ingredients, no meat by-products, no artificial preservatives, and no fillers. PetShiwu delivers Wellness dog and cat food to Queens, Brooklyn, Manhattan, and all of NYC.</p><h2>Why Wellness</h2><ul><li>100% natural ingredients — no artificial anything</li><li>No meat by-products, no fillers, no corn/wheat/soy</li><li>CORE line: grain-free, protein-focused (80%+ protein from animal sources)</li><li>Complete Health: balanced nutrition with wholesome grains</li><li>TruFood: minimally processed, closer to whole-food nutrition</li></ul><h2>Wellness Lines</h2><ul><li>Complete Health (balanced, grain-inclusive)</li><li>CORE (grain-free, high-protein)</li><li>Simple (limited ingredient)</li><li>TruFood (minimally processed)</li><li>Small Breed and Large Breed</li></ul><p>Free shipping over $49. <a href="https://www.petshiwu.com/dog/dog-food">Shop Wellness →</a></p>` },

  { name: 'Pedigree', slug: 'pedigree-dog-food-nyc-queens-delivery', petType: 'dog', category: 'Dog Care', img: 'photo-1587300003388-59208cc962cb', path: 'dog/dog-food',
    excerpt: 'Buy Pedigree dog food online — delivered to Queens, Brooklyn, and Manhattan. Complete and balanced everyday nutrition for dogs at affordable prices.',
    meta: 'Pedigree dog food NYC delivery — Queens, Brooklyn, Manhattan. Affordable complete nutrition for dogs. Free shipping over $49.',
    content: `<h2>Pedigree Dog Food — Reliable Everyday Nutrition, Delivered to NYC</h2><p>Pedigree is one of the world's most recognized dog food brands — and for millions of dog owners, it's been a trusted part of their dog's daily routine for decades. Complete and balanced nutrition at prices that work for every budget, delivered by PetShiwu to Queens, Brooklyn, Manhattan, and all of NYC.</p><h2>Why Pedigree</h2><ul><li>Complete and balanced nutrition meeting AAFCO standards</li><li>Whole grains for healthy digestion and energy</li><li>Omega-6 fatty acids for healthy skin and coat</li><li>Affordable — one of the best values in pet nutrition</li><li>Available in dry kibble, wet food, pouches, and treats</li></ul><h2>Pedigree Lines</h2><ul><li>Adult Complete Nutrition</li><li>Puppy</li><li>Weight Management</li><li>Vitality Defence</li><li>Choice Cuts in Gravy (wet)</li></ul><p>Free shipping over $49. <a href="https://www.petshiwu.com/dog/dog-food">Shop Pedigree →</a></p>` },

  { name: 'Rachael Ray Nutrish', slug: 'rachael-ray-nutrish-nyc-queens-delivery', petType: 'dog', category: 'Dog Care', img: 'photo-1548199973-03cce0bbc87b', path: 'dog/dog-food',
    excerpt: 'Buy Rachael Ray Nutrish dog food online — delivered to Queens, Brooklyn, and Manhattan. Natural ingredients, no artificial colors or preservatives.',
    meta: 'Rachael Ray Nutrish dog & cat food NYC delivery. Natural, no artificial preservatives. Free shipping over $49 to Queens, Brooklyn, Manhattan.',
    content: `<h2>Rachael Ray Nutrish — Natural Pet Food Delivered to NYC</h2><p>Created by celebrity chef Rachael Ray, Nutrish uses simple, natural ingredients — real USA-raised meat first, no artificial colors, flavors, or preservatives. It's a natural pet food line at a price point accessible to all NYC pet owners. PetShiwu delivers Nutrish to Queens, Brooklyn, Manhattan, and all of NYC.</p><h2>Why Nutrish</h2><ul><li>Real USA-raised meat as #1 ingredient</li><li>No artificial colors, flavors, or preservatives</li><li>No meat by-products</li><li>Natural ingredients with added vitamins and minerals</li><li>Portion of proceeds donated to animal rescue</li></ul><h2>Nutrish Lines</h2><ul><li>Real Chicken & Veggies</li><li>Zero Grain</li><li>Dish (premium wet food)</li><li>Peak (high-protein, grain-free)</li><li>Super Premium</li></ul><p>Free shipping over $49. <a href="https://www.petshiwu.com/dog/dog-food">Shop Rachael Ray Nutrish →</a></p>` },

  { name: 'Instinct', slug: 'instinct-raw-dog-cat-food-nyc-delivery', petType: 'dog', category: 'Dog Care', img: 'photo-1587300003388-59208cc962cb', path: 'dog/dog-food',
    excerpt: 'Buy Instinct raw and raw-inspired dog and cat food online — delivered to Queens, Brooklyn, Manhattan and NYC. Cage-free chicken, no grain, no artificial additives.',
    meta: 'Instinct raw-inspired dog & cat food NYC delivery. Cage-free chicken, grain-free. Free shipping over $49 to Queens, Brooklyn, Manhattan.',
    content: `<h2>Instinct — Raw-Inspired Pet Nutrition Delivered to NYC</h2><p>Instinct by Nature's Variety brings the benefits of raw nutrition to a convenient, shelf-stable format. Their Original line coats kibble with freeze-dried raw meat, giving dogs and cats the digestive and nutritional benefits of raw without the handling challenges. PetShiwu delivers Instinct to Queens, Brooklyn, Manhattan, and all NYC boroughs.</p><h2>Why Instinct</h2><ul><li>Cage-free chicken or grass-fed beef as #1 ingredient</li><li>Original line: kibble coated with freeze-dried raw</li><li>Raw Boost: higher raw content for maximum raw benefits</li><li>Grain-free with no corn, wheat, soy, or artificial additives</li><li>70%+ animal ingredients</li></ul><h2>Instinct Lines</h2><ul><li>Original (raw-coated kibble)</li><li>Raw Boost (higher freeze-dried content)</li><li>Freeze-Dried Raw (100% raw, just thaw)</li><li>Limited Ingredient (single protein)</li><li>Be Natural (grain-inclusive)</li></ul><p>Free shipping over $49. <a href="https://www.petshiwu.com/dog/dog-food">Shop Instinct →</a></p>` },

  { name: 'Zesty Paws', slug: 'zesty-paws-supplements-nyc-queens-delivery', petType: 'dog', category: 'Dog Care', img: 'photo-1548199973-03cce0bbc87b', path: 'dog',
    excerpt: 'Buy Zesty Paws dog supplements online — delivered to Queens, Brooklyn, Manhattan and NYC. Allergy, joint, skin, gut health supplements for dogs.',
    meta: 'Zesty Paws dog supplements NYC delivery — allergy, joint, gut health. Free shipping over $49 to Queens, Brooklyn, Manhattan.',
    content: `<h2>Zesty Paws Supplements — Delivered to NYC Dogs</h2><p>Zesty Paws is the #1 bestselling pet supplement brand in the US. Their soft chews cover everything from allergies and joints to gut health, skin & coat, and calming — in a treat format that even picky dogs eat willingly. PetShiwu delivers Zesty Paws supplements to Queens, Brooklyn, Manhattan, and all NYC boroughs.</p><h2>Why NYC Dogs Need Zesty Paws</h2><p>City dogs face unique stressors: noise, crowds, limited outdoor time, and stress from apartment living. Zesty Paws supplements address:</p><ul><li><strong>Calming:</strong> Stress Gold calming bites for anxious NYC dogs</li><li><strong>Allergy:</strong> Allergy Immune with Epicor for skin and seasonal allergies</li><li><strong>Joint:</strong> 5-in-1 with glucosamine for dogs on hard pavement daily</li><li><strong>Gut health:</strong> Probiotic bites for digestive wellness</li><li><strong>Skin & coat:</strong> Omega bites for shine and shedding control</li></ul><h2>Top Zesty Paws Products</h2><ul><li>5-in-1 Multivitamin Bites</li><li>Allergy Immune Bites</li><li>Mobility Bites (joint health)</li><li>Calming Bites</li><li>Probiotic Bites</li><li>Omega Bites (skin & coat)</li></ul><p>Free shipping over $49. <a href="https://www.petshiwu.com/dog">Shop Zesty Paws →</a></p>` },

  { name: 'Meow Mix', slug: 'meow-mix-cat-food-nyc-queens-delivery', petType: 'cat', category: 'Cat Care', img: 'photo-1514888286974-6c03e2ca1dba', path: 'cat/cat-food',
    excerpt: 'Buy Meow Mix cat food online — delivered to Queens, Brooklyn, and Manhattan. Affordable complete nutrition that cats love.',
    meta: 'Meow Mix cat food NYC delivery — Queens, Brooklyn, Manhattan. Complete nutrition cats love. Free shipping over $49.',
    content: `<h2>Meow Mix Cat Food — Delivered to Your NYC Apartment</h2><p>Meow Mix is one of the most recognizable cat food brands in America — known for the catchy jingle and the simple fact that cats love it. Complete and balanced, affordable, and widely accepted by even picky cats. PetShiwu delivers Meow Mix to Queens, Brooklyn, Manhattan, and all NYC boroughs.</p><h2>Why Meow Mix</h2><ul><li>Complete and balanced nutrition meeting AAFCO standards</li><li>Cats consistently love the taste</li><li>Affordable — one of the best value cat foods available</li><li>Available in dry, wet pouches, and variety packs</li><li>Multiple flavor options to satisfy picky eaters</li></ul><h2>Meow Mix Lines</h2><ul><li>Original Choice (dry)</li><li>Tender Centers (dual texture)</li><li>Market Select (wet pouches)</li><li>Simple Servings (wet cups)</li><li>Irresistibles (treats)</li></ul><p>Free shipping over $49. <a href="https://www.petshiwu.com/cat/cat-food">Shop Meow Mix →</a></p>` },

  { name: 'Sheba', slug: 'sheba-cat-food-nyc-queens-delivery', petType: 'cat', category: 'Cat Care', img: 'photo-1574158622682-e40e69881006', path: 'cat/cat-food',
    excerpt: 'Buy Sheba premium cat food online — delivered to Queens, Brooklyn, and Manhattan. Premium cuts in gravy and pâté with no artificial flavors or colors.',
    meta: 'Sheba premium cat food NYC delivery — Queens, Brooklyn, Manhattan. Premium cuts, no artificial flavors. Free shipping over $49.',
    content: `<h2>Sheba Premium Cat Food — Delivered to NYC</h2><p>Sheba offers premium wet cat food at an accessible price — tender cuts and pâté in rich sauces, with no artificial flavors, colors, or preservatives. For NYC cat owners who want to feed their cats something they'll actually look forward to, Sheba consistently delivers. PetShiwu ships Sheba to Queens, Brooklyn, Manhattan, and all of NYC.</p><h2>Why Sheba</h2><ul><li>Premium cuts in gravy — real meat texture cats love</li><li>No artificial flavors, colors, or preservatives</li><li>100-calorie portions for easy serving management</li><li>Single-serve Perfect Portions — stays fresh, no waste</li><li>Wide variety of flavors: chicken, tuna, salmon, beef, turkey</li></ul><h2>Sheba Lines</h2><ul><li>Perfect Portions (twin-pack trays)</li><li>Signature Broths</li><li>Cuts in Gravy</li><li>Pâté</li><li>Meaty Tender Sticks (treats)</li></ul><p>Free shipping over $49. <a href="https://www.petshiwu.com/cat/cat-food">Shop Sheba →</a></p>` },
];

function makePost(b) {
  return {
    title: `${b.name} NYC — Delivered to Queens, Brooklyn & Manhattan | PetShiwu`,
    slug: b.slug, petType: b.petType, category: b.category,
    tags: [`${b.name} NYC`, `${b.name} Queens`, `buy ${b.name} online NYC`, `${b.name} delivery Queens Brooklyn`],
    featuredImage: `https://images.unsplash.com/${b.img}?w=1200&q=80`,
    excerpt: b.excerpt, content: b.content,
    metaTitle: `${b.name} NYC — Queens & Brooklyn Delivery | PetShiwu`,
    metaDescription: b.meta,
  };
}

async function main() {
  const token = await login();
  console.log(`Publishing ${brands.length} brand posts...\n`);
  let ok = 0, fail = 0;
  for (const b of brands) {
    const success = await pub(token, makePost(b));
    success ? ok++ : fail++;
    await new Promise(r => setTimeout(r, 350));
  }
  console.log(`\n✅ Done! Published: ${ok} | Failed: ${fail}`);
}
main();
