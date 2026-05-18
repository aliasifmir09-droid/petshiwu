/**
 * publishHowToContent.mjs
 * Long-tail how-to and guide posts targeting buyer-intent searches.
 * These capture people researching before they buy — high-conversion traffic.
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

const posts = [
  {
    title: 'How Much Should I Feed My Dog? Complete Guide by Size & Age',
    slug: 'how-much-should-i-feed-my-dog-guide',
    petType: 'dog', category: 'Dog Care',
    tags: ['how much to feed dog', 'dog feeding guide', 'dog food portions', 'puppy feeding chart', 'dog diet NYC'],
    img: 'photo-1587300003388-59208cc962cb',
    metaTitle: 'How Much Should I Feed My Dog? Guide by Size & Age | PetShiwu',
    metaDesc: 'Dog feeding guide: how much to feed your dog by weight, age, and activity level. Includes feeding charts for puppies, adults, and senior dogs.',
    excerpt: 'Not sure how much to feed your dog? This complete guide covers portions by weight, age, and activity level — with feeding charts for every life stage.',
    content: `<h2>The Most Common Dog Feeding Mistake</h2>
<p>Most dog owners either overfeed or underfeed — and the consequences are serious in both directions. Overweight dogs face joint problems, diabetes, and shortened lifespan. Underweight dogs lack energy and immune function. Getting portions right is one of the most impactful things you can do for your dog's health.</p>

<h2>Start with the Bag — Then Adjust</h2>
<p>Every bag of dog food has a feeding guide based on your dog's weight. This is your starting point, not your final answer. Those guidelines are often slightly generous (because more food sold = more revenue for the manufacturer). Most vets recommend starting at the lower end of the suggested range and adjusting based on your dog's body condition.</p>

<h2>Feeding by Weight — General Guidelines</h2>
<table>
<thead><tr><th>Dog Weight</th><th>Daily Food (cups of dry kibble)</th></tr></thead>
<tbody>
<tr><td>Under 10 lbs (toy breeds)</td><td>¼ – ¾ cup</td></tr>
<tr><td>10–25 lbs (small breeds)</td><td>¾ – 1½ cups</td></tr>
<tr><td>25–50 lbs (medium breeds)</td><td>1½ – 2½ cups</td></tr>
<tr><td>50–75 lbs (large breeds)</td><td>2½ – 3½ cups</td></tr>
<tr><td>75–100 lbs (large/giant)</td><td>3½ – 4½ cups</td></tr>
<tr><td>Over 100 lbs (giant breeds)</td><td>4½ cups + ¼ cup per 10 lbs over 100</td></tr>
</tbody>
</table>
<p><em>Note: these are general guidelines. Always check your specific food's packaging and consult your vet.</em></p>

<h2>Adjusting for Life Stage</h2>
<ul>
  <li><strong>Puppies (under 1 year):</strong> Feed 2–3x more than adult guidelines, split into 3–4 meals per day. Puppies have high energy needs for growth.</li>
  <li><strong>Active adults:</strong> Standard guidelines apply. Highly active dogs (running, working dogs) may need 20–30% more.</li>
  <li><strong>Sedentary adults:</strong> Reduce by 10–20% to prevent weight gain — common with NYC apartment dogs who get limited exercise.</li>
  <li><strong>Senior dogs (7+):</strong> Metabolism slows; reduce by 10–20% unless vet recommends otherwise.</li>
  <li><strong>Pregnant/nursing:</strong> Needs increase significantly — consult your vet for specific guidance.</li>
</ul>

<h2>The Body Condition Score Test</h2>
<p>Don't just go by the scale. Run your hands along your dog's ribcage. You should be able to feel ribs easily but not see them. If you can't feel ribs at all, your dog may be overweight. If ribs are visibly prominent, they may be underweight.</p>

<h2>Wet Food vs. Dry — Does It Change Portions?</h2>
<p>Yes. Wet food is about 75–80% water, so you need significantly more volume to match the caloric equivalent of dry kibble. If you're mixing wet and dry, reduce dry portions proportionally. Most food packaging will have a mixing guide.</p>

<h2>Shop Dog Food at PetShiwu</h2>
<p>We carry portion-controlled feeding tools, automatic feeders, and 1,000+ dog food options delivered to your NYC door. <a href="https://www.petshiwu.com/dog/dog-food">Shop dog food →</a></p>`,
  },
  {
    title: 'Best Dog Food for Small Breeds — Top Picks Delivered NYC',
    slug: 'best-dog-food-small-breeds-nyc',
    petType: 'dog', category: 'Dog Care',
    tags: ['small breed dog food', 'toy breed dog food NYC', 'small dog food Queens', 'chihuahua food NYC', 'yorkie food delivery'],
    img: 'photo-1601979031925-424e53b6caaa',
    metaTitle: 'Best Dog Food for Small Breeds — Delivered to NYC | PetShiwu',
    metaDesc: 'The best small breed dog food brands delivered to Queens, Brooklyn, and Manhattan. Purina Pro Plan Small, Royal Canin Small, Blue Buffalo Small Breed, and more.',
    excerpt: 'Small breed dogs have unique nutritional needs. Here are the best dog foods for small and toy breeds — all delivered to NYC.',
    content: `<h2>Why Small Breed Dogs Need Different Food</h2>
<p>Small and toy breeds (under 20 lbs) have faster metabolisms than large breeds — they burn more calories per pound of body weight and need calorie-dense, easily digestible food. They also have tiny mouths and smaller teeth, so kibble size matters. Small breed formulas address all of this.</p>

<h2>Key Nutritional Needs for Small Breeds</h2>
<ul>
  <li><strong>Calorie density:</strong> More calories per cup to meet high metabolic demands without requiring huge meals</li>
  <li><strong>Small kibble size:</strong> Easier to chew and reduces dental issues common in small breeds</li>
  <li><strong>High protein:</strong> To maintain muscle mass despite small body size</li>
  <li><strong>Dental support:</strong> Small breeds are particularly prone to dental disease; look for dental-supportive ingredients</li>
  <li><strong>Omega fatty acids:</strong> For skin and coat health — many small breeds have sensitive skin</li>
</ul>

<h2>Best Small Breed Dog Foods at PetShiwu</h2>

<h3>1. Purina Pro Plan Small & Toy Breed</h3>
<p>High-protein formula with real chicken, specifically sized kibble for small mouths, and live probiotics for digestive health. One of the most-recommended foods by vets for small breeds.</p>

<h3>2. Royal Canin Size Health Nutrition Small Adult</h3>
<p>Tailored nutrition for dogs 9–22 lbs. Precise caloric content to maintain healthy weight, and an exclusive kibble shape designed for small breed jaw structure.</p>

<h3>3. Blue Buffalo Life Protection Small Breed</h3>
<p>Real chicken first, with LifeSource Bits for immune support. No chicken by-products, corn, wheat, or soy. Small kibble size and higher calorie density.</p>

<h3>4. Hill's Science Diet Small & Toy Breed</h3>
<p>Clinically proven nutrition for small and toy breeds. High-quality protein for lean muscle, plus omega-6 fatty acids for healthy skin and coat.</p>

<h3>5. Merrick Lil' Plates</h3>
<p>Grain-free small breed formula with deboned meat as the first ingredient. Available in wet and dry, great for picky small breed eaters.</p>

<h2>Popular Small Breeds in NYC</h2>
<p>NYC's most popular small breeds — French Bulldogs, Chihuahuas, Shih Tzus, Yorkshire Terriers, Pomeranians, and Maltese — all thrive on small breed formulas. Browse <a href="https://www.petshiwu.com/dog/dog-food">all small breed dog food</a> at PetShiwu, delivered to Queens, Brooklyn, and Manhattan.</p>`,
  },
  {
    title: 'How to Switch Dog Food Without Upsetting Your Dog\'s Stomach',
    slug: 'how-to-switch-dog-food-without-upset-stomach',
    petType: 'dog', category: 'Dog Care',
    tags: ['switching dog food', 'transition dog food', 'dog food change stomach', 'dog food transition guide', 'new dog food NYC'],
    img: 'photo-1548199973-03cce0bbc87b',
    metaTitle: 'How to Switch Dog Food Without Upset Stomach | PetShiwu',
    metaDesc: 'Step-by-step guide to switching your dog\'s food safely. Avoid digestive upset with a proper 7-10 day transition. Works for all breeds and life stages.',
    excerpt: 'Switching dog food too fast causes diarrhea, vomiting, and refusal to eat. Here\'s the right way to transition your dog to a new food over 7–10 days.',
    content: `<h2>Why You Can't Just Swap Dog Foods Overnight</h2>
<p>Your dog's gut microbiome — the bacteria that help digest food — is adapted to their current diet. Switch foods abruptly and those bacteria get overwhelmed by unfamiliar ingredients, causing diarrhea, vomiting, gas, or refusal to eat. A gradual transition lets the gut adapt without disruption.</p>

<h2>The 7–10 Day Transition Schedule</h2>
<table>
<thead><tr><th>Days</th><th>Old Food</th><th>New Food</th></tr></thead>
<tbody>
<tr><td>Days 1–2</td><td>75%</td><td>25%</td></tr>
<tr><td>Days 3–4</td><td>50%</td><td>50%</td></tr>
<tr><td>Days 5–6</td><td>25%</td><td>75%</td></tr>
<tr><td>Days 7–10</td><td>0%</td><td>100%</td></tr>
</tbody>
</table>
<p>For dogs with known sensitive stomachs, stretch this to 14 days by moving more slowly through each phase.</p>

<h2>Signs the Transition Is Going Too Fast</h2>
<ul>
  <li>Loose stool or diarrhea</li>
  <li>Vomiting</li>
  <li>Excessive gas</li>
  <li>Refusal to eat</li>
  <li>Lethargy or loss of appetite</li>
</ul>
<p>If any of these appear, slow down. Go back to the previous ratio and hold there for an extra 2–3 days before advancing again.</p>

<h2>Tips for Picky Eaters During Transition</h2>
<ul>
  <li><strong>Add warm water or low-sodium broth</strong> to the new food to enhance aroma and palatability</li>
  <li><strong>Mix thoroughly</strong> so the dog can't easily pick out the old food</li>
  <li><strong>Add a small amount of wet food</strong> of the new brand to make it more appealing</li>
  <li><strong>Stay consistent</strong> — don't offer alternatives if they refuse. A healthy dog won't starve themselves</li>
</ul>

<h2>When You Have to Switch Fast</h2>
<p>Sometimes you run out of old food or a recall forces an emergency switch. In this case, add a probiotic supplement (like Purina FortiFlora or Zesty Paws Probiotic Bites) to support gut health through the rapid change. These are available at <a href="https://www.petshiwu.com/dog">PetShiwu</a> with NYC delivery.</p>`,
  },
  {
    title: 'Indoor Cat Care Guide — Keeping NYC Apartment Cats Healthy & Happy',
    slug: 'indoor-cat-care-nyc-apartment-guide',
    petType: 'cat', category: 'Cat Care',
    tags: ['indoor cat care NYC', 'apartment cat tips', 'NYC cat owner guide', 'cat care Queens', 'keeping cats happy NYC'],
    img: 'photo-1574158622682-e40e69881006',
    metaTitle: 'Indoor Cat Care for NYC Apartments — Complete Guide | PetShiwu',
    metaDesc: 'How to keep your indoor cat healthy and happy in an NYC apartment. Nutrition, enrichment, litter, and health tips for city cat owners in Queens, Brooklyn & Manhattan.',
    excerpt: 'NYC apartment cats live longer but need more enrichment. Here\'s how to keep your indoor cat healthy, stimulated, and happy in a city apartment.',
    content: `<h2>The NYC Apartment Cat Challenge</h2>
<p>Indoor cats in New York City live on average 12–18 years — far longer than outdoor cats. But that longer life comes with a trade-off: without the stimulation of the outdoors, apartment cats can develop obesity, boredom, anxiety, and behavioral problems. The goal is to bring the richness of the outside world in.</p>

<h2>Nutrition for Indoor Cats</h2>
<p>Indoor cats burn fewer calories than outdoor cats and are prone to weight gain. Key nutritional considerations:</p>
<ul>
  <li><strong>Indoor-specific formulas:</strong> Lower calorie density than standard adult cat food. Look for "indoor" on the label — Purina ONE Indoor, Hill's Science Diet Indoor, Royal Canin Indoor.</li>
  <li><strong>Hairball control:</strong> Indoor cats groom more and ingest more hair. Look for added fiber to support hairball elimination.</li>
  <li><strong>High moisture:</strong> Mix in wet food to increase hydration. Indoor cats are at higher risk for urinary tract issues when chronically underhydrated.</li>
  <li><strong>Portion control:</strong> Free-feeding leads to obesity in indoor cats. Measure meals and follow feeding guidelines.</li>
</ul>

<h2>Enrichment — Non-Negotiable in a Small Space</h2>
<ul>
  <li><strong>Vertical space:</strong> Cat trees, wall shelves, and cleared bookshelf levels give your cat more "territory" without taking floor space. Cats feel safer and less stressed with height access.</li>
  <li><strong>Window perch:</strong> A window with a view is free entertainment. Add a bird feeder outside for maximum engagement.</li>
  <li><strong>Interactive play:</strong> Two 10–15 minute sessions daily with a wand toy is the single most impactful thing for indoor cat wellbeing.</li>
  <li><strong>Puzzle feeders:</strong> Make your cat work for their food. This satisfies the hunting instinct that a food bowl never does.</li>
  <li><strong>Rotate toys:</strong> A toy ignored for two weeks becomes exciting again when reintroduced.</li>
</ul>

<h2>Litter Box Rules for Apartments</h2>
<ul>
  <li><strong>One box per cat, plus one extra</strong> — even in a small apartment, two boxes for one cat is better than one</li>
  <li><strong>Scoop daily</strong> — cats avoid dirty boxes and will find alternatives if not kept clean</li>
  <li><strong>Low-dust, low-odor litter</strong> — especially important in small apartments. Dr. Elsey's and World's Best Cat Litter are top picks for small spaces</li>
  <li><strong>Location:</strong> Quiet, private, away from food and water</li>
</ul>

<h2>Vet Check-Ups</h2>
<p>Indoor cats still need annual vet visits. Common indoor cat health issues: dental disease, obesity, urinary tract problems, and hyperthyroidism (in seniors). Don't skip the annual — indoor doesn't mean immune.</p>

<p>Shop all indoor cat supplies at <a href="https://www.petshiwu.com/cat">PetShiwu</a> — delivered to your NYC apartment. <a href="https://www.petshiwu.com/cat/cat-food">Cat food</a> | <a href="https://www.petshiwu.com/cat/cat-litter">Cat litter</a> | <a href="https://www.petshiwu.com/cat/cat-toys">Cat toys</a></p>`,
  },
  {
    title: 'How to Choose the Right Dog Leash for NYC Streets',
    slug: 'how-to-choose-dog-leash-nyc',
    petType: 'dog', category: 'Dog Care',
    tags: ['dog leash NYC', 'best dog leash city', 'dog leash Queens', 'retractable leash NYC', 'dog walking NYC gear'],
    img: 'photo-1587300003388-59208cc962cb',
    metaTitle: 'Best Dog Leash for NYC Streets | PetShiwu',
    metaDesc: 'How to choose the right dog leash for walking in NYC. Standard, retractable, and hands-free options for city dogs in Queens, Brooklyn, and Manhattan.',
    excerpt: 'Not all leashes work for NYC. Busy sidewalks, traffic, and dog runs each have different requirements. Here\'s how to pick the right leash for city walking.',
    content: `<h2>NYC Dog Walking Is Different</h2>
<p>Walking a dog in New York City is not like walking a dog in the suburbs. You have crowded sidewalks, delivery bikes, unpredictable traffic, other dogs around every corner, and the occasional rat that will test every dog's prey drive. Your leash choice matters more here than almost anywhere else.</p>

<h2>Standard Fixed-Length Leash (Best for Most NYC Dogs)</h2>
<p>A 4–6 foot fixed leash is the NYC standard for good reason. It keeps your dog close enough for safety on busy sidewalks while giving enough slack for comfortable walking. Look for:</p>
<ul>
  <li><strong>4 feet:</strong> High-traffic areas, busy sidewalks, tight spaces</li>
  <li><strong>6 feet:</strong> General city walking, parks, quieter streets</li>
  <li><strong>Material:</strong> Nylon (affordable, durable), leather (premium, gets more comfortable over time), biothane (waterproof, easy to clean — great for NYC weather)</li>
</ul>

<h2>Retractable Leashes — Use With Caution in NYC</h2>
<p>Retractable leashes are controversial among NYC dog owners and trainers — and for good reason. They can extend up to 26 feet, making it impossible to maintain control around traffic, cyclists, or other dogs. Many NYC parks and buildings have banned them. If you use one, lock it to a short length in busy areas and only extend in open, low-traffic spaces.</p>

<h2>Hands-Free Leashes</h2>
<p>Great for joggers in Prospect Park, Central Park, or along the East River. These wrap around your waist or clip to a belt. Only appropriate with well-trained dogs — not recommended for pullers or reactive dogs.</p>

<h2>For Pullers: Pair with the Right Harness</h2>
<p>No leash will stop a strong puller — that's a harness problem. Front-clip harnesses (PetSafe Easy Walk, Ruffwear Front Range) redirect pulling dogs without choking. Combine with a standard 4-foot leash for best control on NYC streets.</p>

<p>Shop all leashes, harnesses, and dog walking gear at <a href="https://www.petshiwu.com/dog/dog-collars-leashes">PetShiwu</a> — delivered to Queens, Brooklyn, Manhattan, and all NYC boroughs.</p>`,
  },
  {
    title: 'Best Automatic Cat Feeders for NYC Pet Owners Who Work Long Hours',
    slug: 'best-automatic-cat-feeders-nyc',
    petType: 'cat', category: 'Cat Care',
    tags: ['automatic cat feeder NYC', 'cat feeder Queens', 'pet feeder delivery NYC', 'cat food dispenser NYC', 'pet care busy NYC'],
    img: 'photo-1514888286974-6c03e2ca1dba',
    metaTitle: 'Best Automatic Cat Feeders for NYC — Delivered | PetShiwu',
    metaDesc: 'Best automatic cat feeders for NYC apartment owners who work long hours. Compare top models and shop with free shipping to Queens, Brooklyn, and Manhattan.',
    excerpt: 'Working long NYC hours? An automatic cat feeder keeps your cat fed on schedule. Here are the best options for apartment cats — delivered to NYC.',
    content: `<h2>Feeding Your Cat When NYC Life Gets Busy</h2>
<p>New York City work schedules are brutal. Long commutes, late nights, unexpected overtime — your cat's dinner schedule shouldn't suffer for it. Automatic cat feeders dispense precise portions at programmed times, so your cat eats right whether you're home or not.</p>

<h2>What to Look for in an Automatic Cat Feeder</h2>
<ul>
  <li><strong>Portion accuracy:</strong> Essential for weight management. Look for feeders with precise portion sizing (measured in grams or fractions of a cup)</li>
  <li><strong>Meal scheduling:</strong> Most allow 1–6 meals per day. Some allow up to 12</li>
  <li><strong>Battery backup:</strong> Critical for NYC where power outages happen. A feeder with battery backup won't miss meals during a blackout</li>
  <li><strong>Capacity:</strong> 1–6 pound capacity works for most single-cat households. For multi-cat homes, go larger</li>
  <li><strong>Ease of cleaning:</strong> Food residue builds up quickly. Dishwasher-safe components are a major plus in a busy NYC apartment</li>
  <li><strong>App connectivity:</strong> Premium feeders let you adjust meals remotely from your phone</li>
</ul>

<h2>Top Automatic Cat Feeder Picks</h2>

<h3>PetSafe 5-Meal Automatic Pet Feeder</h3>
<p>Reliable, affordable, and simple. Programs up to 5 meals per day with a rotating tray. Best for wet food feeding — the sealed tray design keeps food fresh.</p>

<h3>PETLIBRO Automatic Cat Feeder</h3>
<p>One of the most popular on the market. Up to 6 meals per day, infrared sensor to detect food jams, battery + power adapter backup. Large 4L capacity. Very reliable.</p>

<h3>SureFeed Microchip Pet Feeder</h3>
<p>The gold standard for multi-pet households. Opens only for your specific cat using their microchip or RFID collar tag. Perfect if you have multiple cats with different dietary needs — a common NYC apartment scenario.</p>

<h2>Tips for NYC Apartment Use</h2>
<ul>
  <li>Place away from high-traffic areas to reduce stress while eating</li>
  <li>Clean the feeder weekly — NYC humidity can accelerate mold in food residue</li>
  <li>Use dry food for most automatic feeders; wet food requires special sealed-tray models</li>
</ul>

<p>Shop automatic feeders and all cat supplies at <a href="https://www.petshiwu.com/cat">PetShiwu</a> — delivered to your NYC apartment. Free shipping on orders over $49.</p>`,
  },
  {
    title: 'Dog-Friendly Parks in Queens, NYC — Where to Walk Your Dog',
    slug: 'dog-friendly-parks-queens-nyc',
    petType: 'dog', category: 'Dog Care',
    tags: ['dog parks Queens NYC', 'dog friendly parks Queens', 'where to walk dog Queens', 'dog run Queens', 'Queens dog park'],
    img: 'photo-1548199973-03cce0bbc87b',
    metaTitle: 'Dog-Friendly Parks & Dog Runs in Queens, NYC | PetShiwu',
    metaDesc: 'The best dog parks and dog-friendly parks in Queens, NYC. Find dog runs in Jackson Heights, Flushing Meadows, Astoria Park, and more — with a local pet delivery store nearby.',
    excerpt: 'Queens has some of NYC\'s best dog parks and dog runs. Here\'s a guide to the best spots for walking and socializing your dog in Queens.',
    content: `<h2>Queens Is One of NYC's Best Boroughs for Dogs</h2>
<p>Queens may not get the same press as Central Park or Prospect Park, but dog owners in the borough know the truth: Queens has some of New York City's best green spaces, dog runs, and parks for exercising and socializing dogs. Here's a guide to the best spots.</p>

<h2>Flushing Meadows-Corona Park</h2>
<p>The largest park in Queens (at 1,255 acres) is a world unto itself. Dogs on leash are welcome throughout most of the park. The open fields around the Unisphere and along the lake are favorites for morning walks. The park also has several informal off-leash areas used by local dog owners early in the morning.</p>

<h2>Astoria Park</h2>
<p>With sweeping views of the Hell Gate Bridge and the East River, Astoria Park is one of the most scenic dog walks in all of NYC. A designated off-leash area at the southern end of the park lets dogs run free. The waterfront path is excellent for longer walks.</p>

<h2>Alley Pond Park</h2>
<p>The second-largest park in Queens, located in northeastern Queens. Miles of walking trails through forest, wetlands, and meadows. Dogs on leash are welcome, and the wooded trails provide a genuinely nature-like experience unusual for NYC.</p>

<h2>Jackson Heights & Diversity Plaza</h2>
<p>The streets and small parks of Jackson Heights are walkable and relatively quiet for morning and evening walks. Diversity Plaza hosts community events throughout the year and is a social hub for the neighborhood's dog owners.</p>

<h2>Cunningham Park (Fresh Meadows)</h2>
<p>A large, mostly flat park with walking paths, ballfields, and a designated dog run. The dog run is active and well-maintained, with regular community events organized by local dog owners.</p>

<h2>Before You Head Out</h2>
<p>Stock up on what your dog needs for park visits — treats, portable water bowls, poop bags, and a good leash. PetShiwu delivers everything you need to any Queens address. Free shipping on orders over $49. <a href="https://www.petshiwu.com/dog">Shop dog supplies →</a></p>`,
  },
  {
    title: 'What to Do When Your Cat Won\'t Eat — NYC Vet-Approved Tips',
    slug: 'cat-wont-eat-vet-tips-nyc',
    petType: 'cat', category: 'Cat Care',
    tags: ['cat won\'t eat', 'cat refusing food', 'cat not eating tips', 'cat appetite NYC', 'cat food refusal'],
    img: 'photo-1574158622682-e40e69881006',
    metaTitle: 'Cat Won\'t Eat? Vet-Approved Tips to Encourage Eating | PetShiwu',
    metaDesc: 'Your cat is refusing to eat — here\'s what to do. Vet-approved tips for encouraging a cat to eat, when to worry, and the best foods for picky cats.',
    excerpt: 'A cat that won\'t eat is stressful — and sometimes serious. Here\'s a vet-approved guide to why cats stop eating and how to get them eating again safely.',
    content: `<h2>When a Cat Refuses Food — What It Means</h2>
<p>Cats are notorious for food refusal, but context matters enormously. A cat that skips one meal because it's a new brand is very different from a cat that hasn't eaten in 48 hours. Knowing the difference could be life-saving: cats who don't eat for more than 24–48 hours risk a dangerous liver condition called hepatic lipidosis (fatty liver disease).</p>

<h2>Common Reasons Cats Stop Eating</h2>
<ul>
  <li><strong>New food:</strong> Cats are neophobic — wary of new things. A sudden food switch often causes refusal.</li>
  <li><strong>Stress:</strong> A new pet, move, loud noises (very common in NYC), or schedule change can suppress appetite.</li>
  <li><strong>Illness:</strong> Upper respiratory infections, dental pain, kidney disease, and dozens of other conditions reduce appetite. If refusal persists beyond 24 hours, call your vet.</li>
  <li><strong>Temperature:</strong> Cats often prefer food at room temperature or slightly warm — cold wet food from the fridge is frequently refused.</li>
  <li><strong>Bowl issues:</strong> Plastic bowls can develop odors; narrow bowls cause whisker fatigue. Stainless steel or ceramic wide bowls are better.</li>
  <li><strong>Location:</strong> Cats won't eat near litter boxes. In a small NYC apartment, placement matters.</li>
</ul>

<h2>How to Encourage Eating</h2>
<ul>
  <li><strong>Warm it up:</strong> Microwave wet food for 5–10 seconds. The warmth releases aroma and makes food more appealing.</li>
  <li><strong>Add a topper:</strong> A small amount of tuna in water, chicken broth (no onion/garlic), or a commercial food topper often triggers eating.</li>
  <li><strong>Try a different texture:</strong> Pâté cats may accept chunks; chunk cats may accept pâté. Experiment within the same brand.</li>
  <li><strong>Churu or lickable treats:</strong> Inaba Churu tubes are highly palatable for almost all cats and can bridge the gap while sorting out the main food issue.</li>
  <li><strong>Reduce stress:</strong> If stress is the cause, give the cat a quiet room, Feliway diffuser, and predictable routine.</li>
</ul>

<h2>When to Call the Vet</h2>
<p>Call your vet if: your cat hasn't eaten in 24+ hours, is also vomiting or lethargic, has lost visible weight, or has other symptoms. Don't wait 48 hours with a cat — unlike dogs, cats can't safely fast for long.</p>

<p>Shop cat food, toppers, and treats for picky cats at <a href="https://www.petshiwu.com/cat/cat-food">PetShiwu</a> — delivered to Queens, Brooklyn, and all NYC boroughs. Free shipping over $49.</p>`,
  },
];

async function main() {
  console.log('Logging in...');
  const token = await login();
  if (!token) { console.error('Login failed'); process.exit(1); }

  console.log(`\nPublishing ${posts.length} how-to posts...\n`);
  let ok = 0, fail = 0;
  for (const p of posts) {
    const post = {
      title: p.title, slug: p.slug, petType: p.petType, category: p.category,
      tags: p.tags, excerpt: p.excerpt, content: p.content,
      featuredImage: `https://images.unsplash.com/${p.img}?w=1200&q=80`,
      metaTitle: p.metaTitle, metaDescription: p.metaDesc,
    };
    const success = await publishPost(token, post);
    success ? ok++ : fail++;
    await new Promise(r => setTimeout(r, 380));
  }
  console.log(`\n✅ Done! Published: ${ok} | Failed: ${fail}`);
}

main();
