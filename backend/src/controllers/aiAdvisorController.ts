// ================================================================
// FILE: backend/src/controllers/aiAdvisorController.ts
// FIXES:
//  1. Added petType to PetContext interface (fixes TS2339 build error)
//  2. Added petProfile support from frontend localStorage
//     → AI never asks for pet name/birthday if already saved
// ================================================================

import { Request, Response, NextFunction } from 'express';
import Product from '../models/Product';
import User from '../models/User';
import { Resend } from 'resend';
import jwt from 'jsonwebtoken';

const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent';

// ─── Breed Health Database ────────────────────────────────────────
const BREED_HEALTH_DATABASE = `
DOG BREEDS:
- Golden Retrievers: High risk of hip dysplasia and cancer. Recommend: Glucosamine, Chondroitin, joint supplements, weight-control food.
- French Bulldogs: Prone to skin allergies and breathing issues. Recommend: Grain-free or Limited Ingredient Diets, omega supplements.
- German Shepherds: Sensitive stomachs and hip issues. Recommend: Probiotics, highly digestible proteins, joint support.
- Labrador Retrievers: Prone to obesity and joint problems. Recommend: Weight management food, portion control, joint supplements.
- Bulldogs: Skin fold infections and obesity risk. Recommend: Skin health supplements, weight management food.
- Poodles: Prone to ear infections and skin issues. Recommend: Omega-3 supplements, grain-free diets.
- Beagles: Obesity-prone and sensitive ears. Recommend: Low-calorie food, dental chews.
- Chihuahuas: Dental disease and hypoglycemia risk. Recommend: Small breed dental chews, small breed food.
- Dachshunds: Spinal issues (IVDD). Recommend: Joint supplements, weight control food.
- Shih Tzus: Eye and skin issues. Recommend: Omega supplements, hypoallergenic food.
- Yorkshire Terriers: Dental disease and sensitive digestion. Recommend: Small breed dental treats, sensitive stomach food.
- Boxers: Heart issues and cancer risk. Recommend: Antioxidant-rich food, heart health supplements.
- Siberian Huskies: High energy, zinc-responsive dermatosis. Recommend: High-protein food, zinc supplements.
- Dobermans: Heart disease (DCM) risk. Recommend: Taurine-rich food, heart supplements.
- Rottweilers: Joint and heart issues. Recommend: Joint supplements, weight control.

CAT BREEDS & TYPES:
- Indoor Cats: Lower activity. Recommend: Hairball control food, weight management, interactive toys.
- Senior Cats (10+): Kidney health priority. Recommend: Low phosphorus wet food, kidney support supplements.
- Male Cats: Urinary tract health vital. Recommend: Urinary SO formulas, pH-balanced food, wet food.
- Maine Coons: Heart disease (HCM) risk. Recommend: Taurine-rich food, heart support supplements.
- Persian Cats: Respiratory and kidney issues. Recommend: Wet food for hydration, hairball control.
- Siamese: Respiratory and dental issues. Recommend: Dental chews, high-quality protein food.
- Bengal Cats: High energy. Recommend: High-protein raw or grain-free diets.
- Ragdolls: HCM risk. Recommend: Heart health food, taurine supplements.
`;

// ─── Nutrition Logic ──────────────────────────────────────────────
const NUTRITION_LOGIC = `
CALORIE CALCULATION:
- Base RER = 70 * (weight in kg)^0.75
- Puppy under 4 months: RER * 3.0
- Puppy 4-12 months: RER * 2.0
- Active adult dog: RER * 1.8
- Neutered/inactive adult dog: RER * 1.6
- Obese-prone dog: RER * 1.2
- Active adult cat: RER * 1.4
- Neutered/indoor cat: RER * 1.2
- Senior cat (7+): RER * 1.1
- Kitten: RER * 2.5
- Pregnant/nursing: RER * 3.0

INGREDIENT SCIENCE (explain the "why"):
- DHA: Essential for kitten/puppy brain and eye development
- Taurine: Critical for cat heart and eye health — cats cannot produce it themselves
- Glucosamine + Chondroitin: Rebuilds joint cartilage, reduces arthritis pain
- Omega-3 (EPA/DHA): Reduces inflammation, improves coat shine, supports heart health
- Probiotics: Restore gut flora, reduce diarrhea and digestive upset
- L-Carnitine: Burns fat, supports weight loss in overweight pets
- Antioxidants (Vitamin E/C): Boost immune system, fight cellular aging

LIFE STAGE GUIDELINES:
- Puppies (0-12 months): High protein, DHA, calcium. Look for "puppy formula" or "all life stages".
- Adult dogs (1-7 years): Balanced macros, dental health important.
- Senior dogs (7+): Joint support, lower calories, easy-to-digest proteins.
- Kittens (0-12 months): High protein and fat, taurine essential.
- Adult cats (1-10 years): High protein, taurine, hydration via wet food.
- Senior cats (10+): Low phosphorus, kidney-friendly, easy-to-chew.
`;

const NUTRITION_QA = `
PETSHIWU NUTRITION EXPERT Q&A:

Q: How do I choose quality pet food?
A: Look for AAFCO-approved food with real meat listed as the first ingredient. Dogs require 40 essential nutrients in their diet while cats require 42 — a complete, balanced formula covers all of these. At Petshiwu we recommend foods free of artificial preservatives, unnecessary fillers, and artificial dyes. Our expert-curated brands like Hill's Science Diet, Royal Canin, Purina, and Blue Buffalo meet these standards.

Q: How do I switch my pet to a new food?
A: Transition dogs over 7–10 days by gradually mixing increasing amounts of new food with the old. Cats need a longer transition of 2–4 weeks because sudden changes can cause them to refuse food entirely — which can quickly become a medical emergency. Start with 25% new food and increase slowly. If digestive upset occurs, slow the transition down further.

Q: How much should I feed my dog per day?
A: Adult dogs generally do best with 2 meals per day. Portions depend on weight and activity level: approximately 1–1.5 cups for small dogs under 20 lbs, 2–3 cups for medium dogs 20–50 lbs, and 3–4 or more cups for large dogs over 50 lbs. Always follow the AAFCO-approved feeding guidelines printed on the food packaging. Active or working dogs need more calories than sedentary ones.

Q: How often should I feed my cat?
A: Adult cats do well with 2 measured meals per day. Kittens need 3–4 smaller meals daily due to their high energy demands for growth. Avoid free-feeding (leaving food out all day) for most adult cats as it significantly contributes to obesity — over 60% of cats in the USA are currently overweight. Your vet can calculate precise daily calorie targets for your cat.

Q: Are pet vitamins and supplements necessary?
A: If your pet eats a complete and balanced commercial diet, additional vitamin and mineral supplements are generally not necessary and could even cause imbalances. However targeted supplements do help in specific situations: omega-3 fish oil improves skin and coat health, probiotics aid digestive health, glucosamine and chondroitin support aging joints, and L-carnitine assists with weight management. Always consult your vet before adding any supplement. Petshiwu carries a full range of vet-trusted supplements.

Q: What everyday foods are toxic to dogs?
A: Several common foods are toxic to dogs: chocolate, grapes and raisins, xylitol (an artificial sweetener found in gum and peanut butter), onions, garlic, avocado, macadamia nuts, alcohol, caffeine, and cooked bones. Even small amounts of xylitol or grapes can cause kidney failure or death. If your dog ingests any of these, contact a vet or the ASPCA Poison Control Hotline immediately.

Q: What everyday foods are toxic to cats?
A: Cats are highly sensitive to: onions, garlic, chocolate, caffeine, alcohol, grapes, raisins, xylitol, raw bread dough, and dairy products (most adult cats are lactose intolerant). Even tiny amounts of onion or garlic can cause dangerous anemia in cats. Never substitute dog food as a primary cat diet — cats require taurine which dog food doesn't provide in sufficient amounts.

Q: What is the difference between puppy food and adult food?
A: Puppies and kittens need calorie-dense formulas that are higher in protein, fat, calcium, and key developmental nutrients like DHA for brain and eye development. Large breed puppies specifically require controlled-growth formulas to reduce the risk of joint and bone problems later in life. Feeding adult food to a puppy as their primary diet can cause nutrient deficiencies and developmental issues.

Q: Is grain-free food better for my pet?
A: Grain-free diets are not required or superior for most pets unless a grain allergy has been specifically diagnosed by a vet. Research has linked certain grain-free diets to dilated cardiomyopathy (DCM) heart disease in dogs — particularly formulas high in legumes. For cats, grain-free is more aligned with their carnivore biology but protein source and overall quality matter most. Always consult your vet before switching to grain-free.

Q: Should I feed my pet wet food or dry food?
A: Both have merits and many pet owners combine them. Dry kibble supports dental health and is more calorie-dense. Wet food provides hydration which is especially important for cats — who naturally have low thirst drive — and for pets with urinary or kidney issues. For cats prone to urinary problems, a wet food diet or combination is strongly recommended by vets.
`;

const HEALTH_QA = `
PETSHIWU PET HEALTH EXPERT Q&A:

Q: How much sleep does my pet need each day?
A: Puppies need approximately 18–20 hours of sleep per day while adult dogs need 8–13 hours. Kittens need close to 20 hours and adult cats average 13–16 hours daily. Insufficient sleep can cause restlessness, behavioral problems, and stress.

Q: How much daily exercise does my pet need?
A: Dogs generally need 30 minutes to 2 hours of physical activity per day depending on breed. Cats benefit from approximately 30 minutes of active interactive play daily. Exercise prevents obesity, supports cardiovascular health, and significantly reduces behavioral problems.

Q: How do I know if my pet is overweight?
A: More than 56% of dogs and 60% of cats in the USA are currently overweight or obese. You should be able to feel — but not see — your pet's ribs with light pressure. A visible waist when viewed from above and a tucked abdomen from the side are healthy signs.

Q: How often should my pet visit the vet?
A: Adult pets should have annual wellness exams. Senior pets aged 7 and older benefit from checkups every 6 months to catch age-related conditions early. Puppies and kittens need more frequent visits for their vaccination schedule and growth monitoring.

Q: My dog has itchy skin. What could be causing it and what helps?
A: Itchy skin in dogs is most commonly caused by food allergies, environmental allergens, flea allergy dermatitis, dry skin, or bacterial and yeast skin infections. A limited-ingredient diet or a food rich in omega-3 fatty acids can significantly help with allergy-related itching. If the itching persists beyond 2 weeks or is severe, a vet visit is needed.

Q: Do indoor-only pets need flea, tick, and heartworm prevention?
A: Yes. Fleas can survive and reproduce entirely indoors year-round. Heartworm-carrying mosquitoes can enter homes. Petshiwu's pet care experts recommend year-round parasite prevention for all dogs and cats regardless of whether they go outside.

Q: When is a situation a true pet emergency?
A: Seek emergency veterinary care immediately for: difficulty breathing, collapse, seizures, suspected poisoning, uncontrolled bleeding, a cat straining but unable to urinate, or a dog with a visibly bloated abdomen. Also treat as urgent: vomiting or diarrhea lasting more than 24 hours.

Q: What vaccines does my dog need?
A: Core vaccines that all dogs need include DHPP and Rabies. Bordetella is strongly recommended every 6–12 months especially for dogs that visit groomers, boarding facilities, or dog parks. Your vet will design the right schedule.

Q: How do I care for a senior dog?
A: Senior dogs aged 7 and older benefit from vet checkups every 6 months, a senior-formula diet, omega-3 supplementation for brain and joint health, gentle age-appropriate exercise, and regular dental care. Watch closely for pain signals like stiffness or changes in gait.

Q: My cat has hairballs frequently. What can I do?
A: Occasional hairballs are normal. More frequent hairballs suggest a need for more regular brushing or a switch to a hairball-control food formulated with added fiber. If your cat is retching frequently without producing a hairball or stops eating, see a vet.
`;

const BEHAVIOR_QA = `
PETSHIWU PET BEHAVIOR EXPERT Q&A:

Q: My dog has separation anxiety. What can I do?
A: Separation anxiety is a genuine panic disorder — not disobedience. Behavioral modification with a qualified trainer is the most effective treatment. Never punish a dog for separation anxiety — it significantly worsens the condition. Consult your vet about FDA-approved medications like Reconcile for severe cases.

Q: How do I stop my dog from barking too much?
A: First identify what is triggering the barking — boredom, territorial alerting, anxiety, or attention-seeking. Teach the quiet command using positive reinforcement. Increased daily exercise and puzzle toys make a dramatic difference for boredom barking.

Q: My puppy is biting and chewing everything. Is this normal?
A: Yes — puppy biting is completely normal during the teething phase between 3 and 6 months. The key is immediate redirection to appropriate chew toys every single time they bite something they shouldn't. Frozen chew toys are especially soothing on sore gums.

Q: Why does my cat scratch furniture and how do I stop it?
A: Cats scratch to stretch their muscles, shed old claw sheaths, and mark territory. It is completely instinctual and cannot be eliminated — only redirected. Place tall sturdy scratching posts right next to the furniture they target. Double-sided tape applied to the furniture surface is an effective deterrent.

Q: How do I introduce a new pet to my existing pet?
A: Never just put two pets together and hope for the best. For cats, start with complete separation and spend 1–2 weeks doing scent swapping. For dogs, do leashed parallel walks in neutral territory before any face-to-face greeting at home.

Q: My dog is pulling on the leash on walks. What should I do?
A: Every time your dog pulls, immediately stop walking — do not move forward at all until there is slack in the leash. Front-clip harnesses and head halters are excellent management tools that reduce pulling while training is in progress.
`;

const GROOMING_QA = `
PETSHIWU PET GROOMING EXPERT Q&A:

Q: How often should I brush my dog?
A: Short-haired dogs need brushing about once a week. Long-haired breeds and dogs with double coats should be brushed daily to prevent painful mats and manage shedding.

Q: Do cats really need grooming if they clean themselves?
A: Yes. Short-haired cats benefit from weekly brushing. Long-haired cats need daily brushing to prevent painful mats and reduce hairballs. All cats need regular nail trims, dental care, and occasional ear cleaning.

Q: How do overgrown nails affect my pet?
A: Overgrown nails can crack, split, and cause bleeding. They also force the toes into an unnatural position which leads to joint strain and long-term orthopaedic problems. Dogs and cats typically need nail trims every 3–4 weeks.

Q: How often should my pet visit a professional groomer?
A: Short-haired dogs typically need professional grooming every 6–8 weeks. Long-haired and curly-coated breeds need grooming every 4–6 weeks to prevent matting. Cats generally need professional grooming 2–4 times per year.

Q: How do I brush my cat's teeth at home?
A: Use a cat-specific toothbrush and cat toothpaste — never human toothpaste as it is toxic to cats. Start by letting your cat lick the toothpaste off your finger for several days before introducing the brush. Even brushing a few times a week makes a significant difference in preventing tartar buildup.
`;

const TOYS_QA = `
PETSHIWU TOYS & ACCESSORIES EXPERT Q&A:

Q: What toys are best for puppies?
A: Puppies need toys that are safe for teething and appropriately sized to prevent choking. Excellent choices include soft rubber chew toys, rope toys, Kong-style toys stuffed with treats, and squeaky toys. Puzzle feeders are outstanding for channeling puppy energy productively.

Q: What toys do cats love most?
A: Cats are most engaged by toys that mimic natural prey behavior. Wand and feather toys for interactive play sessions are universally loved. Ball track toys, crinkle balls, puzzle feeders, and catnip toys are excellent for solo entertainment. Rotate toys regularly — cats lose interest in toys that are always available.

Q: Are puzzle toys and enrichment toys worth it?
A: Absolutely. Mental exercise is just as important as physical exercise. Puzzle feeders slow down fast eaters, reduce boredom-related destructive behavior, build confidence, and slow cognitive decline in senior pets. Dogs who receive regular mental stimulation through puzzle toys are significantly calmer and less prone to anxiety.
`;

// ─── Birthday Program ─────────────────────────────────────────────
const BIRTHDAY_PROGRAM_INFO = `
BIRTHDAY LOYALTY PROGRAM:
- If TODAY is the pet's birthday: "HAPPY BIRTHDAY [Pet Name]! 🎂🐾 Use code BDAYGIFT at checkout for a special birthday gift — our treat for your furry friend!"
- Discount code: BDAYGIFT
`;

// ─── Other Pet Species Knowledge ────────────────────────────────
const OTHER_SPECIES_QA = `
PETSHIWU EXPERT GUIDE — BIRDS, FISH, REPTILES & SMALL ANIMALS:

=== BIRDS ===

Q: What do parakeets (budgies) need to be healthy and happy?
A: Parakeets need a roomy cage (minimum 18"x18"x18" for one bird), a balanced diet of pellets as the main food plus fresh vegetables, limited seeds as treats, and at least 2–4 hours of supervised out-of-cage time daily. They are highly social — keeping two parakeets together dramatically improves their wellbeing. Fresh water daily, cuttlebone for calcium, and foraging toys are essential. Parakeets can live 7–15 years with proper care.

Q: What should I feed my parrot?
A: A high-quality pellet diet should make up about 70–80% of a parrot's food intake. Supplement with fresh vegetables (leafy greens, carrots, bell peppers), a small amount of fruit, and cooked grains. Never feed parrots: avocado, chocolate, caffeine, onions, garlic, or alcohol — all are toxic. Seeds alone as a primary diet lead to nutritional deficiencies, fatty liver disease, and shortened lifespan.

Q: How large should a bird cage be?
A: The cage must be large enough for your bird to fully spread its wings without touching the bars. Wider is more important than height — birds fly horizontally. For small birds like parakeets, minimum 18"x18". Cockatiels need 24"x24" minimum. Large parrots need 36"x24" or larger. Bar spacing matters too — it must be narrow enough that the bird cannot get its head stuck.

Q: What are signs my bird is sick?
A: Healthy birds are alert, vocal, and have smooth feathers. Seek a vet immediately if you notice: fluffed-up feathers while sitting still, loss of appetite, discharge from eyes or nostrils, labored breathing, tail-bobbing while breathing, loose or discolored droppings, or unusual lethargy. Birds instinctively hide illness — by the time symptoms are obvious, the bird is often seriously ill.

Q: What accessories do birds need?
A: Multiple perches of varying diameter and texture (natural wood is best), foraging toys and puzzle toys, shredding toys for mental stimulation, cuttlebone and mineral blocks, food and water bowls that are easy to clean, and a cage cover for nighttime. Rotate toys regularly — birds get bored with familiar items.

=== FISH & AQUARIUMS ===

Q: I am setting up my first aquarium. What do I need?
A: You need: a tank (bigger is more stable — minimum 10 gallons for beginners), a filter, heater (for tropical fish), thermometer, gravel or substrate, live or artificial plants for hiding spots, water conditioner to neutralize tap water chlorine, a test kit for ammonia/nitrite/nitrate/pH, and appropriate fish food. CRITICAL: cycle the tank for 2–4 weeks before adding fish to establish the beneficial bacteria that process fish waste. Skipping the cycle is the #1 cause of new fish dying.

Q: What is aquarium cycling and why does it matter?
A: The nitrogen cycle is the process where beneficial bacteria colonize your filter and convert toxic ammonia (from fish waste) into nitrites, then into less-harmful nitrates. Without it, ammonia spikes kill fish. Cycle by adding a small amount of fish food or pure ammonia daily for 2–4 weeks, testing water daily, until ammonia and nitrite both read zero and nitrates appear. Then do a large water change before adding fish.

Q: How often should I clean my fish tank?
A: Perform a 25–30% water change weekly for most tanks, vacuuming the gravel to remove waste. Clean the glass of algae every 1–2 weeks. Rinse filter media monthly in removed tank water — never under tap water, as chlorine kills the beneficial bacteria. Test water parameters weekly, especially in new tanks.

Q: What fish are best for beginners?
A: Hardy beginner-friendly fish include: bettas (solo only in most cases), guppies, platys, mollies, zebra danios, neon tetras (need groups of 6+), corydoras catfish (groups of 4+), and goldfish (in cold water). Avoid: oscars, plecos over 4", and cichlids until you have experience. Always research the adult size of fish — many "cute" small fish grow large.

Q: What water temperature do tropical fish need?
A: Most tropical fish thrive between 75–80°F (24–27°C). Cold-water fish like goldfish do best at 65–72°F. Use an aquarium thermometer daily. Sudden temperature swings of more than 2°F are dangerous and can cause ich (white spot disease).

=== REPTILES ===

Q: What does a bearded dragon need to thrive?
A: Bearded dragons need a 40-gallon tank minimum for juveniles, 120 gallons for adults. They require a thermal gradient: a basking spot of 100–110°F on one side and a cool side of 80–85°F. UVB lighting is absolutely critical — without it they develop metabolic bone disease (MBD) and die prematurely. UVB bulbs must be replaced every 6 months even if they still glow. Juveniles eat 70% live insects (dubia roaches, crickets) and 30% greens; adults reverse to 70% greens. Calcium dusting of insects is essential.

Q: What do leopard geckos need?
A: Leopard geckos need a 20-gallon tank minimum for one adult. They are nocturnal so do NOT need UVB lighting (unlike bearded dragons), but they do need an under-tank heating pad on one side to create a thermal gradient: warm side 88–92°F, cool side 75–80°F. They eat live insects only (crickets, mealworms, dubia roaches) — no vegetables. Dust insects with calcium supplement 3–4 times a week and a vitamin supplement once a week. They live 15–20+ years with proper care.

Q: What are the most common signs a reptile is sick?
A: Warning signs requiring a vet visit: closed eyes or sunken eyes, refusing food for more than 2 weeks, wheezing or crackling breathing sounds, swollen jaw or limbs, soft jaw (sign of metabolic bone disease from calcium deficiency), abnormal stool or no stool for weeks, discolored or mottled skin that is not a shed. Reptiles hide illness well — any sudden behavioral change warrants attention.

Q: What reptiles are good for beginners?
A: Best beginner reptiles: leopard geckos (calm, hardy, 20-gallon setup), bearded dragons (friendly, interactive but need larger setup and more care), corn snakes (docile, easy to feed, 40-gallon), and blue-tongued skinks. Avoid: iguanas (grow very large and can be aggressive), chameleons (extremely sensitive), and wild-caught animals (stressed, often parasitized).

=== SMALL ANIMALS ===

Q: What do guinea pigs need?
A: Guinea pigs are social animals and should be kept in pairs — a solo guinea pig will be chronically stressed. They need a spacious enclosure (minimum 7.5 sq ft per pair), unlimited timothy hay (80% of their diet), fresh leafy greens daily, and a small amount of guinea pig pellets. CRITICAL: guinea pigs cannot produce their own vitamin C and will develop scurvy without it — provide bell peppers, parsley, or a vitamin C supplement daily. Clean the cage at least twice a week. They live 5–7 years.

Q: What do hamsters need?
A: Hamsters need more space than most people think — minimum 40 gallon tank or 775 sq in floor space. Syrian hamsters are solitary and must be housed alone. They need a large solid-surface wheel (11"+ for Syrians, 8"+ for dwarfs — mesh or wire wheels injure feet), deep bedding (6"+ minimum) for burrowing, a hide, and a sand bath. Feed a mix of quality hamster pellets, occasional fresh vegetables, and high-protein treats. They are crepuscular/nocturnal — peak activity is at dusk and night.

Q: What do rabbits eat?
A: The foundation of a rabbit's diet is unlimited grass hay (timothy or orchard grass) — it should make up 80–85% of their food and is essential for gut motility. Without hay, rabbits develop GI stasis which can be fatal within 24–48 hours. Add a small amount of high-fiber pellets and 1–2 cups of leafy greens daily per 5 lbs body weight. Never feed: iceberg lettuce (near-zero nutrition), carrots (high sugar — only as occasional treats), starchy vegetables, or seeds.

Q: Do rabbits need vaccinations?
A: In the United States, rabbits do not currently have licensed vaccines available for the most common rabbit diseases. However, regular vet exams are important for catching dental disease (very common in rabbits), GI issues, and external parasites. Find an exotic vet who sees rabbits — not all standard vets have rabbit expertise.

Q: What cage size do small animals need?
A: Minimum guidelines: guinea pig pair — 7.5 sq ft floor space; Syrian hamster — 775 sq in floor space; dwarf hamster — 600 sq in; rabbit — 12 sq ft minimum with exercise time outside daily; chinchilla — multi-level cage minimum 3 sq ft per level. Bigger is always better. Wire bottom cages are dangerous for all small animals — solid bottom only to protect feet.
`;

// ─── New Pet Owner Complete Guides ───────────────────────────────
const NEW_PET_OWNER_QA = `
PETSHIWU NEW PET OWNER COMPLETE GUIDES:

Q: I am getting a puppy for the first time. What do I need?
A: Congratulations! Here is your full puppy starter checklist:
FOOD: Age-appropriate puppy food (look for AAFCO "complete and balanced for puppies" — large breed puppies need large-breed formulas)
FEEDING: Food and water bowls, slow-feeder bowl if fast eater
SHELTER: Crate (wire crates with a divider let you size-up as puppy grows), puppy playpen for safe containment
SLEEP: Puppy bed or crate mat, blanket
TRAINING: Soft puppy collar, 4–6 ft leash, puppy training treats (small, soft, high-value)
PLAY: Teething toys (rubber chew toys, rope toys, Kongs), squeaky toys, puzzle feeders
HEALTH: ID tag with your phone number, scheduled vet appointment for first exam and vaccines
GROOMING: Puppy shampoo, brush (match to coat type), nail clippers
SAFETY: Baby gates, cabinet locks, cord covers — puppy-proof your home before they arrive

Q: I am getting a kitten for the first time. What do I need?
A: Your complete kitten starter checklist:
FOOD: Kitten-formula wet and dry food (kittens need higher protein, fat, and calories than adults — never feed adult food as primary diet)
LITTER: Litter box (one per cat plus one extra is the rule), unscented clumping litter, litter scoop, litter mat
SCRATCHING: At least 2 scratching posts/pads (sisal posts are most popular) — place them next to furniture to redirect
PLAY: Wand/feather toys, crinkle balls, catnip toys, ball track toy, small stuffed mice
SHELTER: Cat bed, cat tree or perch by a window (cats love height)
FEEDING: Food and water bowls — consider a cat water fountain (cats prefer moving water and drinking from fountains greatly increases hydration)
GROOMING: Slicker brush, nail clippers, cat-safe toothbrush and toothpaste
HEALTH: Carrier for vet visits (leave it out at home so cat gets comfortable with it), ID collar and tag, vet appointment scheduled

Q: What supplies do I need for a new rabbit?
A: Rabbit starter essentials:
HOUSING: Large exercise pen or bunny-proofed room area — rabbits need space to run and binky daily
FOOD: Timothy hay (unlimited), small amount of pellets, leafy greens
LITTER: Corner litter box (rabbits naturally go in corners), paper-based litter — never clay cat litter
ENRICHMENT: Tunnels, cardboard boxes to chew, toss toys (rabbits love to throw things), hideaways
GROOMING: Slicker brush (long-haired breeds need daily brushing), nail clippers
HEALTH: Find an exotic vet before you need one — regular vets often lack rabbit expertise

Q: What do I need to set up for a pet bird?
A: Bird setup checklist:
HOUSING: Appropriately sized cage with bar spacing suited to the species
FOOD: Quality pellets (primary food), fresh vegetables, clean water changed daily
ACCESSORIES: Multiple natural wood perches of varying thickness, foraging/puzzle toys, cuttlebone, mineral block
CLEANING: Cage liner, bird-safe cage cleaner
HEALTH: Avian vet appointment — find one before an emergency arises, as avian vets are specialized

Q: How do I puppy-proof my home?
A: Room-by-room puppy safety:
LIVING ROOM: Secure power cords, remove plants toxic to dogs (poinsettia, lilies), pick up loose items at floor level that could be swallowed
KITCHEN: Lock cabinets containing cleaning products, secure trash cans, keep counter items out of reach
BATHROOM: Close toilet lids, lock medication cabinets, pick up hair ties and small items
BEDROOM: Secure electrical cords, keep shoes put away (very tempting chew targets)
OUTDOORS: Check fence for gaps, ensure pool has a cover or fence, remove toxic plants from yard. A puppy can squeeze through surprisingly small gaps — do a ground-level inspection before letting them outside unsupervised.
`;

// ─── Product Selection Guide ─────────────────────────────────────
const PRODUCT_SELECTION_QA = `
PETSHIWU PRODUCT SELECTION EXPERT GUIDE:

Q: How do I choose the right size collar for my dog?
A: Measure your dog's neck with a soft tape measure, then add 2 inches for proper fit — you should be able to slide two fingers comfortably between the collar and neck. Too tight restricts breathing; too loose means the dog can slip out. For puppies, check the fit weekly as they grow fast. Flat buckle collars for everyday wear; harnesses are better for pullers and short-nosed breeds like bulldogs and pugs.

Q: What type of dog harness is best?
A: For most dogs: a front-clip harness (D-ring on the chest) reduces pulling by redirecting the dog toward you — best for training. Y-shaped step-in harnesses are easiest to put on. For small dogs and toy breeds: a harness is strongly preferred over a collar to protect their delicate trachea. For sighthounds (greyhounds, whippets): a specially designed martingale collar or sighthound harness is needed due to their narrow heads.

Q: How do I choose the right dog bed size?
A: Measure your dog from nose to tail base, then add 8–12 inches. For dogs who curl up, a round donut/bolster bed works well. For dogs who stretch out, an orthopedic flat mat is best. For senior or arthritic dogs: a thick memory foam orthopedic bed is a significant quality-of-life improvement. Waterproof lining matters if your dog has accidents.

Q: What kind of cat litter is best?
A: Most cats strongly prefer unscented fine-grain clumping clay litter — it feels most like natural soil. Clumping makes scooping easy and controls odor effectively. Avoid heavily scented litters — cats have sensitive noses and the perfume is a top reason cats reject litter boxes. Crystal litter has excellent odor control but some cats dislike the texture. Plant-based litters (corn, wheat, wood) are eco-friendly and often dust-free — good for cats with respiratory issues.

Q: How many litter boxes do I need?
A: The rule is one box per cat plus one extra. For a one-cat home, that means two boxes. Multiple boxes matter because many cats will not use a box that already has waste in it from another cat, or will not use the same box for both urinating and defecating. Place boxes in multiple locations — never all in one room. Never place the litter box near the food bowl — cats instinctively avoid this.

Q: What size carrier do I need for my cat?
A: Your cat should be able to stand up, turn around, and lie down comfortably in the carrier. Too large can cause anxiety from too much movement inside; a snug but comfortable size feels more den-like and secure. For car travel: carriers that can be seat-belted in place are significantly safer. Leave the carrier out at home with a familiar blanket inside so your cat associates it with safety rather than only vet visits.

Q: What is the best toy for my dog's personality?
A: Match toys to your dog's drive:
- HIGH ENERGY/FETCH dogs: Rubber balls, frisbees, rope toys for tug
- CHEWERS: Durable rubber Kongs (stuffable with food), Nylabone-style chews, bully sticks — always supervise and discard when pieces become small enough to swallow
- SCENT-DRIVEN dogs: Snuffle mats, lick mats, scatter feeding — mental work tires dogs more efficiently than physical exercise alone
- ANXIOUS dogs: Comfort plush toys, calming chews, puzzle feeders
- BORED/DESTRUCTIVE dogs: Treat-dispensing toys, Kongs frozen with peanut butter (xylitol-free)

Q: How do I choose the right pet food bag size?
A: Once opened, dry kibble should be used within 4–6 weeks to maintain freshness and prevent fat rancidity — buy accordingly. Store in an airtight container, not in the original bag. For a single small dog under 15 lbs, a 5–10 lb bag typically covers 4–6 weeks. For large dogs over 50 lbs, a 30 lb bag may be appropriate. Never buy more than you can use within 6 weeks even if the price per lb is better for larger sizes.
`;

// ─── Seasonal & Travel with Pets ─────────────────────────────────
const SEASONAL_TRAVEL_QA = `
PETSHIWU SEASONAL SAFETY & TRAVEL EXPERT Q&A:

Q: How do I keep my dog safe in summer heat?
A: Dogs regulate temperature only through panting and paw pads — they overheat much faster than humans. NEVER leave a dog in a parked car, even with windows cracked — temperatures can reach 120°F within minutes. On hot days, walk in the early morning or after sunset when pavement is cooler. Test the pavement with your hand: if you cannot hold it there comfortably for 7 seconds, it will burn your dog's paws. Signs of heatstroke: heavy panting, drooling, vomiting, stumbling, collapse — this is an emergency requiring immediate vet care.

Q: What summer products does my pet need?
A: Essential summer pet supplies: paw protection wax or booties for hot pavement, a pet-safe sunscreen for short-haired dogs and pink-nosed cats, cooling mats and elevated mesh beds that allow airflow, collapsible travel water bottles, a kiddie pool for water-loving breeds, and cooling bandanas. Petshiwu carries a full summer safety collection.

Q: How do I keep my cat safe in summer?
A: Keep cats indoors during peak heat hours. Always provide fresh, cool water — cats dramatically increase hydration when offered cold water or a fountain. If your home gets hot, provide ceramic tiles for cats to lie on (they naturally cool against the surface). Never shave a double-coated cat — the coat actually insulates against heat. Watch for excessive panting — cats rarely pant; heavy panting is a heatstroke emergency.

Q: How do I protect my pet in winter?
A: Short-coated breeds, small dogs, puppies, seniors, and cats kept outdoors are vulnerable to cold. Signs of hypothermia: shivering, lethargy, stiff muscles — warm the pet gradually and call a vet. Winter essentials: a dog coat or sweater for thin-coated breeds, paw wax or booties to protect against salt and ice-melt chemicals (licking salted paws causes gastric upset), and a raised orthopedic bed away from cold floors for senior dogs. Cats left outdoors can shelter inside car engines — honk the horn before starting.

Q: What do I need for road trips or travel with my dog?
A: Travel with dogs safely:
- Crash-tested carrier or vehicle harness (an unrestrained dog becomes a dangerous projectile in a crash)
- Collapsible food and water bowls
- Enough food packed for the trip (travel stress can cause digestive upset with food changes)
- Familiar blanket or toy for comfort
- Updated ID tags and microchip registration with current phone number
- Vet records and vaccination documents (required at some boarding facilities and in some states)
- First aid kit for pets
- Never let your dog ride with their head out of the window — debris and wind can cause serious eye injuries

Q: Can I take my cat on a road trip?
A: Yes — with preparation. Keep your cat in a secure, ventilated carrier attached with a seatbelt. Cover the carrier with a light blanket to reduce visual stimulation and anxiety. Offer water at rest stops but do not leave a food bowl inside during driving (motion sickness). Bring portable litter. For cats with severe travel anxiety, ask your vet about anti-nausea medication or a calming supplement for the trip.

Q: What are holiday hazards for pets?
A: CHRISTMAS: Poinsettias, holly, mistletoe, and lilies are toxic to cats and dogs. Tinsel ingestion can cause life-threatening intestinal obstruction in cats. Christmas lights and electrical cords are chewing hazards.
HALLOWEEN: Chocolate and xylitol-containing candy are toxic. Keep candy completely out of reach.
THANKSGIVING: Turkey bones are dangerous. Onions, garlic, grapes, raisins, and alcohol are toxic.
NEW YEAR: Fireworks cause extreme anxiety in most pets — keep them indoors, close windows, turn on TV/music to muffle sounds. More pets go missing on July 4th and New Year's than any other days — ensure ID tags and microchip are current.
`;

// ─── Training & Enrichment Guide ─────────────────────────────────
const TRAINING_QA = `
PETSHIWU TRAINING & ENRICHMENT EXPERT Q&A:

Q: How do I crate train a puppy?
A: Crate training done right makes the crate your puppy's safe happy den — not a punishment. Start with short positive sessions: toss treats inside, feed meals in the crate, gradually close the door for a few minutes while you are present. Never use the crate as punishment. A puppy can typically hold their bladder one hour per month of age, so a 2-month-old puppy needs a potty break every 2 hours. A properly crate-trained dog happily enters voluntarily and sleeps calmly through the night within 1–2 weeks.

Q: How do I potty train my puppy?
A: Take your puppy outside immediately after: waking up, eating, playing, and every 2 hours minimum. Always go to the same spot — the familiar smell triggers them. The moment they finish, immediately praise and give a treat. Never punish accidents inside — they happened because you were not watching closely enough. Puppies are typically reliably house-trained by 4–6 months. Accidents late in training often mean the schedule needs to be tighter, not that the puppy is misbehaving.

Q: How do I stop my puppy biting?
A: When your puppy bites during play, immediately make a sharp yelp sound and stop all play for 20–30 seconds. If biting continues, end the play session entirely by leaving the room. This teaches bite inhibition — the same way litter mates communicate. Always redirect to an appropriate chew toy before the biting starts. Frozen rubber toys are especially soothing during the teething phase (3–6 months). Never play wrestle with puppies using your bare hands — it teaches them hands are toys.

Q: What mental enrichment does my dog need?
A: Mental exercise tires dogs more effectively than physical exercise alone, and it reduces destructive behavior dramatically. Include daily: 5 minutes of training (sit, stay, down, leave it), scatter feeding in grass or snuffle mat instead of a regular bowl, a Kong stuffed and frozen with food, nose work games (hide treats and let the dog find them), and at least one new experience per week (new walking route, new smell, new object). A mentally challenged dog is a calm dog.

Q: How do I teach my cat to use a scratching post?
A: Place the post right next to the furniture they currently scratch — not in a corner. The post must be tall enough for a full stretch (at least 28–32" for adults). Sisal fabric is the most attractive texture. Sprinkle catnip on the post, dangle a toy near the top, and use positive reinforcement (praise, treats) whenever they use it. Apply double-sided tape to the furniture surface they target — they will redirect to the post on their own within days.

Q: How do I train my dog to walk politely on a leash?
A: The key rule: the moment the leash goes tight, you stop walking — completely. No forward movement with a tight leash, ever. When the leash is loose, immediately mark with "yes" and continue forward. Front-clip harnesses and head halters make this process much faster. 15 minutes of focused loose-leash practice every day produces dramatic improvement within 2–3 weeks. Reward your dog lavishly for check-ins (when they look up at you voluntarily during a walk).
`;

// ─── Platform & Customer Service Knowledge ───────────────────────
const COMPANY_POLICIES = `
PETSHIWU PLATFORM — COMPLETE KNOWLEDGE BASE

=== COMPANY ===
- Name: Petshiwu | Website: petshiwu.com
- Address: 37-68 74th Street, Jackson Heights, Queens, NY 11372
- Phone: +1 (800) 259-2605 | Email: support@petshiwu.com
- Support hours: 7 days a week, 9 AM – 8 PM EST
- 10,000+ products for dogs, cats, birds, fish, reptiles, and small animals
- Top brands: Hill's Science Diet, Royal Canin, Purina Pro Plan, Blue Buffalo, Wellness, Orijen, Acana, Taste of the Wild

=== SHIPPING ===
- FREE shipping automatically applied on all orders over $49 — no code needed
- NYC (Queens, Brooklyn, Manhattan, Bronx, Staten Island): 1–2 business day delivery
- Same-day delivery: Select Queens neighborhoods (Jackson Heights, Elmhurst, Flushing, Astoria) — order by 12 PM EST
- Nationwide standard shipping: 3–7 business days
- Tracking number emailed immediately after shipment
- USA only — no international shipping

=== PRICING & PAYMENTS ===
- All prices in USD
- Accepted: Visa, Mastercard, American Express, Discover, PayPal, Apple Pay, Google Pay
- All transactions SSL-encrypted and secure

=== ORDERS ===
- Guest checkout available — no account required to order
- Order confirmation email sent immediately
- Changes or cancellations: Within 1 hour of placing order — call/email support immediately
- Track orders: petshiwu.com/track-order or My Orders in account
- Order history: Available under My Orders when logged in

=== RETURNS & REFUNDS ===
- 30-day return window from delivery date
- Pet food guarantee: Return refused food, no questions asked
- How to return: petshiwu.com/returns — enter order number, select items
- Refund: Back to original payment method within 5–7 business days
- Return shipping: FREE for damaged, defective, or wrong items; customer pays for change-of-mind returns
- Exchanges: Available — note preferred exchange item when starting a return

=== ACCOUNTS & PET PROFILES ===
- Free account: Sign up in 30 seconds at petshiwu.com — enables order tracking, wishlist, pet profiles, faster checkout
- Pet Passport: Save pet name, birthday, species, breed, allergies — unlocks personalized recs and birthday gifts
- Multiple pets: Yes, unlimited pet profiles per account
- Forgot password: Use Forgot Password link on login page — reset link sent to email

=== DISCOUNTS & PROMOS ===
- First-order 10% off: Sign up for newsletter at petshiwu.com homepage — code emailed instantly
- Birthday discount: Code BDAYGIFT — 15% off entire order on pet's birthday (auto-notified when birthday saved in profile)
- How to apply a code: Enter in Coupon Code box at checkout before payment, click Apply
- Deals section: petshiwu.com/products?featured=true

=== WISHLIST, COMPARISON & ALERTS ===
- Wishlist: Heart icon on any product → saved at petshiwu.com/favorites; shareable link available
- Product comparison: Compare up to 4 products at petshiwu.com/compare
- Stock alerts: "Notify Me" on any out-of-stock product → email when back in stock (manage at petshiwu.com/stock-alerts)

=== DONATIONS ===
- Donate pet food & supplies to NYC animal shelters: petshiwu.com/donate
- All donations go directly to NYC shelter animals
`;

// ─── Customer Service Q&A ─────────────────────────────────────────
const CUSTOMER_SERVICE_QA = `
PETSHIWU CUSTOMER SERVICE EXPERT Q&A:

Q: How do I place an order?
A: Browse our 10,000+ products, add items to your cart, and check out as a guest or with a free account. We accept all major credit cards, PayPal, Apple Pay, and Google Pay. You'll receive a confirmation email the moment your order is placed.

Q: Do I need an account to order?
A: No — guest checkout is available. But a free account at petshiwu.com gives you order tracking, saved pet profiles, wishlist access, personalized recommendations, and member deals. It takes 30 seconds to create.

Q: How do I track my order?
A: Check petshiwu.com/track-order or log in and go to My Orders. Your tracking number is emailed as soon as your order ships. NYC orders arrive in 1–2 business days; nationwide takes 3–7 business days.

Q: Do you offer free shipping?
A: Yes — all orders over $49 ship free automatically, no code needed. NYC customers get fast 1–2 day delivery. Same-day delivery is available in select Queens neighborhoods (Jackson Heights, Elmhurst, Flushing, Astoria) for orders before 12 PM.

Q: How do I return something?
A: Go to petshiwu.com/returns within 30 days of delivery, enter your order number, and select the items to return. Refunds go back to your original payment method in 5–7 business days. If your pet simply refuses to eat a food — return it, no questions asked.

Q: My pet refuses to eat the food I ordered. Can I return it?
A: Absolutely yes. Our pet food satisfaction guarantee covers refused food. Go to petshiwu.com/returns, pick "My pet won't eat it" as the reason, and we'll refund you in full. We stand completely behind our products.

Q: How do I cancel or change my order?
A: Contact us within 1 hour of placing your order — call +1 (800) 259-2605 or email support@petshiwu.com. After 1 hour the order may already be in processing, but you can always return it for free after delivery.

Q: What payment methods do you accept?
A: Visa, Mastercard, American Express, Discover, PayPal, Apple Pay, and Google Pay. All transactions are SSL-encrypted.

Q: How do I use a discount code?
A: Enter your code in the Coupon Code box at checkout, before the payment step. Click Apply — the discount shows in your total before you pay. Newsletter signup gives 10% off your first order; code BDAYGIFT gives 15% off on your pet's birthday.

Q: How do I get the 10% first-order discount?
A: Sign up for our newsletter at the bottom of petshiwu.com. Your 10% off code is emailed to you immediately and applies to your first order.

Q: What is the birthday gift program?
A: Save your pet's birthday in their profile under My Account → Pet Passport. On their birthday we'll notify you with code BDAYGIFT for 15% off your entire order — and we may even send a small gift for your pet. We celebrate every pet's birthday 🎂🐾

Q: How do I save my pet's profile?
A: Log in → go to My Account → Pet Passport. Save your pet's name, birthday, species, breed, and allergies. You can save multiple pets. This powers personalized product recommendations and birthday gifts.

Q: An item I want is out of stock. What should I do?
A: Click "Notify Me" on the product page. We'll email you the moment it's back in stock. You can manage all your stock alerts at petshiwu.com/stock-alerts.

Q: Can I compare products before buying?
A: Yes — click the Compare icon on any product and compare up to 4 products side by side at petshiwu.com/compare. Especially useful for choosing between pet food formulas or different brands.

Q: How does the wishlist work?
A: Click the heart icon on any product to save it. Your wishlist lives at petshiwu.com/favorites. You can generate a shareable link — great for family or friends buying your pet a gift.

Q: How do I contact customer support?
A: Phone: +1 (800) 259-2605 (7 days/week, 9 AM–8 PM EST). Email: support@petshiwu.com (response within 2 business hours). Or use the Contact form at petshiwu.com/contact. We're real people who love pets and are happy to help.

Q: Where is Petshiwu located?
A: Jackson Heights, Queens, New York — 37-68 74th Street, NY 11372. We're proud to be a Queens-based pet store serving all of NYC and shipping nationwide.

Q: Do you ship outside the USA?
A: Not at this time. We ship within the USA only — all 50 states.

Q: Can I leave a product review?
A: Yes — after your order is delivered you'll get an email inviting you to review your products. You can also visit any product page while logged in to leave a rating and review. Your reviews help other pet parents make better choices.

Q: Do you offer subscriptions or auto-ship?
A: Not currently. You can quickly reorder from your order history in My Orders, or keep your pet's food saved in your wishlist for one-click reordering.

Q: How do I donate to animal shelters?
A: Visit petshiwu.com/donate to donate pet food and supplies to our NYC shelter partners. Every item donated goes directly to animals at NYC shelters who need food and care.

Q: What if my order arrives damaged?
A: Contact us within 48 hours with a photo of the damage — phone +1 (800) 259-2605 or email support@petshiwu.com. We'll send a free replacement or issue a full refund immediately, no questions asked.

Q: What if I received the wrong item?
A: Contact us right away at +1 (800) 259-2605 or support@petshiwu.com. We'll ship the correct item with free expedited shipping and arrange free pickup of the wrong item at no inconvenience to you.

Q: Is my personal information secure?
A: Yes. We use SSL encryption on all transactions, never sell your personal data to third parties, and follow strict privacy practices. Full details at petshiwu.com/privacy.
`;

// ─── System Prompt Builder ────────────────────────────────────────
const buildSystemPrompt = (inventorySnippet: string, profileAlreadySaved: boolean, savedPets?: any[]): string => `
You are Petshiwu's Super AI Advisor — the ultimate expert for petshiwu.com, a premium US pet e-commerce store.

${profileAlreadySaved && savedPets && savedPets.length > 0 ? `
IMPORTANT — CUSTOMER PET PROFILES ON FILE (DO NOT ASK FOR THIS INFO):
The customer has ${savedPets.length} pet${savedPets.length > 1 ? 's' : ''} saved in their account:
${savedPets.map((p: any, i: number) => {
  const age = p.birthday ? (() => {
    const born = new Date(p.birthday);
    const now = new Date();
    const yrs = now.getFullYear() - born.getFullYear();
    const adj = now < new Date(now.getFullYear(), born.getMonth(), born.getDate()) ? -1 : 0;
    const total = yrs + adj;
    return total < 1 ? 'under 1 year' : `${total} year${total !== 1 ? 's' : ''} old`;
  })() : null;
  const allergens = p.allergies?.length ? `allergic to: ${p.allergies.join(', ')}` : null;
  const parts = [p.species, p.breed, age, p.sex, allergens].filter(Boolean).join(', ');
  return `  ${i + 1}. ${p.petName}${parts ? ` (${parts})` : ''}`;
}).join('\n')}

RULES:
- NEVER ask for pet name, birthday, species, or breed — you already have all of this.
- Use their pet's name naturally in your responses.
- Reference their pet's specific species/breed/allergies when making recommendations.
- If they mention "my pet" or "my dog/cat", use the saved pet's name.
` : profileAlreadySaved ? `
IMPORTANT — CUSTOMER PROFILE ALREADY SAVED:
The customer's pet name and birthday are already on file.
DO NOT ask for pet name or birthday — go straight to helping with their request.
` : `
MISSION #1: DATA COLLECTION (FIRST MESSAGE ONLY)
- On your very first response, ask for the pet's name and birthday once, then answer their question.
- Example: "Hi! I'd love to help. What's your pet's name and birthday? We'd love to send them a birthday gift 🎂🐾 — but first, here's what I found for you:"
- Once collected, never ask again.
`}

MISSION #2: EXPERT ADVICE (CATS & DOGS)
- Provide breed-specific health tips immediately when a breed is mentioned.
- Explain the "why" behind ingredients (e.g., "DHA supports kitten brain development").
- Calculate daily calories when the user provides weight and activity level.
- Guide by life stage: puppy, kitten, adult, senior.
- Always recommend consulting a vet for serious health concerns.

MISSION #3: REAL PRODUCT EXPERTISE
- Use the inventory below to recommend real products with accurate prices.
- For products not in the snippet, use [SEARCH:search term] to find them.

BREED & HEALTH DATA:
${BREED_HEALTH_DATABASE}

NUTRITION SCIENCE:
${NUTRITION_LOGIC}

PETSHIWU EXPERT NUTRITION Q&A:
${NUTRITION_QA}

PETSHIWU EXPERT HEALTH Q&A:
${HEALTH_QA}

PETSHIWU EXPERT BEHAVIOR Q&A:
${BEHAVIOR_QA}

PETSHIWU EXPERT GROOMING Q&A:
${GROOMING_QA}

PETSHIWU EXPERT TOYS & ACCESSORIES Q&A:
${TOYS_QA}

PETSHIWU EXPERT GUIDE — BIRDS, FISH, REPTILES & SMALL ANIMALS:
${OTHER_SPECIES_QA}

PETSHIWU NEW PET OWNER COMPLETE GUIDES:
${NEW_PET_OWNER_QA}

PETSHIWU PRODUCT SELECTION EXPERT GUIDE:
${PRODUCT_SELECTION_QA}

PETSHIWU SEASONAL SAFETY & TRAVEL GUIDE:
${SEASONAL_TRAVEL_QA}

PETSHIWU TRAINING & ENRICHMENT GUIDE:
${TRAINING_QA}

BIRTHDAY PROGRAM:
${BIRTHDAY_PROGRAM_INFO}

PETSHIWU CUSTOMER SERVICE & PLATFORM Q&A:
${CUSTOMER_SERVICE_QA}

HEALTH TO PRODUCT MAPPING:
- Itchy skin / allergies -> Sensitive skin food, omega supplements, hypoallergenic treats
- Digestive issues -> Sensitive stomach food, probiotics, digestive supplements
- Joint pain / arthritis -> Joint supplements, glucosamine, orthopedic beds
- Anxiety / stress -> Calming treats, anxiety wraps, pheromone diffusers
- Dental problems -> Dental chews, water additives, toothbrushes
- Weight issues -> Weight management food, low-calorie treats
- Dull coat -> Omega-3 supplements, grooming tools
- Low energy -> High-protein food, energy supplements
- Excessive shedding -> De-shedding tools, supplements, shampoos
- Urinary issues -> Urinary health food, wet food, pH-balanced formulas
- Heart health -> Taurine supplements, heart health food
- Kidney health -> Low phosphorus wet food, kidney support supplements
- New puppy/kitten -> Starter food, training treats, beds, toys, crates
- Hairballs -> Hairball control food, grooming tools, hairball remedy gel
- Overweight -> Weight management food, puzzle feeders, low-calorie treats

CURRENT INVENTORY SNAPSHOT (real products with prices):
${inventorySnippet}

${COMPANY_POLICIES}

CONVERSATION STYLE:
- Expert, empathetic, and proactive
- If a breed is mentioned, IMMEDIATELY give a breed-specific health tip
- If weight and activity level given, calculate and share daily calorie needs
- Keep responses concise (4-6 sentences max)
- Use pet emojis occasionally 🐾🐕🐈
- All advice and knowledge is from Petshiwu's expert team — never reference competitors

PRODUCT RULES — CRITICAL:
- For ANY question about products, brands, food, treats, toys, or supplies → ALWAYS end with [SEARCH:query]
- This is MANDATORY for every product-related question — even if the product is in the snapshot above
- The [SEARCH:] tag surfaces real, buyable products from our live 10,000+ inventory for the customer
- Only ONE [SEARCH:] tag per response, placed at the very end before any closing sentence
- Pick the most specific query possible: e.g. [SEARCH:grain-free cat food] not just [SEARCH:cat food]
- If the question is about health/behavior only (no product needed), skip the search tag
- Do NOT invent product names or prices`;

// ─── Types ────────────────────────────────────────────────────────
interface ChatMessage {
  role: 'user' | 'assistant';
  text: string;
}

// ✅ FIX: Added petType (was causing TS2339 build error at line 530)
interface PetContext {
  birthday?: string;
  petName?: string;
  parentName?: string;
  parentEmail?: string;
  petType?: string;   // ← ADDED: fixes "Property 'petType' does not exist on type 'PetContext'"
}

// ✅ NEW: Profile sent from frontend localStorage (one-time collection)
interface PetProfile {
  petName: string;
  petBirthday: string;   // "YYYY-MM-DD"
  ownerEmail: string;
}

// ─── Helpers ──────────────────────────────────────────────────────
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 1000;
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const isBirthdayToday = (birthday: string): boolean => {
  try {
    const today = new Date();
    const bday = new Date(birthday);
    return today.getMonth() === bday.getMonth() && today.getDate() === bday.getDate();
  } catch {
    return false;
  }
};

// ─── Birthday Email ───────────────────────────────────────────────
const buildBirthdayEmailHtml = (petName: string, parentName: string): string => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Happy Birthday ${petName}!</title>
</head>
<body style="margin:0;padding:0;background-color:#f9f5f0;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f9f5f0;padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
          <tr>
            <td align="center" style="background:linear-gradient(135deg,#1a3c5e 0%,#2d6a9f 100%);padding:40px 40px 30px;">
              <p style="margin:0;font-size:48px;">🎂🐾</p>
              <h1 style="margin:16px 0 8px;color:#ffffff;font-size:32px;font-weight:700;">Happy Birthday, ${petName}!</h1>
              <p style="margin:0;color:#a8d4f5;font-size:16px;">A special day deserves a special gift</p>
            </td>
          </tr>
          <tr>
            <td style="padding:40px;">
              <p style="margin:0 0 20px;color:#374151;font-size:16px;line-height:1.7;">Hi <strong>${parentName}</strong>,</p>
              <p style="margin:0 0 20px;color:#374151;font-size:16px;line-height:1.7;">
                Today is a very special day — it's <strong>${petName}'s birthday!</strong> 🎉
                We want to help you celebrate with a special surprise.
              </p>
              <table width="100%" cellpadding="0" cellspacing="0" style="background:linear-gradient(135deg,#fff8e1,#fff3cd);border:2px dashed #f59e0b;border-radius:12px;margin-bottom:28px;">
                <tr>
                  <td align="center" style="padding:28px;">
                    <p style="margin:0 0 8px;font-size:36px;">🎁</p>
                    <h2 style="margin:0 0 8px;color:#92400e;font-size:20px;font-weight:700;">Your Birthday Gift</h2>
                    <p style="margin:0 0 16px;color:#78350f;font-size:15px;">A FREE birthday gift with your next order — from us to your furry friend!</p>
                    <div style="background:#ffffff;border-radius:8px;padding:12px 24px;display:inline-block;">
                      <p style="margin:0;color:#6b7280;font-size:13px;font-weight:600;letter-spacing:1px;text-transform:uppercase;">Use code at checkout</p>
                      <p style="margin:4px 0 0;color:#1a3c5e;font-size:28px;font-weight:800;letter-spacing:4px;">BDAYGIFT</p>
                    </div>
                  </td>
                </tr>
              </table>
              <h3 style="margin:0 0 16px;color:#1a3c5e;font-size:17px;font-weight:700;">How to redeem:</h3>
              <p style="margin:0 0 8px;color:#374151;font-size:15px;">1. Visit <a href="https://www.petshiwu.com" style="color:#2d6a9f;font-weight:600;">petshiwu.com</a></p>
              <p style="margin:0 0 8px;color:#374151;font-size:15px;">2. Add ${petName}'s favorite treat to your cart</p>
              <p style="margin:0 0 28px;color:#374151;font-size:15px;">3. Enter code <strong style="color:#1a3c5e;">BDAYGIFT</strong> at checkout</p>
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:32px;">
                <tr>
                  <td align="center">
                    <a href="https://www.petshiwu.com/products?category=treats"
                       style="display:inline-block;background:linear-gradient(135deg,#1a3c5e,#2d6a9f);color:#ffffff;font-size:16px;font-weight:700;text-decoration:none;padding:16px 40px;border-radius:50px;">
                      🛍️ Shop Birthday Gifts
                    </a>
                  </td>
                </tr>
              </table>
              <p style="margin:0;color:#374151;font-size:16px;line-height:1.7;">
                Wishing you and <strong>${petName}</strong> a day filled with cuddles, belly rubs, and treats! 🐾<br><br>
                Warmly,<br><strong>The Petshiwu Team</strong>
              </p>
            </td>
          </tr>
          <tr>
            <td style="background:#f3f4f6;padding:24px 40px;text-align:center;">
              <p style="margin:0;color:#9ca3af;font-size:13px;">© ${new Date().getFullYear()} Petshiwu · <a href="https://www.petshiwu.com" style="color:#6b7280;">petshiwu.com</a></p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

const sendBirthdayEmail = async (petName: string, parentName: string, parentEmail: string): Promise<void> => {
  try {
    const resendApiKey = process.env.RESEND_API_KEY;
    if (!resendApiKey) { console.warn('RESEND_API_KEY not set — birthday email skipped'); return; }
    const resend = new Resend(resendApiKey);
    await resend.emails.send({
      from: process.env.RESEND_FROM || 'Petshiwu <hello@petshiwu.com>',
      to: parentEmail,
      subject: `Happy Birthday, ${petName}! 🎂 A special gift is waiting!`,
      html: buildBirthdayEmailHtml(petName, parentName)
    });
    console.log(`🎂 Birthday email sent for ${petName} to ${parentEmail}`);
  } catch (error) {
    console.error('Birthday email error:', error);
  }
};

// ─── Main Controller ──────────────────────────────────────────────
export const getAIAdvice = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    // ✅ Now also accepts petProfile from frontend localStorage
    const { messages, userMessage, petContext, petProfile } = req.body as {
      messages: ChatMessage[];
      userMessage: string;
      petContext: PetContext;
      petProfile?: PetProfile;   // ← NEW: sent from AIPetAdvisor.tsx
    };

    if (!userMessage) {
      res.status(400).json({ success: false, message: 'User message is required' });
      return;
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      res.status(500).json({ success: false, message: 'AI service not configured' });
      return;
    }

    // ── Load authenticated user's saved pets from MongoDB ─────────
    let savedPets: any[] = [];
    try {
      const token = req.cookies?.frontend_token || (req.headers.authorization?.split(' ')[1]);
      if (token) {
        const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as { id: string };
        if (decoded?.id) {
          const user = await User.findById(decoded.id).select('pets');
          if (user?.pets && (user.pets as any[]).length > 0) {
            savedPets = user.pets as any[];
          }
        }
      }
    } catch { /* non-fatal — unauthenticated users just get the data-collection flow */ }

    // ✅ Merge sources: MongoDB pets > frontend petProfile > petContext
    const primaryPet = savedPets[0];
    const mergedPetName = primaryPet?.petName || petContext?.petName || petProfile?.petName;
    const mergedBirthday = primaryPet?.birthday || petContext?.birthday || petProfile?.petBirthday;
    const mergedEmail = petContext?.parentEmail || petProfile?.ownerEmail;

    const hasData = !!(mergedPetName && mergedBirthday);

    // profileAlreadySaved = true → skip data collection prompt entirely
    const profileAlreadySaved = savedPets.length > 0 || !!(petProfile?.petName && petProfile?.petBirthday);

    const birthdayCelebration = mergedBirthday ? isBirthdayToday(mergedBirthday) : false;

    if (birthdayCelebration && mergedEmail && mergedPetName) {
      sendBirthdayEmail(
        mergedPetName,
        petContext?.parentName || 'Pet Parent',
        mergedEmail
      );
    }

    // ── Persist pet data to MongoDB if user is authenticated ──────
    if (mergedPetName && mergedBirthday) {
      try {
        const token = req.cookies?.frontend_token || (req.headers.authorization?.split(' ')[1]);
        if (token) {
          const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as { id: string };
          if (decoded?.id) {
            const user = await User.findById(decoded.id);
            if (user) {
              const bDate = new Date(mergedBirthday);
              const mm = String(bDate.getMonth() + 1).padStart(2, '0');
              const dd = String(bDate.getDate()).padStart(2, '0');
              const birthdayMMDD = `${mm}-${dd}`;

              const existingPet = (user.pets || []).find(
                (p: any) => p.petName.toLowerCase() === mergedPetName.toLowerCase()
              );
              if (!existingPet) {
                user.pets = user.pets || [];
                (user.pets as any[]).push({
                  petName: mergedPetName,
                  birthday: mergedBirthday,
                  birthdayMMDD,
                  // ✅ petType now valid — it's in PetContext interface
                  species: petContext?.petType || undefined,
                });
                await user.save();
                console.log(`🐾 Saved pet "${mergedPetName}" for user ${(user as any).email}`);
              } else if (existingPet.birthdayMMDD !== birthdayMMDD) {
                existingPet.birthday = mergedBirthday;
                existingPet.birthdayMMDD = birthdayMMDD;
                await user.save();
              }
            }
          }
        }
      } catch (_err) {
        // Non-fatal — don't block the AI response
      }
    }

    // ── Inventory snapshot ────────────────────────────────────────
    let inventorySnippet = 'Inventory temporarily unavailable — use [SEARCH:] for product lookups.';
    try {
      const featuredProducts = await Product.find({ isActive: true, stock: { $gt: 0 } })
        .sort({ featured: -1, sold: -1 })
        .select('name price salePrice brand category')
        .limit(50)
        .lean() as unknown as Array<{ name: string; price: number; salePrice?: number; brand?: string; category?: string }>;

      if (featuredProducts.length > 0) {
        inventorySnippet = featuredProducts.map(p => {
          const displayPrice = p.salePrice && p.salePrice < p.price
            ? `$${p.salePrice.toFixed(2)} (was $${p.price.toFixed(2)})`
            : `$${p.price.toFixed(2)}`;
          const meta = [p.brand, p.category].filter(Boolean).join(' · ');
          return `- ${p.name}: ${displayPrice}${meta ? ` [${meta}]` : ''}`;
        }).join('\n');
      }
    } catch (inventoryError) {
      console.error('Inventory fetch error:', inventoryError);
    }

    // ✅ Pass savedPets so system prompt includes full pet profiles for logged-in users
    const systemPrompt = buildSystemPrompt(inventorySnippet, profileAlreadySaved, savedPets);

    const history = (messages || []).map((m: ChatMessage) => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.text }]
    }));

    const contextParts: string[] = [];

    if (mergedPetName || mergedBirthday || petContext?.petType) {
      const ctx: Record<string, string> = {};
      if (mergedPetName) ctx.petName = mergedPetName;
      if (mergedBirthday) ctx.birthday = mergedBirthday;
      if (petContext?.petType) ctx.petType = petContext.petType;
      if (petContext?.parentName) ctx.parentName = petContext.parentName;
      const contextStr = Object.entries(ctx).map(([k, v]) => `${k}: ${v}`).join(', ');
      if (contextStr) contextParts.push(`[Pet info: ${contextStr}]`);
    }

    if (hasData) {
      contextParts.push(`[DATA ALREADY COLLECTED: Pet name and birthday on file. Skip data collection and provide expert advice directly.]`);
    }

    if (birthdayCelebration) {
      contextParts.push(`[IMPORTANT: Today is ${mergedPetName}'s birthday! Start with an enthusiastic birthday celebration and mention code BDAYGIFT for a free birthday gift.]`);
    }

    const enrichedMessage = contextParts.length > 0
      ? `${contextParts.join(' ')} ${userMessage}`
      : userMessage;

    const body = {
      system_instruction: { parts: [{ text: systemPrompt }] },
      contents: history.concat([{ role: 'user', parts: [{ text: enrichedMessage }] }]),
      generationConfig: { temperature: 0.6, maxOutputTokens: 500, topP: 0.8 }
    };

    let geminiRes: globalThis.Response | null = null;
    let lastError = '';

    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      geminiRes = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      if (geminiRes.ok) break;

      lastError = await geminiRes.text();
      console.error(`Gemini API error (attempt ${attempt}/${MAX_RETRIES}):`, lastError);

      if (geminiRes.status !== 503 || attempt === MAX_RETRIES) break;

      await sleep(RETRY_DELAY_MS * attempt);
    }

    if (!geminiRes || !geminiRes.ok) {
      console.error('Gemini API failed after retries:', lastError);
      res.status(500).json({ success: false, message: 'AI service temporarily unavailable' });
      return;
    }

    const responseData = await geminiRes.json() as {
      candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>
    };

    const fullText = responseData.candidates?.[0]?.content?.parts?.[0]?.text
      ?? "I'm having trouble responding right now. Please try again!";

    const searchMatch = fullText.match(/\[SEARCH:(.*?)\]/);
    let replyText = fullText;
    let products: Record<string, unknown>[] = [];

    if (searchMatch) {
      const searchQuery = searchMatch[1].trim();
      replyText = fullText.replace(/\[SEARCH:.*?\]/, '').trim();
      try {
        const foundProducts = await Product.find({
          $or: [
            { name: { $regex: searchQuery, $options: 'i' } },
            { brand: { $regex: searchQuery, $options: 'i' } },
            { category: { $regex: searchQuery, $options: 'i' } },
            { tags: { $in: [new RegExp(searchQuery, 'i')] } },
            { description: { $regex: searchQuery, $options: 'i' } }
          ],
          isActive: true,
          stock: { $gt: 0 }
        })
          .select('name price salePrice images slug brand category')
          .sort({ featured: -1, sold: -1 })
          .limit(6)
          .lean() as Record<string, unknown>[];
        products = foundProducts;
      } catch (searchError) {
        console.error('Product search error:', searchError);
      }
    }

    res.status(200).json({
      success: true,
      data: { reply: replyText, products, birthdayCelebration, requireData: !hasData }
    });

  } catch (error) {
    console.error('AI Advisor error:', error);
    next(error);
  }
};
