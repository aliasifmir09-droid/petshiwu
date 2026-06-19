/**
 * seedNYCBlogs.mjs
 * Seeds 4 NYC-targeted blog posts to petshop.blogs collection
 * 
 * Usage: MONGO_URI="mongodb+srv://..." bun run scripts/seedNYCBlogs.mjs
 */

import mongoose from 'mongoose';

const MONGO_URI = process.env.MONGO_URI;
if (!MONGO_URI) {
  console.error('❌ MONGO_URI environment variable required');
  process.exit(1);
}

const ADMIN_AUTHOR_ID = '69389a8553df9b1f9b03a2ba';

const blogSchema = new mongoose.Schema({
  title: String,
  slug: String,
  content: String,
  excerpt: String,
  coverImage: String,
  petType: String,
  category: String,
  tags: [String],
  author: mongoose.Schema.Types.ObjectId,
  isPublished: Boolean,
  publishedAt: Date,
  readTime: Number,
}, { timestamps: true });

const Blog = mongoose.models.Blog || mongoose.model('Blog', blogSchema);

const POSTS = [
  {
    title: "The Ultimate Guide to NYC Dog Parks: Where to Take Your Dog in Every Borough",
    slug: "nyc-dog-parks-ultimate-guide",
    excerpt: "New York City has over 100 official off-leash areas and dog runs. Here's the complete borough-by-borough guide to the best spots for your dog — from Central Park to Prospect Park to Flushing Meadows.",
    petType: "dog",
    category: "lifestyle",
    tags: ["nyc", "dog parks", "queens", "brooklyn", "manhattan", "bronx", "staten island", "off-leash"],
    readTime: 8,
    coverImage: "https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=1200&q=85",
    content: `<h1>The Ultimate Guide to NYC Dog Parks: Where to Take Your Dog in Every Borough</h1>

<p>New York City is one of the most dog-friendly cities in America — with over 8 million residents and an estimated 600,000 dogs, the city has invested heavily in off-leash areas and dedicated dog runs across all five boroughs. Whether you're in Jackson Heights, Park Slope, or the Upper West Side, there's a great dog park within walking distance.</p>

<p>Here's everything you need to know about NYC's best dog parks, organized by borough.</p>

<h2>Queens Dog Parks</h2>

<h3>Flushing Meadows-Corona Park Dog Run</h3>
<p>One of the largest in Queens, the Flushing Meadows dog run is a beloved spot for Queens dog owners. Located near the USTA Billie Jean King National Tennis Center, it features separate small-dog and large-dog areas, water stations, and shade trees. Open year-round, sunrise to sunset.</p>
<p><strong>Address:</strong> Meadow Lake, Flushing Meadows-Corona Park, Queens<br>
<strong>Best for:</strong> All sizes · Large open space · Weekend socialization</p>

<h3>Hoffman Park Dog Run (Jackson Heights)</h3>
<p>Right in the heart of Jackson Heights — Petshiwu's home neighborhood — Hoffman Park has a dedicated fenced dog run that's well-maintained and popular with the local community. Great for weekday morning visits before work.</p>
<p><strong>Address:</strong> 78th St & 34th Ave, Jackson Heights, Queens<br>
<strong>Best for:</strong> Local dog owners · Morning walks · Small to medium dogs</p>

<h3>Astoria Park Dog Run</h3>
<p>One of the most scenic dog parks in NYC, Astoria Park's dog run sits along the East River with views of the RFK Bridge. The park itself is massive with waterfront paths for post-run walks.</p>
<p><strong>Address:</strong> Shore Blvd & 19th St, Astoria, Queens<br>
<strong>Best for:</strong> Scenic views · Active dogs · Evening walks</p>

<h2>Brooklyn Dog Parks</h2>

<h3>Prospect Park Off-Leash Area</h3>
<p>The crown jewel of Brooklyn dog parks. Prospect Park allows dogs off-leash throughout the entire park before 9am and after 9pm. The Long Meadow alone is one of the largest open green spaces in any NYC park. Multiple dedicated dog runs dot the perimeter.</p>
<p><strong>Address:</strong> Prospect Park, Brooklyn (multiple entrances)<br>
<strong>Best for:</strong> All sizes · Early morning runs · Socializing</p>

<h3>Hillside Dog Park (Park Slope)</h3>
<p>A popular fenced off-leash area right at the edge of Prospect Park. Well-maintained with separate sections for small and large dogs. Extremely popular with the Park Slope dog community on weekends.</p>
<p><strong>Address:</strong> 16th Street Entrance, Prospect Park, Brooklyn<br>
<strong>Best for:</strong> Park Slope residents · Weekend community vibes</p>

<h3>Palmetto Playground Dog Run (Williamsburg)</h3>
<p>Convenient for Williamsburg residents, this dog run is fenced and has water access. Smaller than Prospect Park options but a solid daily-use spot for local dog owners.</p>
<p><strong>Address:</strong> 83 Palmetto St, Brooklyn<br>
<strong>Best for:</strong> Williamsburg locals · Quick daily visits</p>

<h2>Manhattan Dog Parks</h2>

<h3>Central Park Off-Leash Areas</h3>
<p>Central Park has 23 designated off-leash areas. Dogs are allowed off-leash before 9am and after 9pm throughout the park. The Great Lawn, North Meadow, and Riverside Park extension are favorites. Always bring a leash — enforcement is strict during peak hours.</p>
<p><strong>Address:</strong> Central Park, Manhattan (multiple zones)<br>
<strong>Best for:</strong> Upper West Side and Upper East Side residents · Early mornings</p>

<h3>Riverside Park Dog Run (Upper West Side)</h3>
<p>The 72nd Street dog run in Riverside Park is one of Manhattan's most popular, with a dedicated fenced area and regular community events. The park itself stretches for miles along the Hudson River — perfect for longer walks after the dog run.</p>
<p><strong>Address:</strong> Riverside Park, 72nd St, Manhattan<br>
<strong>Best for:</strong> UWS residents · River views · Active large dogs</p>

<h2>The Bronx Dog Parks</h2>

<h3>Pelham Bay Park Dog Run</h3>
<p>The largest park in NYC by area, Pelham Bay has a dedicated dog run that's less crowded than Manhattan or Brooklyn options. Great for dogs that get overwhelmed in busy environments. Acres of walking trails surrounding it.</p>
<p><strong>Address:</strong> Pelham Bay Park, Bronx<br>
<strong>Best for:</strong> Less crowded · Large dogs · Nature walks</p>

<h2>Staten Island Dog Parks</h2>

<h3>Snug Harbor Dog Run</h3>
<p>Part of the beautiful Snug Harbor Cultural Center grounds, this dog run has a peaceful, well-maintained environment. Popular with Staten Island dog owners on weekends.</p>
<p><strong>Address:</strong> 1000 Richmond Terrace, Staten Island<br>
<strong>Best for:</strong> Weekends · Calm environment · Cultural grounds</p>

<h2>What to Bring to NYC Dog Parks</h2>

<p>Before every dog park visit, make sure you have:</p>
<ul>
<li><strong>Poop bags</strong> — NYC parks are strict about cleanup. Always carry extras.</li>
<li><strong>Water + a portable bowl</strong> — Many runs have spigots but they're not always working.</li>
<li><strong>High-value treats</strong> — For recall training in off-leash environments, bring something your dog truly loves.</li>
<li><strong>Your dog's ID tags + vaccination records</strong> — Some runs require proof of rabies vaccination. Always keep tags current.</li>
<li><strong>A clean leash</strong> — Dog runs require leashes at entry and exit.</li>
</ul>

<p>Petshiwu carries a full range of portable water bottles, treat pouches, and poop bag dispensers — all delivered to your NYC door. <a href="/products">Shop all dog accessories →</a></p>

<h2>Dog Park Etiquette in NYC</h2>

<p>NYC dog parks have an unspoken code:</p>
<ul>
<li>Pick up immediately — never leave it to break down "naturally"</li>
<li>Watch your dog — don't get buried in your phone</li>
<li>Separate dogs that are escalating — don't let play become a fight</li>
<li>No aggressive dogs in the main area — use the quiet zone or off-hours</li>
<li>No food inside the run — it triggers resource guarding</li>
</ul>

<p>Questions about dog food or supplies? Our AI pet advisor can recommend the right food for your dog's size and activity level. <a href="/advanced-search">Try the AI advisor →</a></p>`
  },

  {
    title: "How to Keep Your Pet Cool During a New York City Summer Heatwave",
    slug: "nyc-summer-heatwave-pet-safety-tips",
    excerpt: "NYC summers hit hard — temperatures regularly exceed 95°F with brutal humidity. Here's how to keep your dog, cat, bird, and small pet safe when the city becomes a furnace.",
    petType: "all",
    category: "health",
    tags: ["nyc summer", "heatwave", "pet safety", "hot weather", "dehydration", "dog", "cat"],
    readTime: 7,
    coverImage: "https://images.unsplash.com/photo-1601758124510-52d02ddb7cbd?w=1200&q=85",
    content: `<h1>How to Keep Your Pet Cool During a New York City Summer Heatwave</h1>

<p>New York City summers are brutal. When heat advisories hit and the sidewalks reach 150°F, your pets feel it faster than you do. Dogs and cats can't sweat the way humans do — they rely almost entirely on panting and limited sweat glands in their paws. In a NYC summer, that's not nearly enough without help from you.</p>

<p>Here's a complete guide to keeping every type of pet safe when the city turns into an oven.</p>

<h2>For Dogs: The NYC Summer Survival Guide</h2>

<h3>The Sidewalk Test</h3>
<p>Before every walk, place the back of your hand on the sidewalk. If you can't hold it there for 5 seconds, it's too hot for your dog's paws. Concrete and asphalt can reach 150–170°F on a 90°F day in NYC — causing blistering burns in under 60 seconds.</p>
<p><strong>Solution:</strong> Walk before 8am or after 8pm. Carry your dog across unavoidable hot patches. Consider dog booties for short-distanced errands in the middle of the day.</p>

<h3>Hydration Is Non-Negotiable</h3>
<p>Dogs need significantly more water in summer — roughly 1 ounce of water per pound of body weight per day in normal weather, more during heat. A 50lb dog needs about 6 cups minimum, more if active.</p>
<ul>
<li>Keep multiple water bowls around the apartment — one per room if possible</li>
<li>Add ice cubes to the bowl — most dogs love them as a treat</li>
<li>Carry a collapsible water bowl on every walk</li>
<li>Wet food contains more moisture than dry kibble — consider a summer switch</li>
</ul>

<h3>Signs of Heatstroke in Dogs</h3>
<p>Know these warning signs immediately:</p>
<ul>
<li>Excessive panting that doesn't slow down even at rest</li>
<li>Thick, rope-like saliva</li>
<li>Red or pale gums</li>
<li>Vomiting or diarrhea</li>
<li>Disorientation, stumbling, collapsing</li>
</ul>
<p><strong>If you see these signs:</strong> Move your dog to air conditioning immediately. Apply cool (not cold) water to paw pads and armpits. Get to a vet — heatstroke is a medical emergency.</p>

<h3>Never Leave Dogs in Cars</h3>
<p>NYC has strict laws about this. On a 90°F day, a parked car interior reaches 130°F in under 10 minutes. This is fatal. There are no exceptions.</p>

<h2>For Cats: Indoor Heat Management</h2>

<p>Cats regulate heat better than dogs but NYC apartments — especially walk-ups in Queens, Brooklyn, and the Bronx — can become dangerously hot without AC.</p>

<h3>Create Cool Zones</h3>
<ul>
<li>Place a damp towel in their favorite spot — many cats will lie on cool, damp surfaces</li>
<li>Ceramic or marble tiles stay cool — put one in a shaded area</li>
<li>Keep bathroom floors cool — cats often seek tile floors in summer</li>
<li>Close curtains and blinds during peak sun hours (11am–4pm)</li>
</ul>

<h3>Keep Fresh Water Available</h3>
<p>Cats are notorious for not drinking enough water. In summer, dehydration is a real risk. A pet water fountain keeps water cool and moving — cats prefer running water instinctively. If your cat eats dry food, switch to wet food during heatwaves.</p>

<h3>Warning Signs in Cats</h3>
<ul>
<li>Rapid breathing or panting (cats rarely pant — this is a serious sign)</li>
<li>Drooling</li>
<li>Lethargy beyond normal summer laziness</li>
<li>Stumbling or loss of coordination</li>
</ul>

<h2>For Birds: The Most Heat-Sensitive Pet</h2>

<p>Birds are extremely sensitive to temperature changes. Jackson Heights and Queens have a large community of parrot owners — this section is especially important for you.</p>

<ul>
<li><strong>Never place the cage in direct sunlight</strong> — even for short periods</li>
<li>Mist your bird lightly with room-temperature water 2–3 times per day in a heatwave</li>
<li>Provide a shallow dish of cool water for bathing</li>
<li>Keep room temperature between 65–85°F — above 90°F is dangerous for most species</li>
<li><strong>Birds hide illness</strong> — by the time a bird shows distress, it's often advanced. Act at the first sign.</li>
</ul>

<h2>For Small Pets (Rabbits, Guinea Pigs, Hamsters)</h2>

<p>Small mammals are extremely heat-sensitive. Above 80°F is dangerous for rabbits; above 75°F is stressful for guinea pigs and hamsters.</p>

<ul>
<li>Place a frozen water bottle wrapped in a towel in their enclosure — they'll lean against it to cool down</li>
<li>Never use a fan blowing directly on them — it causes rapid moisture loss</li>
<li>Keep their enclosure out of sun exposure entirely</li>
<li>If your apartment loses AC, bring their enclosure to an air-conditioned room or consider a cooling mat</li>
</ul>

<h2>NYC-Specific Heatwave Advice</h2>

<h3>NYC Cooling Centers</h3>
<p>If your apartment loses power or AC during a heatwave, NYC opens cooling centers across all five boroughs. Check nyc.gov or call 311 for the nearest location.</p>

<h3>Pavement Temperature in NYC Neighborhoods</h3>
<p>Dark asphalt (most of Queens, Brooklyn, and the Bronx) heats up faster than lighter concrete (parts of Manhattan). Be extra cautious in neighborhoods with heavy traffic and little shade.</p>

<h3>Stock Up Before the Heat Hits</h3>
<p>During a heatwave, the last thing you want is to run out of pet food and face a blazing hot walk to a store. Petshiwu delivers to all NYC boroughs — stock up before the heat advisory and stay inside when it's dangerous. <a href="/products">Order pet supplies for delivery →</a></p>

<h2>Essential Summer Products</h2>

<p>Keep these on hand every NYC summer:</p>
<ul>
<li>Portable water bowl for dogs</li>
<li>Dog cooling mat or bandana</li>
<li>Pet water fountain (cats and dogs)</li>
<li>Wet food (higher moisture content)</li>
<li>Dog paw wax or booties for hot pavement</li>
</ul>

<p>All available on Petshiwu with fast delivery across NYC. <a href="/products">Shop now →</a></p>`
  },

  {
    title: "FIFA World Cup 2026 NYC: How to Watch with Your Dog and Celebrate Like a True NYC Pet Parent",
    slug: "world-cup-2026-nyc-watch-with-your-dog",
    excerpt: "The FIFA World Cup 2026 is here and New York City is one of the host cities. Here's how NYC pet parents can celebrate the tournament, find dog-friendly viewing spots, and keep their pets happy through match days.",
    petType: "dog",
    category: "lifestyle",
    tags: ["world cup 2026", "nyc", "dog friendly", "soccer", "team usa", "watch party"],
    readTime: 6,
    coverImage: "https://images.unsplash.com/photo-1516132006923-6cf348e5dee2?w=1200&q=85",
    content: `<h1>FIFA World Cup 2026 NYC: How to Watch with Your Dog and Celebrate Like a True NYC Pet Parent</h1>

<p>New York City is one of the host cities for the 2026 FIFA World Cup — and for the first time in 32 years, the USA is hosting the tournament on home soil. For NYC pet parents, this summer is going to be electric. Here's how to celebrate the World Cup with your four-legged teammate.</p>

<h2>NYC's World Cup Vibe This Summer</h2>

<p>With matches hosted at MetLife Stadium across the river in New Jersey, New York City is the epicenter of tournament energy. FIFA Fan Fest activities, watch parties in parks and plazas, and the city's incredible diversity of international fans make this summer unlike any other.</p>

<p>Jackson Heights — Petshiwu's home neighborhood — is one of the most diverse communities in the world. On match days, the neighborhood transforms into a global celebration. Every culture, every flag, and a whole lot of energy.</p>

<h2>Dog-Friendly World Cup Watching in NYC</h2>

<h3>Outdoor Watch Parties</h3>
<p>Many outdoor bar patios and beer gardens in NYC are dog-friendly. Look for venues in:</p>
<ul>
<li><strong>Williamsburg, Brooklyn</strong> — Several rooftop bars and beer gardens welcome dogs on their outdoor sections. Check venue websites for pet policies before game day.</li>
<li><strong>Long Island City, Queens</strong> — The LIC waterfront has pop-up events and outdoor screening areas that are pet-accessible.</li>
<li><strong>Astoria Park, Queens</strong> — Community watch parties often happen in parks. Check local Facebook groups for unofficial gatherings.</li>
<li><strong>Prospect Park, Brooklyn</strong> — Informal watch parties with portable screens have been popular for major soccer events.</li>
</ul>

<h3>Watching at Home with Your Dog</h3>
<p>Honestly, this is where most NYC dog owners will be — and it's the best option for your pet. Set up your couch, order your food, and make it a full match-day experience for you and your dog.</p>

<p>Some dogs actually get interested in the movement on TV, especially herding breeds. Others sleep through the whole thing. Either way, having your dog nearby makes the experience better.</p>

<h2>Match Day Snacks for Your Dog</h2>

<p>Make it a proper celebration for your pup too. Safe match-day treats for dogs:</p>
<ul>
<li><strong>Plain cooked chicken</strong> — easy to prep, high value</li>
<li><strong>Carrot sticks</strong> — crunchy, low calorie, dogs love them</li>
<li><strong>Blueberries</strong> — antioxidant-rich and fun as a small celebration treat</li>
<li><strong>Commercial dog treats</strong> — grab a bag of high-quality training treats and reward your dog every time the USA scores</li>
</ul>

<p><strong>Never give dogs during World Cup parties:</strong> Chips, guacamole (onions and avocado are toxic), nachos, hot dogs (too much salt and preservatives), or beer (obviously).</p>

<h2>Keeping Your Dog Calm During Loud Celebrations</h2>

<p>Crowd noise, horns, sudden cheering — World Cup watch parties get loud, even at home. If your dog is noise-sensitive:</p>
<ul>
<li>Create a safe retreat in a quiet room with their bed and water</li>
<li>Use white noise or a fan to dampen sudden sound peaks</li>
<li>Keep your body language calm — dogs read your stress immediately</li>
<li>Have high-value treats ready to create positive associations with cheering</li>
<li>If anxiety is severe, talk to your vet about short-term anti-anxiety options before big match days</li>
</ul>

<h2>NYC Neighborhoods to Watch on Game Day</h2>

<p>Even if you're not watching in these neighborhoods, walking through them during or after a match is an experience:</p>
<ul>
<li><strong>Jackson Heights</strong> — A global village on match days. Every nationality represented. Dogs on leashes are welcome throughout the neighborhood.</li>
<li><strong>Astoria</strong> — Large Greek, Latin American, and Middle Eastern communities turn out for matches.</li>
<li><strong>Sunnyside</strong> — The Irish pubs here go all out for major tournaments.</li>
<li><strong>Bay Ridge, Brooklyn</strong> — Large Arab-American community, beautiful waterfront for post-match walks with your dog.</li>
</ul>

<h2>Team USA and Your Dog</h2>

<p>At Petshiwu, we're proudly supporting Team USA this World Cup. We've decked our site out with Team USA banners and we'll be watching every match. A golden retriever carrying a soccer ball through Central Park felt like the right symbol for this moment — American, athletic, irresistible.</p>

<p>Whatever team you're rooting for, we hope your dog enjoys the summer as much as you will. Stock up on treats and food so you don't miss a minute of the action. <a href="/products">Shop now →</a></p>

<p><em>Go USA! 🇺🇸⚽</em></p>`
  },

  {
    title: "The NYC Pet Owner's Guide to Jackson Heights, Queens: The Most Diverse Pet Community in America",
    slug: "jackson-heights-queens-pet-owners-guide",
    excerpt: "Jackson Heights is one of the most diverse neighborhoods in the world — and its pet community reflects that. Here's everything a pet owner needs to know about living with animals in the heart of Queens, NY.",
    petType: "all",
    category: "lifestyle",
    tags: ["jackson heights", "queens", "nyc", "local", "pet community", "diverse", "neighborhoods"],
    readTime: 7,
    coverImage: "https://images.unsplash.com/photo-1548199973-03cce0bbc87b?w=1200&q=85",
    content: `<h1>The NYC Pet Owner's Guide to Jackson Heights, Queens: The Most Diverse Pet Community in America</h1>

<p>Jackson Heights, Queens is unlike any other neighborhood in New York City — or the world. Within a few square blocks, you'll hear Spanish, Bengali, Nepali, Tibetan, Korean, Hindi, and dozens of other languages. The same diversity that makes Jackson Heights a culinary and cultural destination also shapes its pet community in fascinating ways.</p>

<p>As a pet supply store based right here in Jackson Heights, we know this community deeply. Here's everything you need to know about keeping pets in the heart of Queens.</p>

<h2>What Makes Jackson Heights Unique for Pet Owners</h2>

<h3>The Diversity of Pets</h3>
<p>Jackson Heights has one of the most varied pet populations of any NYC neighborhood. You'll find:</p>
<ul>
<li><strong>Dogs and cats</strong> — the usual, ranging from tiny apartment chihuahuas to large working breeds</li>
<li><strong>Birds</strong> — a large South Asian and Latin American community maintains a strong tradition of bird keeping. Parrots, parakeets, finches, canaries, and conures are all common. The neighborhood has one of the highest concentrations of parrot owners in NYC.</li>
<li><strong>Fish</strong> — aquariums are popular across multiple cultures in the neighborhood, from simple goldfish setups to elaborate tropical tanks</li>
<li><strong>Small mammals</strong> — rabbits, guinea pigs, and hamsters are popular family pets across the community</li>
</ul>

<h3>Pet Culture Differences</h3>
<p>Pet-keeping practices vary significantly across cultures, and Jackson Heights is a crash course in all of them. In South Asian communities, dogs are often kept outside or in specific home areas — bringing them to dog parks or letting them on furniture may be less common. In Latin American communities, dogs are often deeply integrated into family life. These differences make Jackson Heights's dog runs particularly interesting — you'll see a genuinely diverse cross-section of owners and approaches.</p>

<h2>Parks and Walking Routes in Jackson Heights</h2>

<h3>Travers Park</h3>
<p>The neighborhood's main park, Travers Park is a well-maintained space on 34th Avenue that's been transformed into a pedestrian plaza on weekends. Dogs are welcome on leash throughout. It's the social heart of the neighborhood.</p>

<h3>Hoffman Park Dog Run</h3>
<p>The dedicated dog run on 78th Street and 34th Avenue is the main off-leash spot for Jackson Heights dogs. Well-maintained, fenced, with a small and large dog section. Most active in the early morning and early evening.</p>

<h3>34th Avenue Open Street</h3>
<p>One of NYC's permanent Open Streets, 34th Avenue is closed to through traffic and converted to a pedestrian and cyclist corridor daily. It's one of the best dog-walking routes in all of Queens — long, flat, and filled with energy. Your dog will get significant social stimulation just from one pass through.</p>

<h3>Flushing Meadows-Corona Park</h3>
<p>A 10-minute drive or bus ride away, this massive park is the best option for dogs that need real open space. The dog run here is one of the largest in Queens.</p>

<h2>Getting Pet Supplies in Jackson Heights</h2>

<p>Jackson Heights has a handful of local pet stores, primarily on Roosevelt Avenue and 74th Street. These stores are good for emergency supplies but typically carry a limited range of brands and specialty products.</p>

<p>For a full selection — prescription diets, premium brands, specialty bird food, specialty reptile supplies — you need an online source that delivers. That's exactly why we built Petshiwu here in Jackson Heights. We can get 10,000+ products to your door faster and cheaper than a trip to a big-box store in another neighborhood.</p>

<h2>Vets Near Jackson Heights</h2>

<p>Several veterinary practices serve Jackson Heights and the surrounding area. We won't recommend specific vets here (always do your own research) but key areas to search include:</p>
<ul>
<li>Northern Boulevard (multiple practices between Jackson Heights and Flushing)</li>
<li>Junction Boulevard area in Corona</li>
<li>Astoria has several highly-rated practices that are accessible from Jackson Heights</li>
</ul>
<p>For specialty care, the Animal Medical Center on the Upper East Side of Manhattan is one of the country's best 24-hour emergency and specialty hospitals.</p>

<h2>Jackson Heights Pet Community Tips</h2>

<h3>The 34th Avenue Dog Walking Community</h3>
<p>A tight-knit group of dog owners walk 34th Avenue every morning. This is the fastest way to meet other dog owners in the neighborhood — just start walking the Open Street at 7–9am and you'll integrate naturally.</p>

<h3>Language Support</h3>
<p>Jackson Heights is deeply multilingual, and pet care information isn't always available in every language. Petshiwu is committed to serving the full diversity of our community. Our customer support can assist in multiple languages — contact us at support@petshiwu.com or (800) 259-2605.</p>

<h3>Bird Owners in Jackson Heights</h3>
<p>If you keep parrots or other birds, Jackson Heights is one of the best places to be in NYC. There's a community of experienced bird owners, informal knowledge-sharing, and cultural practices around bird care that you won't find in other neighborhoods. Connect with neighbors — the knowledge available here is remarkable.</p>

<h2>Why Petshiwu is Built for Jackson Heights</h2>

<p>We didn't choose Jackson Heights by accident. This neighborhood needed a pet store that understood its community — the diversity of pets, the diversity of owners, the value consciousness, and the premium on convenience in a dense urban neighborhood where carrying heavy bags is genuinely difficult.</p>

<p>We deliver to every street in Jackson Heights, Elmhurst, Woodside, Corona, and all surrounding Queens neighborhoods. <a href="/products">Order now and get free delivery on orders over $49 →</a></p>`
  }
];

async function seed() {
  console.log('Connecting to MongoDB...');
  await mongoose.connect(MONGO_URI);
  console.log('Connected.\n');

  let created = 0;
  let skipped = 0;

  for (const post of POSTS) {
    const existing = await Blog.findOne({ slug: post.slug });
    if (existing) {
      console.log(`⏭  Skipped (exists): ${post.title}`);
      skipped++;
      continue;
    }

    await Blog.create({
      ...post,
      author: new mongoose.Types.ObjectId(ADMIN_AUTHOR_ID),
      isPublished: true,
      publishedAt: new Date(),
    });

    console.log(`✅ Created: ${post.title}`);
    created++;
  }

  console.log(`\nDone. Created: ${created}, Skipped: ${skipped}`);
  await mongoose.disconnect();
}

seed().catch(err => {
  console.error('❌ Error:', err.message);
  process.exit(1);
});
