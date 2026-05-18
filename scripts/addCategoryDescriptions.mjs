/**
 * addCategoryDescriptions.mjs
 * Adds meaningful SEO descriptions to all categories that are missing them.
 */
const API_BASE = 'https://petshiwu.onrender.com';

async function login() {
  const res = await fetch(`${API_BASE}/api/auth/login`, { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({email:'admin@petshiwu.com',password:'@Admin,1+23as'}) });
  return (await res.json()).token;
}

async function updateCategory(token, id, description) {
  const res = await fetch(`${API_BASE}/api/v1/categories/${id}`, {
    method:'PUT', headers:{'Content-Type':'application/json','Authorization':`Bearer ${token}`},
    body:JSON.stringify({description})
  });
  return await res.json();
}

const DESCRIPTIONS = {
  'blankets': 'Keep your dog or cat warm and comfortable with pet blankets. Soft, washable blankets for beds, crates, and couches — delivered to Queens, Brooklyn, and all of NYC.',
  'cages': 'Pet cages for birds, small animals, and reptiles. Wire, plastic, and combo cages in all sizes — delivered to NYC. Free shipping over $49.',
  'carriers': 'Pet carriers for dogs and cats. Airline-approved, soft-sided, and backpack carriers for safe travel around NYC and beyond. Free shipping over $49.',
  'chew-toys': 'Durable chew toys for dogs — rubber, nylon, rope, and natural chews to keep your dog busy and your furniture safe. For heavy and light chewers. Free shipping over $49.',
  'collars': 'Dog and cat collars in every style — flat, martingale, breakaway, GPS, and more. All sizes, all materials. Delivered to Queens, Brooklyn, and all of NYC.',
  'costumes': 'Pet costumes for Halloween, holidays, and everyday fun. Dog and cat costumes in all sizes, from tiny chihuahuas to large breeds. Free shipping over $49 to NYC.',
  'crate-mats': 'Crate mats and liners for dogs — waterproof, washable, and comfortable. The right mat makes crate training easier and keeps your dog comfortable.',
  'deterrents': 'Pet deterrent sprays and mats to protect furniture, carpet, and off-limit areas. Safe for pets and effective for training. Delivered to NYC.',
  'doors': 'Pet doors and flaps for dogs and cats. Wall-mount, door-mount, and sliding glass options in small, medium, and large pet sizes. Free shipping over $49.',
  'dresses': 'Dog dresses and fashion wear for small and medium breeds. Comfortable, stylish, and easy to put on. Delivered to Queens, Brooklyn, and NYC.',
  'dry-food': 'Premium dry dog and cat food — kibble from top brands including Purina Pro Plan, Hill\'s Science Diet, Royal Canin, Blue Buffalo, and Orijen. Free shipping over $49 to NYC.',
  'fetch-toys': 'Fetch toys for dogs — balls, frisbees, launchers, and more. For parks, indoor play, and NYC dog runs. Built to last. Free shipping over $49.',
  'fish-shops': 'Fish and aquarium supplies — tanks, filters, food, decorations, and water treatment. Everything for freshwater and saltwater fish. Delivered to NYC.',
  'food': 'Premium pet food for dogs, cats, birds, small animals, and fish. 10,000+ products from top brands, free shipping over $49, delivered to Queens and all of NYC.',
  'harnesses': 'Dog and cat harnesses — no-pull, step-in, vest, and front-clip styles. Essential for NYC sidewalk walking. All breeds and sizes. Free shipping over $49.',
  'id-tags': 'Pet ID tags for dogs and cats. Engraved, custom, and slide-on tags in metal and plastic. A safety essential for every NYC pet.',
  'leashes': 'Dog leashes for city walking — standard, retractable, hands-free, and training leashes. For NYC sidewalks, parks, and dog runs. Free shipping over $49.',
  'marine-amp-freshwater': 'Marine and freshwater aquarium supplies — coral, live rock, saltwater fish food, and reef care products. Delivered to NYC fish keepers.',
  'multi-pack': 'Pet supply multi-packs — value bundles for food, treats, toys, and more. Buy more, save more. Free shipping over $49 to Queens, Brooklyn, and all of NYC.',
  'pajamas': 'Dog and cat pajamas — soft, comfortable sleepwear for pets who feel the cold in NYC apartments. Fun designs in all sizes. Free shipping over $49.',
  'pens': 'Dog pens and playpens — foldable, portable, and indoor exercise pens for puppies and small dogs. Perfect for NYC apartments.',
  'placemats': 'Pet placemats and food mats — waterproof, silicone, and fabric mats to protect floors from spills. Easy to clean, delivered to NYC.',
  'play-pens': 'Dog and cat playpens for indoor use — foldable wire and plastic pens for puppies and small pets. Great for NYC apartments. Free shipping over $49.',
  'plush-toys': 'Plush dog and cat toys — squeaky, crinkle, and stuffed toys for play and comfort. Machine-washable options available. Free shipping over $49 to NYC.',
  'puppy-food': 'Premium puppy food from top brands — Royal Canin Puppy, Purina Pro Plan Puppy, Hill\'s Science Diet Puppy. Right nutrition for every size and breed. Delivered to NYC.',
  'scratchers': 'Cat scratching posts and pads — sisal, cardboard, and carpet options in vertical and horizontal styles. Essential for every NYC apartment cat. Free shipping over $49.',
  'supplies': 'Pet supplies for dogs, cats, birds, fish, and small animals. Everything you need delivered to Queens, Brooklyn, and all of NYC. Free shipping over $49.',
  'sweaters': 'Dog sweaters and cold-weather wear for NYC winters. Knit, fleece, and waterproof options for small and large breeds. Free shipping over $49.',
  'toys': 'Pet toys for dogs and cats — interactive, plush, chew, and puzzle toys to keep your pet entertained in a NYC apartment. Free shipping over $49.',
  'treats': 'Dog and cat treats — training treats, dental chews, freeze-dried, and natural options from top brands. Free shipping over $49 to Queens, Brooklyn, and NYC.',
  'vacuums': 'Pet hair vacuums and grooming tools — deshedding brushes, pet-specific vacuums, and lint rollers for NYC apartments. Free shipping over $49.',
  'wet-food': 'Premium wet dog and cat food — pâté, chunks in gravy, and broth pouches from Fancy Feast, Sheba, Hill\'s, Royal Canin, and more. Delivered to NYC.',
  'cusches': 'Pet cushions and soft beds for dogs and cats. Plush, memory foam, and bolster styles for comfort in any NYC apartment.',
};

async function main() {
  const token = await login();

  // Get all categories without descriptions
  const res = await fetch(`${API_BASE}/api/v1/categories?limit=200`);
  const d = await res.json();
  const cats = d.data || d.categories || [];
  const toFix = cats.filter(c => !c.description || c.description.length < 20);

  console.log(`Fixing ${toFix.length} categories...\n`);

  let fixed = 0, skipped = 0;
  for (const cat of toFix) {
    const desc = DESCRIPTIONS[cat.slug] || DESCRIPTIONS[cat.slug?.replace(/--/g, '-')] || null;
    if (!desc) {
      process.stdout.write(`⏭️  No description for: ${cat.name} (${cat.slug})\n`);
      skipped++;
      continue;
    }
    const result = await updateCategory(token, cat._id, desc);
    if (result.success || result.data?._id || result._id) {
      process.stdout.write(`✅ ${cat.name}\n`);
      fixed++;
    } else {
      process.stdout.write(`❌ ${cat.name}: ${JSON.stringify(result).substring(0,60)}\n`);
    }
    await new Promise(r => setTimeout(r, 200));
  }
  console.log(`\n✅ Fixed: ${fixed} | Skipped: ${skipped}`);
}
main();
