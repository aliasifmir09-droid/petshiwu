/**
 * seedCareGuides.mjs - Seeds the database with care guide articles
 * Run: MONGODB_URI=... bun run scripts/seedCareGuides.mjs
 */
import mongoose from '../../node_modules/mongoose/index.js';

const ADMIN_ID = new mongoose.Types.ObjectId('69389a8553df9b1f9b03a2ba');

const guides = [
  {
    title: "How to Choose the Best Dog Food for Your Breed",
    slug: "how-to-choose-best-dog-food",
    excerpt: "With hundreds of dog food options available, picking the right one can be overwhelming. This guide breaks down everything you need to know about ingredients, life stages, and breed-specific needs.",
    petType: "dog",
    category: "Feeding",
    difficulty: "beginner",
    readingTime: 8,
    tags: ["dog food", "nutrition", "feeding", "dry food", "wet food"],
    sections: [
      { order: 1, title: "Understanding Dog Food Labels", content: "The first ingredient listed is always present in the highest quantity. Look for a named protein source (chicken, beef, salmon) as the first ingredient — not 'meat meal' or 'by-products'. The AAFCO statement on the label tells you whether the food meets minimum nutritional requirements for your dog's life stage." },
      { order: 2, title: "Life Stage Matters", content: "Puppies need higher protein and calorie density for growth. Adults need balanced maintenance nutrition. Seniors benefit from lower calories, added joint support (glucosamine), and easier-to-digest proteins. Never feed puppy food long-term to an adult dog — the excess calories and calcium cause problems over time." },
      { order: 3, title: "Dry vs. Wet Food", content: "Dry kibble is convenient, shelf-stable, and often better for dental health. Wet food has higher moisture content (good for hydration and picky eaters) and typically has fewer preservatives. Many owners feed a combination — wet food as a topper on dry kibble works great for dogs who need extra hydration or appetite encouragement." },
      { order: 4, title: "Breed & Size Considerations", content: "Large breeds need controlled calcium levels to prevent rapid bone growth that leads to joint issues. Small breeds need energy-dense food in smaller kibble sizes. Giant breeds should avoid foods that cause fast growth. Always check if a formula is specifically labeled for your dog's size category." },
      { order: 5, title: "Common Ingredients to Watch For", content: "Avoid artificial preservatives (BHA, BHT, ethoxyquin), artificial colors, and excessive fillers like corn syrup. Whole grains (brown rice, oatmeal) are fine for most dogs — the grain-free trend is not necessarily healthier and has been linked to heart issues in some breeds. If your dog has allergies, look for limited-ingredient diets with a single protein source." },
    ],
    content: "Choosing the right dog food is one of the most important decisions you make for your pet's health. This guide covers everything from reading labels to matching nutrition to your dog's specific life stage and breed size.",
    isPublished: true,
    publishedAt: new Date('2026-04-01'),
    views: 0,
    metaTitle: "How to Choose the Best Dog Food | PetShiwu Care Guide",
    metaDescription: "Learn how to read dog food labels, understand life stage nutrition, and choose the right formula for your breed. Expert feeding guide from PetShiwu.",
  },
  {
    title: "Complete Puppy Care Guide: First 6 Months",
    slug: "complete-puppy-care-guide-first-6-months",
    excerpt: "Bringing home a new puppy is exciting — and a lot of work. Here's everything you need to set your puppy up for a healthy, happy life from day one.",
    petType: "dog",
    category: "Health",
    difficulty: "beginner",
    readingTime: 10,
    tags: ["puppy", "new puppy", "puppy care", "vaccinations", "training", "socialization"],
    sections: [
      { order: 1, title: "The First Week Home", content: "Keep things calm. Your puppy is adjusting to new smells, sounds, and faces. Set up a dedicated sleep area with a crate or bed in a quiet spot. Establish a feeding schedule (3 times a day for puppies under 6 months). Limit access to the house at first — a smaller space means fewer accidents and faster house-training." },
      { order: 2, title: "Vaccinations & Vet Visits", content: "Your puppy needs a series of core vaccines at 8, 12, and 16 weeks: distemper, parvovirus, adenovirus, and rabies. Your vet will also recommend bordatella (kennel cough) and leptospirosis depending on your area. Keep your puppy away from unvaccinated dogs and public areas until the full series is complete at 16 weeks." },
      { order: 3, title: "House Training Basics", content: "Take your puppy out every 2 hours, immediately after meals, and right after waking up. Use the same spot each time. The moment they finish going outside, praise and treat. Never punish accidents indoors — just clean thoroughly with an enzyme cleaner to remove the scent. Puppies can't fully control their bladder until 4-6 months." },
      { order: 4, title: "Socialization Window", content: "The critical socialization window closes around 12-16 weeks. During this time, safely expose your puppy to as many people, sounds, surfaces, and experiences as possible. Puppy classes (for partially vaccinated puppies) are ideal. Positive early experiences prevent fear-based behavior problems later in life." },
      { order: 5, title: "Puppy Nutrition", content: "Feed a high-quality puppy formula 3 times daily until 6 months, then switch to twice daily. Large breed puppies should eat large breed puppy food specifically — regular puppy food causes too-rapid growth. Follow the feeding guide on the bag but adjust based on body condition: you should feel ribs but not see them." },
    ],
    content: "The first six months with a puppy set the foundation for the next 10-15 years. From vaccinations to house training to socialization, this guide covers everything new puppy parents need to know.",
    isPublished: true,
    publishedAt: new Date('2026-04-05'),
    views: 0,
    metaTitle: "Complete Puppy Care Guide: First 6 Months | PetShiwu",
    metaDescription: "Everything new puppy owners need to know: vaccinations, house training, socialization, and nutrition for the first 6 months of your puppy's life.",
  },
  {
    title: "Senior Dog Care: Keeping Your Older Dog Healthy & Happy",
    slug: "senior-dog-care-guide",
    excerpt: "Dogs are considered seniors at 7-10 years depending on size. Learn how to adjust their care routine, nutrition, and vet visits to support their golden years.",
    petType: "dog",
    category: "Health",
    difficulty: "beginner",
    readingTime: 7,
    tags: ["senior dog", "aging dog", "dog health", "joint health", "senior nutrition"],
    sections: [
      { order: 1, title: "When Is a Dog Considered Senior?", content: "Small breeds (under 20 lbs) age more slowly — they're senior around age 10-12. Medium breeds enter their senior years around 8-10. Large breeds are seniors at 6-8, and giant breeds as early as 5-6. Age affects metabolism, joint health, organ function, and energy levels." },
      { order: 2, title: "Switching to Senior Food", content: "Senior formulas are lower in calories to prevent weight gain, higher in fiber for digestive health, and often contain added glucosamine and chondroitin for joints. Some senior dogs do better on a high-protein diet to maintain muscle mass — ask your vet which approach suits your dog's health status." },
      { order: 3, title: "More Frequent Vet Visits", content: "Senior dogs benefit from twice-yearly vet checkups instead of annual. Labs (blood work, urinalysis) help catch kidney disease, diabetes, thyroid problems, and liver issues early when they're most treatable. Dental disease is extremely common in older dogs and directly affects heart and kidney health — dental cleanings may become more frequent." },
      { order: 4, title: "Joint Health & Exercise", content: "Most senior dogs develop some arthritis. Signs include stiffness after rest, reluctance to climb stairs, slowing on walks. Glucosamine supplements, orthopedic beds, and ramps (instead of stairs or jumps) make a big difference. Keep walks shorter but maintain them — gentle daily exercise prevents muscle loss and keeps weight in check." },
      { order: 5, title: "Cognitive Changes", content: "Canine Cognitive Dysfunction (doggy dementia) affects many older dogs. Signs: confusion at night, forgetting house training, standing and staring, anxiety. Puzzle feeders, new smells, and gentle training keep minds sharp. Diets enriched with omega-3s and antioxidants support brain health. Prescription medications can help in advanced cases." },
    ],
    content: "Caring for a senior dog means adjusting nutrition, vet schedules, exercise, and environment to meet their changing needs. Here's how to give your older dog the best quality of life possible.",
    isPublished: true,
    publishedAt: new Date('2026-04-10'),
    views: 0,
    metaTitle: "Senior Dog Care Guide | PetShiwu",
    metaDescription: "Learn how to care for your senior dog with tips on nutrition, joint health, vet visits, and cognitive support. Help your older dog thrive.",
  },
  {
    title: "The Complete Cat Feeding Guide",
    slug: "complete-cat-feeding-guide",
    excerpt: "Cats are obligate carnivores with very specific nutritional needs. Understanding what, how much, and how often to feed your cat is the foundation of their health.",
    petType: "cat",
    category: "Feeding",
    difficulty: "beginner",
    readingTime: 7,
    tags: ["cat food", "cat nutrition", "feeding cats", "wet food", "dry food", "cat health"],
    sections: [
      { order: 1, title: "Cats Are Obligate Carnivores", content: "Unlike dogs, cats cannot produce certain essential nutrients themselves — they must come from animal protein. Taurine (found in meat) is critical for heart and eye health. Cats also need arachidonic acid and preformed vitamin A from animal sources. A cat cannot thrive on a plant-based diet." },
      { order: 2, title: "Wet vs. Dry Food", content: "Cats have a low thirst drive and naturally get much of their water from food. Wet food (70-80% moisture) is excellent for urinary tract health and kidney function. Dry food is convenient and good for dental health but should not be the only food source for cats prone to urinary problems. Many vets recommend at least half the diet as wet food." },
      { order: 3, title: "How Much to Feed", content: "Most adult cats need about 20 calories per pound of ideal body weight per day. A 10-pound cat needs ~200 calories — roughly one 5.5 oz can of wet food plus a small amount of dry. Use the feeding guides on packages as a starting point but adjust based on your cat's body condition. You should be able to feel (but not see) their ribs." },
      { order: 4, title: "Feeding Schedules", content: "Free-feeding dry food works for cats who self-regulate, but leads to obesity in many cats. Scheduled meals (twice daily) give you better control. Puzzle feeders slow eating and provide mental stimulation. Never let a cat go more than 24-48 hours without eating — fat mobilization can cause hepatic lipidosis (fatty liver disease), which is serious." },
      { order: 5, title: "Life Stage Nutrition", content: "Kittens need kitten formula (higher protein and fat) until 12 months. Adults thrive on maintenance formulas. Indoor cats often do well on indoor-specific formulas with fewer calories and added fiber. Senior cats (age 11+) may need more protein to maintain muscle. Always transition food gradually over 7-10 days to avoid digestive upset." },
    ],
    content: "Feeding your cat correctly is about more than just choosing a flavor they like. This guide explains cat-specific nutritional needs, the wet vs. dry food debate, portion sizing, and life stage considerations.",
    isPublished: true,
    publishedAt: new Date('2026-04-12'),
    views: 0,
    metaTitle: "Complete Cat Feeding Guide | PetShiwu",
    metaDescription: "Learn what, how much, and when to feed your cat. Covers wet vs. dry food, life stage nutrition, and how to prevent common feeding-related health problems.",
  },
  {
    title: "Cat Grooming Basics: Coat, Nails & Dental Care",
    slug: "cat-grooming-basics",
    excerpt: "Most cats are fastidious self-groomers, but they still need your help with nail trims, hairball prevention, and dental health. Here's a practical grooming routine for any cat owner.",
    petType: "cat",
    category: "Grooming",
    difficulty: "beginner",
    readingTime: 6,
    tags: ["cat grooming", "cat nails", "cat teeth", "hairballs", "brushing cats"],
    sections: [
      { order: 1, title: "Brushing & Coat Care", content: "Short-haired cats need brushing once a week. Long-haired breeds (Maine Coon, Persian, Ragdoll) need daily brushing to prevent painful mats. Use a slicker brush or fine-tooth comb. Regular brushing removes loose fur, reducing hairballs and keeping your home cleaner. Start young and make it a positive experience with treats." },
      { order: 2, title: "Managing Hairballs", content: "Hairballs are normal but frequent vomiting is not healthy. Help prevent them by brushing regularly, feeding hairball-control food (higher fiber), or adding a hairball remedy gel (petroleum-based lubricant) once or twice a week. If your cat has frequent unproductive retching or seems in distress, see a vet — a blockage is a medical emergency." },
      { order: 3, title: "Nail Trimming", content: "Trim nails every 2-3 weeks. Use cat-specific nail clippers — never human nail clippers. Cut just the clear tip, avoiding the pink 'quick' (blood vessel). If you cut the quick, apply styptic powder. Wrap nervous cats in a towel. Many cats tolerate trims better when done during napping or after play. Start with one paw at a time if needed." },
      { order: 4, title: "Dental Health", content: "80% of cats show signs of dental disease by age 3. Daily toothbrushing with cat-safe toothpaste is ideal — use a finger brush or soft toothbrush. Never use human toothpaste (toxic to cats). Dental treats and water additives help, but are not substitutes for brushing. Annual professional dental cleanings prevent tooth loss and systemic infection." },
      { order: 5, title: "Ear & Eye Cleaning", content: "Check ears weekly. Healthy ears are pale pink, odorless, and have minimal wax. Clean visible wax with a cotton ball moistened with veterinary ear cleaner — never insert anything into the ear canal. Wipe eye discharge gently with a damp cotton ball. Excessive discharge, redness, or odor from ears or eyes requires a vet visit." },
    ],
    content: "A regular grooming routine keeps your cat comfortable, prevents health problems, and strengthens your bond. This guide covers brushing, nail trims, dental care, and what to watch out for.",
    isPublished: true,
    publishedAt: new Date('2026-04-15'),
    views: 0,
    metaTitle: "Cat Grooming Basics: Coat, Nails & Dental Care | PetShiwu",
    metaDescription: "Learn how to groom your cat at home — from brushing and nail trimming to dental care and hairball prevention. Step-by-step guide for cat owners.",
  },
  {
    title: "Setting Up a Freshwater Aquarium: Beginner's Guide",
    slug: "freshwater-aquarium-setup-beginners-guide",
    excerpt: "A thriving aquarium starts with proper setup. From tank size and filtration to the nitrogen cycle and stocking, here's everything first-time fish keepers need to know.",
    petType: "fish",
    category: "Housing",
    difficulty: "beginner",
    readingTime: 9,
    tags: ["aquarium", "fish tank", "freshwater fish", "aquarium setup", "nitrogen cycle", "beginner"],
    sections: [
      { order: 1, title: "Choosing Your Tank Size", content: "Bigger tanks are actually easier to maintain than small ones — water chemistry is more stable and fish have more space. For beginners, a 20-30 gallon tank is ideal. Avoid bowls and tanks under 10 gallons: they have poor oxygenation and rapid water quality swings. Rule of thumb: 1 inch of fish per gallon of water (as a starting guideline, not a hard rule)." },
      { order: 2, title: "Essential Equipment", content: "You need: a filter (hang-on-back or canister), a heater (for tropical fish, set to 76-80°F), a thermometer, a light (for plant growth or viewing), a lid (fish jump), a substrate (gravel or sand), and a water conditioner to neutralize chlorine. A testing kit for ammonia, nitrite, nitrate, and pH is essential for new tanks." },
      { order: 3, title: "The Nitrogen Cycle — Most Important Step", content: "New tanks must cycle before adding fish. This process (2-6 weeks) establishes beneficial bacteria that convert toxic ammonia (from fish waste) to nitrite, then to less harmful nitrate. Add a small amount of fish food or an ammonia source, test daily, and do partial water changes when nitrite or nitrate gets high. The tank is cycled when ammonia and nitrite both read zero." },
      { order: 4, title: "Water Quality & Maintenance", content: "Change 25-30% of the water every 1-2 weeks using a gravel vacuum to remove waste from the substrate. Never change more than 50% at once — it crashes beneficial bacteria. Treat new water with dechlorinator before adding. Test water parameters weekly when starting out. Clean the filter media in old tank water (not tap water) to preserve bacteria." },
      { order: 5, title: "Choosing Your First Fish", content: "Best beginner fish: Betta (single fish in 5+ gallons), tetras, danios, platies, mollies, corydoras catfish, and goldfish (cold water, needs at least 20 gallons). Research compatibility — not all fish can live together. Add fish slowly over weeks, not all at once. Quarantine new fish for 2 weeks before adding to your main tank." },
    ],
    content: "Setting up a freshwater aquarium is one of the most rewarding hobbies for pet owners. This guide walks you through tank selection, equipment, the crucial nitrogen cycle, water maintenance, and choosing your first fish.",
    isPublished: true,
    publishedAt: new Date('2026-04-18'),
    views: 0,
    metaTitle: "Freshwater Aquarium Setup Guide for Beginners | PetShiwu",
    metaDescription: "Complete beginner's guide to setting up a freshwater aquarium — from tank size and equipment to the nitrogen cycle, water changes, and choosing your first fish.",
  },
  {
    title: "Bird Care 101: What Every New Bird Owner Should Know",
    slug: "bird-care-101-new-owner-guide",
    excerpt: "Birds are intelligent, social, and long-lived pets that require specialized care. Whether you have a parakeet or a parrot, this guide covers the essentials of daily bird care.",
    petType: "bird",
    category: "Health",
    difficulty: "beginner",
    readingTime: 8,
    tags: ["bird care", "parakeet", "parrot", "bird health", "bird feeding", "bird cage"],
    sections: [
      { order: 1, title: "Cage Size & Setup", content: "The cage should be as large as possible — birds need room to spread their wings and move around. Bar spacing matters: too wide and small birds escape or get their heads stuck (parakeets: 1/2\" max, cockatiels: 3/4\", large parrots: 1\"-1.5\"). Place the cage in a social area where your bird can interact with the family, but away from kitchens (cooking fumes are toxic to birds)." },
      { order: 2, title: "Bird Nutrition", content: "Seeds alone are like giving a child candy for every meal. A healthy bird diet includes: high-quality pellets (50-70% of diet), fresh vegetables (leafy greens, carrots, peppers), and small amounts of fruit. Seeds and nuts are treats, not staples. Never feed avocado, chocolate, onion, garlic, caffeine, or alcohol — all are toxic to birds." },
      { order: 3, title: "Mental Stimulation & Socialization", content: "Birds are highly intelligent and get bored easily, leading to feather plucking and screaming. Rotate toys weekly. Teach foraging behaviors — hide food in toys so they have to work for it. Spend at least 1-2 hours daily interacting with your bird. Parrots especially form strong bonds and can develop serious behavioral problems when neglected." },
      { order: 4, title: "Common Health Concerns", content: "Birds hide illness until they're very sick — watch for puffed feathers, loss of appetite, discharge from eyes or nares, changes in droppings, or sitting at the bottom of the cage. These are serious signs requiring immediate vet attention. Birds need an avian-specialized vet, not a regular dog/cat vet. Annual checkups are important since birds age faster than we notice." },
      { order: 5, title: "Household Dangers for Birds", content: "Birds have extremely sensitive respiratory systems. Never use: Teflon/non-stick cookware (fumes are instantly fatal), scented candles, air fresheners, aerosol sprays, perfume near the bird, or smoke of any kind. Other dangers: ceiling fans, open toilets, other pets, and windows (birds don't understand glass). Always supervise out-of-cage time." },
    ],
    content: "Birds are rewarding but demanding pets with specific needs that many new owners don't anticipate. This guide covers housing, nutrition, socialization, health warning signs, and household dangers every bird owner needs to know.",
    isPublished: true,
    publishedAt: new Date('2026-04-22'),
    views: 0,
    metaTitle: "Bird Care 101: New Owner's Complete Guide | PetShiwu",
    metaDescription: "Essential bird care guide covering cage setup, nutrition, socialization, common health issues, and household dangers. Everything new bird owners need to know.",
  },
  {
    title: "Dog Dental Care: Why It Matters and How to Do It",
    slug: "dog-dental-care-guide",
    excerpt: "Dental disease is the most common health condition in adult dogs. Left untreated, it leads to pain, tooth loss, and bacteria entering the bloodstream. Here's how to protect your dog's teeth.",
    petType: "dog",
    category: "Health",
    difficulty: "beginner",
    readingTime: 6,
    tags: ["dog dental care", "dog teeth", "dog dental disease", "brushing dog teeth", "dental treats"],
    sections: [
      { order: 1, title: "The Scale of the Problem", content: "By age 3, 80% of dogs have some form of dental disease. Plaque hardens into tartar within 24-48 hours. Tartar under the gumline causes gingivitis and periodontitis. Bacteria from infected gums enter the bloodstream and can damage the heart, kidneys, and liver. Dental disease is painful — many dogs simply hide it." },
      { order: 2, title: "Brushing — The Gold Standard", content: "Daily brushing is the single most effective thing you can do. Use dog-specific toothpaste (flavors like poultry or peanut butter make it easier) and a soft toothbrush or finger brush. Never use human toothpaste — xylitol and fluoride are toxic to dogs. Start by letting your dog lick the toothpaste, then gradually introduce the brush. Focus on the outside surfaces where tartar accumulates most." },
      { order: 3, title: "Dental Chews & Treats", content: "VOHC (Veterinary Oral Health Council) certified products have proven efficacy — look for the seal. Rawhide, bully sticks, and nylon chews can help mechanically scrape plaque. Avoid antlers, hard bones, and ice — these are hard enough to crack teeth. Dental chews are helpful additions but not substitutes for brushing." },
      { order: 4, title: "Professional Dental Cleanings", content: "Even with home care, most dogs need professional dental cleanings every 1-3 years. This requires anesthesia — any clinic offering 'anesthesia-free' dental cleanings is not actually cleaning under the gumline where it matters. Don't let the anesthesia concern you: it's routine and well-monitored. The health benefits far outweigh the risk." },
      { order: 5, title: "Signs of Dental Problems", content: "Bad breath is the most common sign, but not the only one. Watch for: drooling more than usual, dropping food while eating, pawing at the mouth, facial swelling, bleeding gums, reluctance to chew hard food, yellow-brown tartar on teeth. Any of these warrants a vet exam. Dental disease caught early is much less expensive and painful to treat." },
    ],
    content: "Dental disease affects most adult dogs and causes real pain and systemic health problems. This guide covers daily brushing technique, helpful products, when to schedule professional cleanings, and warning signs to watch for.",
    isPublished: true,
    publishedAt: new Date('2026-04-25'),
    views: 0,
    metaTitle: "Dog Dental Care Guide: Brushing, Treats & Vet Cleanings | PetShiwu",
    metaDescription: "Learn how to protect your dog's teeth with daily brushing, dental chews, and professional cleanings. Everything you need to prevent dental disease in dogs.",
  },
  {
    title: "Understanding Cat Litter: Types, Placement & Litter Box Rules",
    slug: "understanding-cat-litter-complete-guide",
    excerpt: "Litter box problems are the #1 reason cats are surrendered to shelters. Most issues come down to the wrong litter, wrong location, or not enough boxes. Here's everything you need to know.",
    petType: "cat",
    category: "Housing",
    difficulty: "beginner",
    readingTime: 7,
    tags: ["cat litter", "litter box", "cat toilet training", "clumping litter", "litter box problems"],
    sections: [
      { order: 1, title: "The Right Number of Litter Boxes", content: "The rule is one box per cat, plus one extra. Two cats = three boxes minimum. Boxes in the same room count as one option — spread them through the house. If a cat is having accidents, adding more boxes is often the fastest fix. Never place a litter box next to food and water — cats won't eliminate where they eat." },
      { order: 2, title: "Types of Litter", content: "Clumping clay litter is the most popular: easy to scoop, good odor control. Non-clumping clay is cheaper but requires full box changes more often. Silica crystal litter lasts longer and controls odor well but some cats dislike the texture. Natural litters (corn, wheat, pine, paper) are eco-friendly and dust-free — great for cats with respiratory sensitivities. When in doubt, unscented clumping clay is the safest choice." },
      { order: 3, title: "Litter Box Size & Style", content: "Most commercially sold litter boxes are too small. The box should be at least 1.5x the length of your cat. Many cats prefer open, uncovered boxes — hoods trap odors inside (which bother cats) and can feel like a trap. Low-sided boxes help senior cats and kittens. High-sided boxes reduce scatter for enthusiastic diggers. Self-cleaning boxes work well but still need regular maintenance." },
      { order: 4, title: "Cleaning Frequency", content: "Scoop at least once daily — twice is better. Most cats will refuse to use a dirty box and find alternatives (like your laundry). Do a full litter change and box wash monthly (or more often with non-clumping litter). Use unscented soap — cats dislike strong scents. Litter depth should be 2-3 inches; too shallow and they can't dig, too deep and it spills." },
      { order: 5, title: "When Cats Stop Using the Box", content: "Medical causes (UTI, kidney disease, constipation, arthritis) must be ruled out first — always see a vet for sudden litter box avoidance. Behavioral causes include: box is too dirty, new litter they dislike, stress (new pet, new person, moved house), or the box is in a high-traffic/noisy area. Cats are not being spiteful — they're communicating a problem." },
    ],
    content: "Getting litter boxes right is essential for a happy cat and a clean home. This guide covers how many boxes you need, which litter types work best, box placement, cleaning routines, and what to do when your cat starts avoiding the box.",
    isPublished: true,
    publishedAt: new Date('2026-04-28'),
    views: 0,
    metaTitle: "Complete Guide to Cat Litter & Litter Boxes | PetShiwu",
    metaDescription: "Everything you need to know about cat litter types, how many boxes to have, placement, cleaning frequency, and solving litter box problems.",
  },
  {
    title: "Reptile Care Basics: What to Know Before Bringing One Home",
    slug: "reptile-care-basics-beginners-guide",
    excerpt: "Reptiles are fascinating pets with very specific temperature, humidity, and lighting needs. This guide covers the fundamentals of reptile care to help you decide if they're right for you — and how to succeed if they are.",
    petType: "reptile",
    category: "Housing",
    difficulty: "intermediate",
    readingTime: 9,
    tags: ["reptile care", "bearded dragon", "leopard gecko", "ball python", "UVB", "reptile heating"],
    sections: [
      { order: 1, title: "Reptiles Are Not Low-Maintenance Pets", content: "A common misconception is that reptiles are easy pets. In reality, they have complex needs: precise temperature gradients, proper humidity levels, UV lighting, and species-specific diets. They also require specialized veterinary care. Research your specific species thoroughly before purchasing. The most common beginner reptiles are bearded dragons, leopard geckos, ball pythons, and blue-tongued skinks." },
      { order: 2, title: "Temperature & Heating", content: "Reptiles are ectothermic — they rely on external heat to regulate body temperature. Every enclosure needs a temperature gradient: a warm basking spot (90-110°F depending on species) and a cool side (70-80°F). Use a heat lamp or ceramic heat emitter over a basking spot. Under-tank heaters should be on the side of the enclosure, not the bottom (prevents burns). Always use a digital thermometer — analog models are inaccurate." },
      { order: 3, title: "UVB Lighting", content: "Diurnal reptiles (bearded dragons, iguanas, chameleons, most lizards) require UVB light to synthesize Vitamin D3, which is essential for calcium absorption. Without it, they develop metabolic bone disease — a painful, often fatal condition. Use a reptile-specific UVB bulb (T5 HO is best) and replace it every 6 months even if it still emits visible light. Snakes and nocturnal geckos generally don't need UVB but benefit from it." },
      { order: 4, title: "Feeding & Nutrition", content: "Diet varies enormously by species. Bearded dragons eat both insects and vegetables; adult dragons should be mostly vegetables. Leopard geckos eat only insects. Ball pythons eat frozen/thawed mice or rats — never feed live prey (injury risk). Most feeder insects should be 'gut-loaded' (fed nutritious food before offering to your reptile) and dusted with calcium and vitamin supplements." },
      { order: 5, title: "Signs of a Healthy vs. Sick Reptile", content: "Healthy reptiles are alert, have clear eyes (not cloudy, which indicates shedding), are active during their active periods, eat regularly, and have formed droppings. Warning signs: refusing food for extended periods, lethargy, wheezing, runny nose or eyes, retained shed, unusual lumps, or discoloration. Reptiles hide illness — by the time they look sick, they often need urgent vet care." },
    ],
    content: "Reptiles are rewarding pets for owners who understand their specific needs. This guide covers the fundamentals of temperature, lighting, feeding, and health monitoring for common pet reptile species.",
    isPublished: true,
    publishedAt: new Date('2026-05-01'),
    views: 0,
    metaTitle: "Reptile Care Basics for Beginners | PetShiwu",
    metaDescription: "Complete beginner's guide to reptile care — covering temperature, UVB lighting, feeding, and health warning signs for bearded dragons, geckos, snakes, and more.",
  },
];

async function seed() {
  await mongoose.connect(process.env.MONGODB_URI, { dbName: 'petshop' });
  const col = mongoose.connection.db.collection('careguides');

  // Clear existing (empty) collection
  await col.deleteMany({});

  const now = new Date();
  const docs = guides.map(g => ({
    ...g,
    author: ADMIN_ID,
    createdAt: now,
    updatedAt: now,
  }));

  const result = await col.insertMany(docs);
  console.log(`✅ Inserted ${result.insertedCount} care guides`);

  // Show what was inserted
  for (const g of guides) {
    console.log(`  • [${g.petType}] ${g.title}`);
  }

  await mongoose.disconnect();
}

seed().catch(e => { console.error(e); process.exit(1); });
