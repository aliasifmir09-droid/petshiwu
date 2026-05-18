/**
 * publishExpandedContent.mjs
 * Staten Island, Long Island, NJ posts + deep how-to content targeting
 * high-intent buyer research queries.
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
  process.stdout.write(`${ok ? '✅' : '❌'} ${post.title.substring(0, 72)}\n`);
  return ok;
}

const posts = [
  // ── STATEN ISLAND ─────────────────────────────────────────────────────────
  {
    title: 'Pet Food Delivery Staten Island NY — Premium Brands | PetShiwu',
    slug: 'pet-food-delivery-staten-island-ny',
    petType: 'all', category: 'Pet Care Tips',
    tags: ['pet food delivery Staten Island', 'pet store Staten Island NY', 'dog food Staten Island', 'cat food Staten Island', 'pet supplies SI NYC'],
    img: 'photo-1601758125946-6ec2ef64daf8',
    meta: 'Pet food and supplies delivered to Staten Island NY. PetShiwu carries 10,000+ products — dog food, cat food, bird, reptile. Free shipping over $49.',
    excerpt: 'Get premium pet food and supplies delivered to Staten Island. PetShiwu ships Purina, Blue Buffalo, Royal Canin, and 10,000+ products to all SI neighborhoods.',
    content: `<h2>Pet Food & Supplies Delivered to Staten Island</h2><p>Staten Island pet owners deserve the same quality and convenience as the rest of NYC. PetShiwu delivers 10,000+ premium pet products to every Staten Island neighborhood — St. George, Tottenville, Great Kills, New Brighton, Bay Terrace, Oakwood, and beyond.</p><h2>What We Deliver to Staten Island</h2><ul><li><a href="https://www.petshiwu.com/dog/dog-food">Dog food</a>: Purina Pro Plan, Blue Buffalo, Royal Canin, Hill's Science Diet</li><li><a href="https://www.petshiwu.com/cat/cat-food">Cat food</a>: Fancy Feast, Sheba, Purina ONE, Royal Canin</li><li><a href="https://www.petshiwu.com/cat/cat-litter">Cat litter</a>: Fresh Step, Dr. Elsey's, Tidy Cats</li><li><a href="https://www.petshiwu.com/bird">Bird supplies</a>, <a href="https://www.petshiwu.com/reptile">reptile gear</a>, <a href="https://www.petshiwu.com/small-pet">small animal</a>, <a href="https://www.petshiwu.com/fish">fish</a></li></ul><h2>Staten Island Zip Codes We Serve</h2><p>10301, 10302, 10303, 10304, 10305, 10306, 10307, 10308, 10309, 10310, 10312, 10314 — and all SI zip codes.</p><h2>Free Shipping Over $49</h2><p>Orders ship in 1 business day, arrive in 2–5 days. <a href="https://www.petshiwu.com/products">Shop now →</a></p>`,
  },
  // ── LONG ISLAND ────────────────────────────────────────────────────────────
  {
    title: 'Pet Food Delivery Long Island NY — Nassau & Suffolk County | PetShiwu',
    slug: 'pet-food-delivery-long-island-ny-nassau-suffolk',
    petType: 'all', category: 'Pet Care Tips',
    tags: ['pet food delivery Long Island', 'pet store Long Island NY', 'dog food Long Island', 'Nassau County pet delivery', 'Suffolk County pet store'],
    img: 'photo-1548199973-03cce0bbc87b',
    meta: 'Pet food delivered to Long Island NY — Nassau and Suffolk County. 10,000+ products, top brands, free shipping over $49. Dog food, cat food, bird supplies.',
    excerpt: 'Get premium pet food and supplies delivered anywhere on Long Island. PetShiwu serves Nassau County, Suffolk County, and all Long Island communities.',
    content: `<h2>Pet Food & Supplies Delivered Across Long Island</h2><p>From Great Neck to Montauk, PetShiwu delivers premium pet food and supplies to every community on Long Island. No more driving to big-box stores — get the brands you trust delivered to your Nassau County or Suffolk County home.</p><h2>Long Island Communities We Serve</h2><p><strong>Nassau County:</strong> Great Neck, Manhasset, Garden City, Hempstead, Valley Stream, Freeport, Long Beach, Oceanside, Rockville Centre, Mineola, Hicksville, Plainview, Levittown</p><p><strong>Suffolk County:</strong> Huntington, Commack, Smithtown, Hauppauge, Islip, Bay Shore, Patchogue, Babylon, Amityville, Copiague, Farmingdale, Deer Park, Bohemia, Ronkonkoma</p><h2>What We Deliver</h2><ul><li><a href="https://www.petshiwu.com/dog">Dog food, treats & toys</a></li><li><a href="https://www.petshiwu.com/cat">Cat food, litter & accessories</a></li><li><a href="https://www.petshiwu.com/bird">Bird supplies</a></li><li><a href="https://www.petshiwu.com/reptile">Reptile gear</a></li></ul><p>Free shipping over $49. Orders arrive in 2–5 business days. <a href="https://www.petshiwu.com/products">Shop now →</a></p>`,
  },
  // ── NEW JERSEY ─────────────────────────────────────────────────────────────
  {
    title: 'Pet Food Delivery New Jersey — Hoboken, Jersey City, Newark | PetShiwu',
    slug: 'pet-food-delivery-new-jersey-hoboken-jersey-city',
    petType: 'all', category: 'Pet Care Tips',
    tags: ['pet food delivery New Jersey', 'pet store Hoboken NJ', 'dog food Jersey City', 'pet supplies Newark NJ', 'cat food NJ delivery'],
    img: 'photo-1601758125946-6ec2ef64daf8',
    meta: 'Pet food delivered to New Jersey — Hoboken, Jersey City, Newark, and beyond. 10,000+ products, free shipping over $49. Dog food, cat food, bird supplies.',
    excerpt: 'Order premium pet food and supplies delivered to Hoboken, Jersey City, Newark, and all of New Jersey. Free shipping on orders over $49.',
    content: `<h2>Pet Food & Supplies Delivered Across New Jersey</h2><p>New Jersey pet owners have the same need for quality, convenience, and competitive pricing as NYC. PetShiwu ships to all NJ zip codes — from Hoboken and Jersey City directly across the Hudson to communities across the entire state.</p><h2>NJ Communities We Serve</h2><p><strong>Hudson County:</strong> Hoboken, Jersey City, Union City, Weehawken, Bayonne, Kearny, Harrison</p><p><strong>Essex County:</strong> Newark, Montclair, Bloomfield, Nutley, Belleville, East Orange</p><p><strong>Bergen County:</strong> Hackensack, Fort Lee, Englewood, Teaneck, Paramus, Fair Lawn</p><p><strong>Middlesex County:</strong> New Brunswick, Edison, Piscataway, East Brunswick, Woodbridge</p><h2>Top Brands We Ship to NJ</h2><ul><li>Purina Pro Plan, Blue Buffalo, Royal Canin, Hill's Science Diet</li><li>Fancy Feast, Sheba, Fresh Step, Dr. Elsey's</li><li>Orijen, Acana, Merrick, Wellness, Taste of the Wild</li></ul><p>Free shipping over $49. <a href="https://www.petshiwu.com/products">Shop now →</a></p>`,
  },
  // ── DEEP HOW-TO CONTENT ────────────────────────────────────────────────────
  {
    title: 'Best Dog Breeds for NYC Apartments — Small & Medium Breeds That Thrive',
    slug: 'best-dog-breeds-nyc-apartments',
    petType: 'dog', category: 'Dog Care',
    tags: ['best dog breeds NYC apartment', 'apartment dogs Queens', 'small dogs NYC', 'dog breeds for city living', 'apartment friendly dogs'],
    img: 'photo-1587300003388-59208cc962cb',
    meta: 'Best dog breeds for NYC apartments. Ranked by size, energy, and adaptability to city living in Queens, Brooklyn, and Manhattan.',
    excerpt: 'Not every dog thrives in an NYC apartment. Here are the breeds that do best in city living — ranked by energy level, size, and adaptability.',
    content: `<h2>Finding the Right Dog for NYC Apartment Life</h2><p>The best apartment dog isn't just the smallest one — it's the dog with the right temperament, energy level, and adaptability for urban living. Some large breeds are calmer in apartments than some small terriers. Here's what actually matters.</p><h2>What Makes a Good NYC Apartment Dog</h2><ul><li><strong>Low to moderate energy:</strong> A dog that can self-settle indoors and doesn't need hours of running daily</li><li><strong>Quiet nature:</strong> Barking dogs in apartments create conflict with neighbors</li><li><strong>Adaptable to small spaces:</strong> Comfortable in limited square footage</li><li><strong>Tolerant of alone time:</strong> NYC owners often work long commutes</li></ul><h2>Top Apartment Dog Breeds</h2><h3>French Bulldog</h3><p>The unofficial dog of NYC. Compact, quiet, low-energy indoors, and adaptable to any apartment size. Note: prone to breathing issues in heat — important for NYC summers.</p><h3>Cavalier King Charles Spaniel</h3><p>Gentle, quiet, and happy to cuddle on a couch all day. Moderate exercise needs met easily by daily walks.</p><h3>Shih Tzu</h3><p>Bred to live in palaces — perfectly content indoors. Low-shedding, affectionate, and quiet.</p><h3>Greyhound</h3><p>Surprising pick: retired racing greyhounds are actually couch potatoes. They sprint, then sleep. Very quiet, low-maintenance indoors.</p><h3>Basenji</h3><p>The "barkless dog" — they yodel rather than bark. Clean, low-shedding, and apartment-sized.</p><h3>Pug</h3><p>Compact, low-energy, funny. Happy with a 20-minute walk and a warm spot on the couch.</p><h2>What to Feed NYC Apartment Dogs</h2><p>City dogs with limited outdoor time need carefully portioned food to avoid weight gain. <a href="https://www.petshiwu.com/dog/dog-food">Shop dog food at PetShiwu</a> — delivered to Queens, Brooklyn, Manhattan, and all NYC boroughs. Free shipping over $49.</p>`,
  },
  {
    title: 'Best Dog Food for Dogs with Allergies — Delivered to NYC',
    slug: 'best-dog-food-allergies-nyc-delivery',
    petType: 'dog', category: 'Dog Care',
    tags: ['dog food allergies NYC', 'hypoallergenic dog food Queens', 'limited ingredient dog food NYC', 'dog allergy food delivery', 'sensitive skin dog food NYC'],
    img: 'photo-1548199973-03cce0bbc87b',
    meta: 'Best dog food for allergies delivered to NYC. Limited ingredient, hypoallergenic formulas from Hill\'s, Royal Canin, Natural Balance. Free shipping over $49.',
    excerpt: 'Does your dog have food allergies? Here are the best limited ingredient and hypoallergenic dog foods — all delivered to Queens, Brooklyn, and Manhattan.',
    content: `<h2>Dog Food Allergies: What You Need to Know</h2><p>True food allergies in dogs (immune-mediated reactions) are less common than food sensitivities (digestive intolerance), but both cause real problems: itchy skin, chronic ear infections, digestive upset, hot spots, and paw licking. The solution is usually an elimination diet using limited ingredient or hydrolyzed protein foods.</p><h2>Signs Your Dog May Have a Food Allergy</h2><ul><li>Chronic itching or skin irritation not explained by fleas or environmental allergens</li><li>Recurring ear infections</li><li>Chronic digestive issues: loose stool, vomiting, gas</li><li>Paw licking or face rubbing</li><li>Hot spots that keep returning</li></ul><h2>Best Limited Ingredient Dog Foods</h2><h3>Natural Balance L.I.D.</h3><p>Limited Ingredient Diets — single protein, single carbohydrate. Available in novel proteins like duck, salmon, bison, and venison to avoid common allergens (chicken, beef).</p><h3>Hill's Science Diet Sensitive Stomach & Skin</h3><p>Highly digestible with prebiotic fiber for gut health. Good for food sensitivities rather than true allergies.</p><h3>Royal Canin Hypoallergenic / Hydrolyzed Protein</h3><p>Hydrolyzed protein diets break protein into molecules too small to trigger an immune response — the gold standard for diagnosing true food allergies. Usually requires vet prescription.</p><h3>Purina Pro Plan Sensitive Skin & Stomach</h3><p>Salmon as the #1 ingredient with easily digestible carbohydrates. A popular starting point for dogs with suspected sensitivities.</h3><h3>Merrick Limited Ingredient</h3><p>Single novel protein (turkey, salmon, lamb) with simple carbohydrates. No grains, no gluten.</p><h2>The Elimination Diet Process</h2><p>To identify a food allergy, feed only the new limited ingredient food for 8–12 weeks — no treats, no table scraps, no flavored medications. If symptoms improve, you've found your answer. Reintroduce original food to confirm.</p><p><a href="https://www.petshiwu.com/dog/dog-food">Shop limited ingredient dog food at PetShiwu</a> — delivered to Queens, Brooklyn, and all of NYC. Free shipping over $49.</p>`,
  },
  {
    title: 'How to Potty Train a Puppy in an NYC Apartment',
    slug: 'potty-train-puppy-nyc-apartment',
    petType: 'dog', category: 'Dog Care',
    tags: ['potty train puppy NYC', 'apartment puppy training', 'puppy training Queens', 'indoor puppy training NYC', 'housetraining puppy apartment'],
    img: 'photo-1587300003388-59208cc962cb',
    meta: 'How to potty train a puppy in an NYC apartment. Step-by-step guide for city dogs — elevator buildings, no yards, busy schedules.',
    excerpt: 'Potty training in a NYC apartment is different — no yard, elevator rides, neighbors below. Here\'s the step-by-step guide that works for city puppies.',
    content: `<h2>Potty Training in an NYC Apartment: Why It's Harder</h2><p>Potty training a puppy in a house with a yard is straightforward. In a 6th-floor Queens apartment with a 90-second elevator ride between your door and the street — it's a different challenge entirely. But millions of NYC dogs have been successfully house-trained. Here's what works.</p><h2>The Core Rule: Prevent Accidents Before They Happen</h2><p>Puppies signal they need to go (circling, sniffing, squatting) about 30 seconds before they do it. In an apartment, you often can't get outside in time. The solution: a strict schedule that anticipates the need, rather than reacting to it.</p><h2>The NYC Puppy Schedule</h2><ul><li><strong>First thing in the morning:</strong> Immediately out — carry if needed</li><li><strong>After every meal:</strong> Out within 15 minutes of finishing food</li><li><strong>After every nap:</strong> Out immediately when they wake</li><li><strong>After play:</strong> Out within 10 minutes of active play</li><li><strong>Before bed:</strong> Last out of the night</li><li><strong>Every 1–2 hours</strong> for puppies under 12 weeks</li></ul><h2>The Elevator Problem</h2><p>Carry very young puppies to the elevator and street — they cannot hold it long enough for an elevator wait. As they age (12–16 weeks), they develop better bladder control. Keep a pee pad near the door as a safety net for emergencies until the puppy is reliable.</p><h2>Pee Pads: Helpful or Harmful?</h2><p>Pee pads teach puppies to go indoors — which is the opposite of what you want long-term. Use them sparingly, only as a backup for emergencies or very young puppies. Phase them out completely by 12–16 weeks. The goal is always: outside.</p><h2>Reward Every Successful Outside Trip</h2><p>Treat immediately — within 3 seconds of finishing outside. The dog needs to connect "going outside" with "treat." Use small, soft high-value treats for training. <a href="https://www.petshiwu.com/dog/dog-treats">Shop training treats at PetShiwu</a> — delivered to Queens, Brooklyn, and all of NYC.</p>`,
  },
  {
    title: 'Best Cat Food for Urinary Health — Delivered to NYC',
    slug: 'best-cat-food-urinary-health-nyc',
    petType: 'cat', category: 'Cat Care',
    tags: ['cat food urinary health NYC', 'cat UTI food Queens', 'urinary cat food delivery NYC', 'cat kidney health food', 'FLUTD cat food NYC'],
    img: 'photo-1514888286974-6c03e2ca1dba',
    meta: 'Best cat food for urinary health delivered to NYC. Hill\'s c/d, Royal Canin Urinary, Purina Pro Plan Urinary. Free shipping over $49 to Queens, Brooklyn, Manhattan.',
    excerpt: 'Urinary issues are among the most common health problems in cats. Here are the best foods for urinary health — all delivered to Queens, Brooklyn, and Manhattan.',
    content: `<h2>Urinary Health: One of the Most Common Cat Issues in NYC</h2><p>Feline lower urinary tract disease (FLUTD) — including urinary crystals, blockages, and cystitis — affects 1-3% of cats every year. Indoor cats (like most NYC cats) are at higher risk due to lower water intake and less activity. Diet is the most powerful tool for prevention and management.</p><h2>Why Diet Matters for Urinary Health</h2><ul><li><strong>Moisture:</strong> Wet food increases water intake dramatically, diluting urine and flushing the urinary tract</li><li><strong>Mineral balance:</strong> Excess magnesium, phosphorus, and calcium contribute to crystal formation</li><li><strong>pH control:</strong> Urinary diets maintain slightly acidic urine (pH 6.2–6.4) to prevent struvite crystals</li><li><strong>Controlled protein:</strong> Helps manage urine concentration</li></ul><h2>Best Urinary Health Cat Foods</h2><h3>Hill's Prescription Diet c/d Multicare</h3><p>The gold standard for cats with a history of urinary issues. Clinically proven to dissolve struvite crystals and reduce recurrence. Requires vet authorization.</p><h3>Royal Canin Urinary SO</h3><p>Creates a urinary environment unfavorable to both struvite and calcium oxalate crystals — the two most common types. Also requires vet prescription.</p><h3>Purina Pro Plan Urinary Tract Health</h3><p>Over-the-counter option with low magnesium and controlled minerals. Good for prevention in cats with no diagnosed crystals.</p><h3>Hill's Science Diet Urinary Hairball Control</h3><p>Addresses both urinary and hairball concerns — common combo for indoor cats.</p><h2>The Moisture Rule</h2><p>If your cat has urinary issues, switch to wet food or mix wet with dry. The increase in moisture alone can prevent recurrence in many cats.</p><p><a href="https://www.petshiwu.com/cat/cat-food">Shop urinary health cat food at PetShiwu</a> — delivered to Queens, Brooklyn, and all NYC. Free shipping over $49.</p>`,
  },
  {
    title: 'Pet Insurance NYC — Is It Worth It for Queens & Brooklyn Pet Owners?',
    slug: 'pet-insurance-nyc-queens-brooklyn',
    petType: 'all', category: 'Pet Care Tips',
    tags: ['pet insurance NYC', 'pet insurance Queens', 'is pet insurance worth it NYC', 'vet costs NYC', 'dog insurance Brooklyn'],
    img: 'photo-1450778869180-41d0601e046e',
    meta: 'Is pet insurance worth it in NYC? Vet costs in Queens, Brooklyn, and Manhattan are among the highest in the US. Here\'s what to know before you decide.',
    excerpt: 'NYC vet costs are among the highest in the country. Here\'s an honest look at pet insurance — what it covers, what it costs, and whether it\'s worth it for NYC pet owners.',
    content: `<h2>Vet Costs in NYC Are Real</h2><p>A routine vet visit in Queens or Brooklyn costs $75–$150. An emergency — a swallowed object, a UTI, a broken leg — can run $1,000–$8,000. For NYC pet owners, a single unexpected vet bill can be a serious financial hit. Pet insurance exists to protect against exactly that.</p><h2>How Pet Insurance Works</h2><p>Most pet insurance works on a reimbursement model: you pay the vet bill, submit the claim, and get reimbursed (minus deductible and copay). Typical structure:</p><ul><li><strong>Monthly premium:</strong> $20–$100+ depending on pet, breed, age, and coverage level</li><li><strong>Annual deductible:</strong> $100–$500 — you pay this before reimbursement kicks in</li><li><strong>Reimbursement rate:</strong> 70–90% of the covered bill</li><li><strong>Annual limit:</strong> $5,000–unlimited depending on plan</li></ul><h2>What It Covers (and Doesn't)</h2><p><strong>Typically covered:</strong> Accidents, illnesses, emergency care, surgery, hospitalization, diagnostic tests</p><p><strong>Not covered:</strong> Pre-existing conditions, routine wellness care (unless added), dental (unless added), grooming</p><h2>Top Pet Insurance Providers</h2><ul><li><strong>Trupanion:</strong> Pays vet directly — no out-of-pocket for most claims. Unlimited lifetime coverage.</li><li><strong>Embrace:</strong> Great for NYC breeds prone to health issues. Personalized plans.</li><li><strong>Nationwide:</strong> The only major provider offering exotic pet coverage — great for Queens bird and reptile owners.</li><li><strong>Lemonade:</strong> App-based, fast claims, competitive rates. Popular with younger NYC pet owners.</li><li><strong>Fetch:</strong> Strong for dogs with hereditary conditions common in popular NYC breeds.</li></ul><h2>Is It Worth It?</h2><p>Pet insurance is worth it if: you have a breed prone to health issues (French Bulldogs, Pugs, Golden Retrievers), your pet is young and healthy enough to be insured before problems develop, and you'd want to pursue treatment regardless of cost. If you'd make financial decisions based on cost, insurance removes that pressure.</p><p>While you're deciding on insurance, make sure you're feeding your pet well to keep vet visits minimal. <a href="https://www.petshiwu.com/products">Shop premium pet food at PetShiwu</a> — delivered to Queens, Brooklyn, Manhattan, and all of NYC.</p>`,
  },
  {
    title: 'How to Find a Good Vet in Queens, NYC — Tips for New Pet Owners',
    slug: 'how-to-find-vet-queens-nyc',
    petType: 'all', category: 'Pet Care Tips',
    tags: ['find vet Queens NYC', 'veterinarian Queens NY', 'best vet Queens', 'vet near me Queens', 'NYC vet tips'],
    img: 'photo-1601758125946-6ec2ef64daf8',
    meta: 'How to find a good vet in Queens, NYC. Tips for evaluating veterinarians, what to look for, and how to prepare for your pet\'s first visit.',
    excerpt: 'Finding the right vet in Queens or NYC takes more than a Google search. Here\'s how to evaluate vets, what to ask, and red flags to watch for.',
    content: `<h2>Finding a Vet in Queens — Where to Start</h2><p>Queens has dozens of veterinary clinics, from solo practices in Jackson Heights to multi-vet hospitals in Forest Hills and Flushing. The right vet isn't just the closest one — it's the one your pet is comfortable with and that communicates clearly with you.</p><h2>Where to Look</h2><ul><li><strong>American Animal Hospital Association (AAHA.org):</strong> Find AAHA-accredited practices — accreditation requires meeting over 900 standards of care</li><li><strong>Google Maps:</strong> Search "veterinarian Queens NY" and filter by rating and reviews</li><li><strong>Yelp:</strong> Good for real client experiences in NYC neighborhoods</li><li><strong>Referrals:</strong> Ask other dog and cat owners in your neighborhood — the most reliable source</li></ul><h2>What to Look For</h2><ul><li><strong>Clear communication:</strong> Your vet should explain diagnoses and treatment options in plain language without rushing you</li><li><strong>Transparent pricing:</strong> Good practices give you an estimate before treatments. No surprises on the bill.</li><li><strong>Emergency access:</strong> Does the practice offer emergency hours or refer to a 24/7 emergency clinic?</li><li><strong>Species experience:</strong> If you have a bird, reptile, or exotic pet, make sure the vet has exotic species training</li></ul><h2>The New Patient Appointment</h2><p>Book a wellness exam before your pet has a health issue. This lets you evaluate the practice without the stress of an emergency. Bring: vaccination records, any health history, a list of current food and supplements, and your questions.</p><h2>Red Flags to Avoid</h2><ul><li>Pushing expensive treatments without explaining why</li><li>Not giving itemized estimates before procedures</li><li>Dismissing your concerns</li><li>No weekend or after-hours access or referral</li></ul><p>Once you've found your vet, stock up on the right food for your pet's health needs. <a href="https://www.petshiwu.com/products">Shop at PetShiwu</a> — delivered to Queens and all NYC boroughs. Free shipping over $49.</p>`,
  },
];

async function main() {
  const token = await login();
  console.log(`Publishing ${posts.length} expanded content posts...\n`);
  let ok = 0, fail = 0;
  for (const p of posts) {
    const post = {
      title: p.title, slug: p.slug, petType: p.petType, category: p.category,
      tags: p.tags, excerpt: p.excerpt, content: p.content,
      featuredImage: `https://images.unsplash.com/${p.img}?w=1200&q=80`,
      metaTitle: p.title, metaDescription: p.meta,
    };
    const success = await pub(token, post);
    success ? ok++ : fail++;
    await new Promise(r => setTimeout(r, 360));
  }
  console.log(`\n✅ Done! Published: ${ok} | Failed: ${fail}`);
}
main();
