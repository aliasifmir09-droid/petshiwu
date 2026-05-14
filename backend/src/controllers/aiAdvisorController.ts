// ================================================================
// FILE: backend/src/controllers/aiAdvisorController.ts
// CHANGES FROM YOUR ORIGINAL:
//  1. Massively expanded NUTRITION_QA, HEALTH_QA, BEHAVIOR_QA,
//     GROOMING_QA — all sourced from expert pet research,
//     competitor names removed, all branded as PetShiwu knowledge
//  2. Everything else (Gemini, MongoDB, Resend, birthday emails,
//     product search, retry logic) is UNCHANGED
// ================================================================

import { Request, Response, NextFunction } from 'express';
import Product from '../models/Product';
import User from '../models/User';
import { Resend } from 'resend';
import jwt from 'jsonwebtoken';

const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent';

// ─── Breed Health Database (unchanged from your original) ─────────
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

// ─── Nutrition Logic (unchanged from your original) ───────────────
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

// ─── NEW: Expanded Nutrition Q&A ──────────────────────────────────
const NUTRITION_QA = `
PETSHIWU NUTRITION EXPERT Q&A:

Q: How do I choose quality pet food?
A: Look for AAFCO-approved food with real meat listed as the first ingredient. Dogs require 40 essential nutrients in their diet while cats require 42 — a complete, balanced formula covers all of these. At PetShiwu we recommend foods free of artificial preservatives, unnecessary fillers, and artificial dyes. Our expert-curated brands like Hill's Science Diet, Royal Canin, Purina, and Blue Buffalo meet these standards.

Q: How do I switch my pet to a new food?
A: Transition dogs over 7–10 days by gradually mixing increasing amounts of new food with the old. Cats need a longer transition of 2–4 weeks because sudden changes can cause them to refuse food entirely — which can quickly become a medical emergency. Start with 25% new food and increase slowly. If digestive upset occurs, slow the transition down further.

Q: How much should I feed my dog per day?
A: Adult dogs generally do best with 2 meals per day. Portions depend on weight and activity level: approximately 1–1.5 cups for small dogs under 20 lbs, 2–3 cups for medium dogs 20–50 lbs, and 3–4 or more cups for large dogs over 50 lbs. Always follow the AAFCO-approved feeding guidelines printed on the food packaging. Active or working dogs need more calories than sedentary ones.

Q: How often should I feed my cat?
A: Adult cats do well with 2 measured meals per day. Kittens need 3–4 smaller meals daily due to their high energy demands for growth. Avoid free-feeding (leaving food out all day) for most adult cats as it significantly contributes to obesity — over 60% of cats in the USA are currently overweight. Your vet can calculate precise daily calorie targets for your cat.

Q: Are pet vitamins and supplements necessary?
A: If your pet eats a complete and balanced commercial diet, additional vitamin and mineral supplements are generally not necessary and could even cause imbalances. However targeted supplements do help in specific situations: omega-3 fish oil improves skin and coat health, probiotics aid digestive health, glucosamine and chondroitin support aging joints, and L-carnitine assists with weight management. Always consult your vet before adding any supplement. PetShiwu carries a full range of vet-trusted supplements.

Q: What everyday foods are toxic to dogs?
A: Several common foods are toxic to dogs: chocolate, grapes and raisins, xylitol (an artificial sweetener found in gum and peanut butter), onions, garlic, avocado, macadamia nuts, alcohol, caffeine, and cooked bones. Even small amounts of xylitol or grapes can cause kidney failure or death. If your dog ingests any of these, contact a vet or the ASPCA Poison Control Hotline immediately.

Q: What everyday foods are toxic to cats?
A: Cats are highly sensitive to: onions, garlic, chocolate, caffeine, alcohol, grapes, raisins, xylitol, raw bread dough, and dairy products (most adult cats are lactose intolerant). Even tiny amounts of onion or garlic can cause dangerous anemia in cats. Never substitute dog food as a primary cat diet — cats require taurine which dog food doesn't provide in sufficient amounts.

Q: What is the difference between puppy food and adult food?
A: Puppies and kittens need calorie-dense formulas that are higher in protein, fat, calcium, and key developmental nutrients like DHA for brain and eye development. Large breed puppies specifically require controlled-growth formulas to reduce the risk of joint and bone problems later in life. Feeding adult food to a puppy as their primary diet can cause nutrient deficiencies and developmental issues.

Q: Is grain-free food better for my pet?
A: Grain-free diets are not required or superior for most pets unless a grain allergy has been specifically diagnosed by a vet. Research has linked certain grain-free diets to dilated cardiomyopathy (DCM) heart disease in dogs — particularly formulas high in legumes. For cats, grain-free is more aligned with their carnivore biology but protein source and overall quality matter most. Always consult your vet before switching to grain-free.

Q: How do I know if my pet's food isn't working?
A: Signs that a food may not suit your pet include a dull or dry coat, low energy or lethargy, unexplained weight gain or loss, digestive issues like chronic gas or loose stools, and skin itching or irritation. If you notice these signs, consider a formula designed for your pet's specific needs — such as sensitive skin, digestive health, or weight management. PetShiwu carries solution-oriented formulas for all these concerns.

Q: Should I feed my pet wet food or dry food?
A: Both have merits and many pet owners combine them. Dry kibble supports dental health and is more calorie-dense. Wet food provides hydration which is especially important for cats — who naturally have low thirst drive — and for pets with urinary or kidney issues. For cats prone to urinary problems, a wet food diet or combination is strongly recommended by vets.
`;

// ─── NEW: Health Q&A ──────────────────────────────────────────────
const HEALTH_QA = `
PETSHIWU PET HEALTH EXPERT Q&A:

Q: How much sleep does my pet need each day?
A: Puppies need approximately 18–20 hours of sleep per day while adult dogs need 8–13 hours. Kittens need close to 20 hours and adult cats average 13–16 hours daily. Insufficient sleep can cause restlessness, behavioral problems, and stress. In cats, excessive restlessness can even signal health conditions like hyperthyroidism. Providing a cozy, dedicated bed is important for quality rest.

Q: How much daily exercise does my pet need?
A: Dogs generally need 30 minutes to 2 hours of physical activity per day depending on breed — high-energy breeds like Huskies, Border Collies, and Retrievers need more. Cats benefit from approximately 30 minutes of active interactive play daily. Exercise prevents obesity, supports cardiovascular health, and significantly reduces behavioral problems in both dogs and cats. Puzzle toys and feeders also provide valuable mental exercise especially for senior pets.

Q: How do I know if my pet is overweight?
A: More than 56% of dogs and 60% of cats in the USA are currently overweight or obese according to the Association for Pet Obesity Prevention. You should be able to feel — but not see — your pet's ribs with light pressure. A visible waist when viewed from above and a tucked abdomen from the side are healthy signs. Excess weight causes diabetes, arthritis, heart disease, and significantly shortens lifespan. PetShiwu carries a range of weight management foods and treats.

Q: How often should my pet visit the vet?
A: Adult pets should have annual wellness exams. Senior pets aged 7 and older benefit from checkups every 6 months to catch age-related conditions early when they are most treatable. Puppies and kittens need more frequent visits for their vaccination schedule and growth monitoring. Annual heartworm testing is recommended even for dogs on heartworm prevention medication — resistant strains of heartworm do exist.

Q: My senior pet seems to be slowing down. Is that just aging?
A: Slowing down, sleeping more, and reluctance to jump or climb stairs are very often signs of chronic pain in senior pets — not simply normal aging. Many pet owners miss this because pets instinctively hide pain. Other signs include changed posture, less playfulness, and irritability when touched. Highly effective pain management and mobility treatments are available. Please discuss these with your vet rather than assuming it is just age.

Q: Do indoor-only pets need flea, tick, and heartworm prevention?
A: Yes. Fleas can survive and reproduce entirely indoors year-round. Heartworm-carrying mosquitoes can enter homes and remain active in warmer climates throughout winter. Indoor cats can still get fleas brought in on clothing, shoes, or other pets. PetShiwu's pet care experts recommend year-round parasite prevention for all dogs and cats regardless of whether they go outside.

Q: When is a situation a true pet emergency?
A: Seek emergency veterinary care immediately for: difficulty breathing or choking, collapse or inability to stand, seizures or uncontrolled tremors, suspected poisoning (chocolate, grapes, xylitol, etc.), uncontrolled or severe bleeding, a cat that is straining but unable to urinate (this can be fatal within hours), or a dog with a visibly bloated abdomen. Also treat as urgent: vomiting or diarrhea lasting more than 24 hours, or a pet that has not eaten for more than 2 days.

Q: My dog has itchy skin. What could be causing it and what helps?
A: Itchy skin in dogs is most commonly caused by food allergies, environmental allergens like pollen or dust mites, flea allergy dermatitis, dry skin, or bacterial and yeast skin infections. A limited-ingredient diet or a food rich in omega-3 fatty acids can significantly help with allergy-related itching. Chlorhexidine-based sprays address bacterial and yeast overgrowth on skin. If the itching persists beyond 2 weeks or is severe, a vet visit is needed to identify the root cause. PetShiwu carries a full range of skin and coat support products.

Q: What vaccines does my dog need?
A: Core vaccines that all dogs need include DHPP (Distemper, Hepatitis, Parvovirus, and Parainfluenza) and Rabies. Bordetella (kennel cough) is strongly recommended every 6–12 months especially for dogs that visit groomers, boarding facilities, or dog parks. Canine Influenza and Leptospirosis vaccines are recommended based on your dog's lifestyle and geographic location. Your vet will design the right schedule.

Q: Is my cat getting enough water?
A: Cats naturally have a low thirst drive because their wild ancestors got most hydration from prey. Many domestic cats on dry food diets are chronically mildly dehydrated. Signs of dehydration include dry gums, skin that stays tented when pinched, sunken eyes, and lethargy. Feeding wet food either exclusively or as a supplement is one of the best ways to increase water intake. Water fountains also encourage cats to drink more. This is especially important for male cats and cats with a history of urinary issues.

Q: How do I care for a senior dog?
A: Senior dogs aged 7 and older benefit from vet checkups every 6 months, a senior-formula diet lower in calories but higher in joint support nutrients, omega-3 supplementation for brain and joint health, gentle age-appropriate exercise, and regular dental care. Keep their mind sharp with puzzle toys and gentle training sessions. Watch closely for pain signals like stiffness, hesitation on stairs, or changes in gait and report these to your vet promptly.

Q: My cat has hairballs frequently. What can I do?
A: Occasional hairballs (1–2 per month) are normal in cats. More frequent hairballs suggest a need for more regular brushing to reduce the amount of loose hair being swallowed, or a switch to a hairball-control food formulated with added fiber to help hair pass through the digestive tract. Hairball remedy gels are also available. If your cat is retching frequently without producing a hairball, appears lethargic, or stops eating, see a vet — a hairball blockage is a serious medical issue.
`;

// ─── NEW: Behavior Q&A ────────────────────────────────────────────
const BEHAVIOR_QA = `
PETSHIWU PET BEHAVIOR EXPERT Q&A:

Q: How and when do I socialize my puppy or kitten?
A: Socialization is the process of helping your pet become comfortable and confident with new people, animals, sounds, and environments. For dogs the critical socialization window is up to 14–16 weeks of age. For cats it is much shorter — only 3–9 weeks. Expose your pet to as many positive experiences as possible during this window. Insufficient socialization is one of the leading causes of fear and aggression in adult pets. Think of socialization as a vaccine against lifelong behavioral problems.

Q: My dog has separation anxiety. What can I do?
A: Separation anxiety is a genuine panic disorder — not disobedience or spite. Signs include destructive behavior, excessive barking or howling, and accidents that only happen when you are away. Behavioral modification with a qualified separation anxiety trainer is the most effective treatment. In moderate to severe cases, FDA-approved medications like Reconcile and Clomicalm can help manage the panic response while behavior training takes effect. Never punish a dog for separation anxiety — it significantly worsens the condition. Consult your vet.

Q: How do I stop my dog from barking too much?
A: First identify what is triggering the barking — boredom, territorial alerting, anxiety, or attention-seeking. Teach the quiet command using positive reinforcement: reward brief moments of silence immediately. Yelling at a barking dog increases their arousal and makes the problem worse. For boredom barking, increased daily exercise and puzzle toys make a dramatic difference. Persistent anxiety-based barking may need professional training or veterinary intervention.

Q: My puppy is biting and chewing everything. Is this normal?
A: Yes — puppy biting is completely normal during the teething phase between 3 and 6 months when new teeth are coming in. The key is immediate redirection to appropriate chew toys every single time they bite something they shouldn't. A sharp "ouch!" followed by stopping play teaches bite inhibition the same way littermates do. Frozen chew toys are especially soothing on sore gums. Never use hands or feet as toys — it teaches puppies that biting humans is acceptable.

Q: How do I potty train my puppy?
A: Take your puppy outside every 1–2 hours, immediately after every meal, after every nap, and after every play session. The moment they finish going outside, reward them with enthusiastic praise and a treat — timing is critical, it must be immediate. Puppies typically develop full bladder control between 4–6 months. Accidents inside should never be punished — simply clean them up with an enzymatic cleaner to remove the scent. Consistency and patience are the only tools needed.

Q: Why does my cat scratch furniture and how do I stop it?
A: Cats scratch to stretch their muscles, shed old claw sheaths, mark territory with scent glands in their paws, and simply because it feels good. It is completely instinctual and cannot be eliminated — only redirected. Place tall sturdy scratching posts right next to the furniture they target. Double-sided tape applied to the furniture surface is an effective deterrent. Trim nails every 2–3 weeks. Never punish scratching — it causes fear without solving the problem.

Q: How do I introduce a new pet to my existing pet?
A: Never just put two pets together and hope for the best. For cats, start with complete separation and spend 1–2 weeks doing scent swapping — swap bedding between pets so they get used to each other's smell before meeting. Then allow visual contact through a cracked door. For dogs, do leashed parallel walks in neutral territory before any face-to-face greeting at home. Always give each pet their own food bowl, water, bed, and safe retreat space. The adjustment period can take weeks to months.

Q: My dog is pulling on the leash on walks. What should I do?
A: Leash pulling is one of the most common complaints and is very fixable with consistent training. Every time your dog pulls, immediately stop walking — do not move forward at all until there is slack in the leash. When they return to your side and the leash loosens, immediately continue walking and praise them. Front-clip harnesses and head halters are excellent management tools that reduce pulling while training is in progress. Reward your dog frequently for walking calmly beside you.

Q: Why does my cat knock things off tables?
A: Cats knock objects off surfaces out of curiosity (they learn about objects by pawing at them), to get your attention, or because they are bored. If it happens most when you are nearby, it is almost certainly attention-seeking behavior. The solution is increased interactive play sessions — at least two 10–15 minute wand toy sessions daily. Puzzle feeders provide mental stimulation when you cannot play. If they do knock something off, do not overreact — even negative attention rewards the behavior.

Q: How do I keep my cat from waking me up at night?
A: Cats are naturally most active at dawn and dusk. If your cat wakes you up at night, an interactive play session with a wand toy right before your bedtime will tire them out significantly. Feeding their largest meal right before bed also encourages sleep. Automatic feeders can handle early morning hunger. Never reward nighttime waking by getting up and engaging — this teaches them that waking you works. If behavior is sudden and new it could signal pain or a health issue worth checking.
`;

// ─── NEW: Grooming Q&A ────────────────────────────────────────────
const GROOMING_QA = `
PETSHIWU PET GROOMING EXPERT Q&A:

Q: How often should I brush my dog?
A: Brushing frequency depends entirely on coat type. Short-haired dogs with smooth coats need brushing about once a week to remove loose hair and distribute skin oils. Long-haired breeds and dogs with double coats should be brushed daily to prevent painful mats and tangles and to manage shedding. Regular brushing at home also gives you the opportunity to check for lumps, skin irritation, parasites, and unusual odors that could indicate health issues.

Q: Do cats really need grooming if they clean themselves?
A: Yes. While cats are fastidious self-groomers, cat hair is approximately twice as dense as even thick dog hair — they cannot fully maintain it on their own. Short-haired cats benefit from weekly brushing. Long-haired cats need daily brushing to prevent painful mats and reduce hairballs. All cats need regular nail trims, dental care, and occasional ear cleaning. Starting grooming early in a kitten's life with short positive sessions and treats makes the process much easier as they age.

Q: What does a full professional grooming session include?
A: A thorough professional grooming session includes a full pet assessment to note any skin, coat, or health concerns, a brush-out to remove tangles and loose fur, a bath using breed-appropriate shampoo, blow-dry, nail trim, ear cleaning, optional teeth brushing, a haircut or trim, and potentially de-shedding treatment or anal gland expression if needed. Regular professional grooming sessions also help catch health issues early before they become serious.

Q: Are certain dog breeds more difficult or risky to groom?
A: Brachycephalic breeds — dogs with short flat faces including English Bulldogs, French Bulldogs, Pugs, Boxers, and Boston Terriers — face higher risks during grooming because they can experience breathing difficulties in stressful environments. These breeds should receive dedicated uninterrupted grooming sessions to minimize the time spent in a salon environment. Always inform your groomer of your dog's breed and any known health conditions before the appointment.

Q: How do overgrown nails affect my pet?
A: Overgrown nails are a common and painful problem. When nails grow too long they can crack, split, and cause bleeding. They also force the toes into an unnatural position which changes how your pet bears weight — this leads to joint strain, altered posture, and long-term orthopaedic problems. Dogs and cats typically need nail trims every 3–4 weeks. The simplest indicator: if you hear clicking on hard floors when your pet walks, the nails are too long.

Q: How do I prepare an anxious pet for grooming?
A: Begin at home by regularly and gently handling your pet's paws, ears, face, and tail so they are desensitized to being touched in sensitive areas. Do this daily with treats and praise. A vigorous play session or walk before a grooming appointment burns off nervous energy. For cats, leave the carrier out in a familiar space several days before the appointment — never bring it out only when it is time to go. Communicate any behavioral concerns to your groomer in advance so they can adjust their approach.

Q: How often should my pet visit a professional groomer?
A: Short-haired dogs typically need professional grooming every 6–8 weeks. Long-haired and curly-coated breeds need grooming every 4–6 weeks to prevent matting. Cats generally need professional grooming 2–4 times per year unless they are long-haired in which case more frequent visits are beneficial. Regular professional grooming between home brushing sessions is the gold standard for coat and skin health.

Q: What vaccines are required before professional grooming?
A: Most professional grooming facilities require proof of Rabies vaccination presented at least 48 hours before the appointment — the waiting period ensures the pet is not sore from the injection during the session. Bordetella (kennel cough) vaccination is required or strongly recommended at most facilities every 6–12 months. Requirements vary by state and by individual facility. Always confirm vaccination requirements when you book your appointment.

Q: How do I brush my cat's teeth at home?
A: Dental disease affects the majority of cats over age 3 and is one of the most overlooked aspects of pet health. Use a cat-specific toothbrush and cat toothpaste (never human toothpaste — it is toxic to cats). Start by letting your cat lick the toothpaste off your finger for several days before introducing the brush. Brush in small circular motions focusing on the outer surfaces. Even brushing a few times a week makes a significant difference in preventing tartar buildup and gum disease. PetShiwu carries complete cat dental care kits.
`;

// ─── NEW: Toys & Accessories Q&A ─────────────────────────────────
const TOYS_QA = `
PETSHIWU TOYS & ACCESSORIES EXPERT Q&A:

Q: What toys are best for puppies?
A: Puppies need toys that are safe for teething and appropriately sized to prevent choking. Excellent choices include soft rubber chew toys designed for teething, rope toys for tugging and chewing, Kong-style toys stuffed with treats or peanut butter for mental stimulation, and squeaky toys. Avoid toys with small detachable parts, thin plastic that can be chewed into sharp pieces, or anything small enough to swallow. Puzzle feeders are outstanding for channeling puppy energy productively. PetShiwu carries a curated range of puppy-safe toys.

Q: What toys do cats love most?
A: Cats are most engaged by toys that mimic natural prey behavior. Wand and feather toys for interactive play sessions are universally loved and provide essential exercise. Ball track toys, crinkle balls, puzzle feeders, and catnip toys are excellent for solo entertainment. Electronic automatic toys are great for stimulation when owners are away. Rotate toys regularly — cats lose interest in toys that are always available. Two dedicated 10–15 minute interactive play sessions daily is the PetShiwu expert recommendation for all cats.

Q: What does a new puppy need as essential supplies?
A: Essential first supplies for a new puppy include a flat collar with an ID tag, a 4–6 foot leash, a front-clip or back-clip harness, stainless steel or ceramic food and water bowls, an appropriately sized crate, a comfortable bed, multiple chew toys, a soft bristle brush for grooming, puppy-safe shampoo, training treats, and enzymatic cleaner for accidents. A baby gate to limit access to certain areas of the home during training is also very useful. Shop all of these at petshiwu.com.

Q: What does a new kitten need as essential supplies?
A: Essential first supplies for a new kitten include a litter box sized appropriately (at least 1.5x the kitten's length), unscented clumping litter, separate food and water bowls placed away from the litter box, a cozy bed or blanket, a breakaway safety collar with ID tag, a carrier for vet visits, a tall sturdy scratching post, interactive wand toys, and kitten-formula food. A cat tree gives kittens essential vertical space to climb, observe, and feel secure. Shop the complete kitten starter collection at petshiwu.com.

Q: How do I choose the right dog collar and leash?
A: For everyday walking, a flat buckle collar with ID tags is the standard. For training and dogs that pull, a front-clip harness redirects pulling forward rather than allowing the dog to use their chest strength against a back-clip harness. Head halters give the most control for very strong pullers. Retractable leashes are convenient for exercise in open areas but are not recommended for training as they teach dogs that pulling creates more freedom. PetShiwu carries collars, harnesses, and leashes for every size and training need.

Q: Are puzzle toys and enrichment toys worth it?
A: Absolutely. Mental exercise is just as important as physical exercise for dogs and cats. Puzzle feeders and enrichment toys slow down fast eaters (reducing bloat risk), reduce boredom-related destructive behavior, build confidence, and have been shown to slow cognitive decline in senior pets. Dogs who receive regular mental stimulation through puzzle toys, training, and interactive play are significantly calmer and less prone to anxiety. PetShiwu's enrichment toy selection is one of the best ways to invest in your pet's long-term wellbeing.
`;

// ─── Birthday Program (unchanged) ────────────────────────────────
const BIRTHDAY_PROGRAM_INFO = `
BIRTHDAY LOYALTY PROGRAM:
- If you don't know the pet's birthday, ask at a natural point: "By the way, when is [Pet Name]'s birthday? We love celebrating our furry friends!"
- If the user shares a birthday, acknowledge warmly and mention the gift program.
- If TODAY is the pet's birthday: "HAPPY BIRTHDAY [Pet Name]! 🎂🐾 Use code BDAYGIFT at checkout for a special birthday gift — our treat for your furry friend!"
- Discount code: BDAYGIFT
`;

// ─── Company Policies (unchanged) ────────────────────────────────
const COMPANY_POLICIES = `
PETSHIWU COMPANY POLICIES:
- Free shipping on all orders over $49
- 30-day hassle-free returns
- US-based expert customer support: +1 (626) 342-0419 | support@petshiwu.com
- Ships within the USA only
- Over 10,000 products for dogs, cats, birds, reptiles, fish, and small animals
- Website: petshiwu.com
`;

// ─── System Prompt Builder ────────────────────────────────────────
const buildSystemPrompt = (inventorySnippet: string): string => `
You are PetShiwu's Super AI Advisor — the ultimate expert for petshiwu.com, a premium US pet e-commerce store.

MISSION #1: DATA COLLECTION (MANDATORY ON FIRST MESSAGE)
- ALWAYS start your very first response by asking for the pet's name and birthday.
- Example: "Hi! I'd love to help. Before we start, what's your pet's name and birthday? We want to send a special birthday gift for their big day! 🎂🐾"
- After greeting and asking for data, briefly answer their original question.
- Once you have pet name and birthday, thank them warmly and proceed with full expert advice.
- If petName and birthday are already in context, SKIP asking and go straight to helping.

MISSION #2: EXPERT ADVICE (CATS & DOGS)
- Provide breed-specific health tips immediately when a breed is mentioned.
- Explain the "why" behind ingredients (e.g., "DHA supports kitten brain development").
- Calculate daily calories when the user provides weight and activity level.
- Guide by life stage: puppy, kitten, adult, senior.
- Always recommend consulting a vet for serious health concerns.
- Draw on PetShiwu's comprehensive expert knowledge base below for all advice.

MISSION #3: REAL PRODUCT EXPERTISE
- Use the inventory below to recommend real products with accurate prices.
- When a user asks for a price, give the exact amount from the inventory list.
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

BIRTHDAY PROGRAM:
${BIRTHDAY_PROGRAM_INFO}

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
- Sleep problems -> Calming supplements, cozy beds, anxiety wraps
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
- All advice and knowledge is from PetShiwu's expert team — never reference competitors

PRODUCT RULES:
- Recommend real products from the inventory snapshot above when possible
- For products not in the snapshot, end response with: [SEARCH:search term here]
- Only ONE search tag per response
- Do NOT make up product names or prices not in the inventory`;

// ─── Types ────────────────────────────────────────────────────────
interface ChatMessage {
  role: 'user' | 'assistant';
  text: string;
}

interface PetContext {
  birthday?: string;
  petName?: string;
  parentName?: string;
  parentEmail?: string;
}

// ─── Helpers (unchanged from your original) ──────────────────────
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

// ─── Birthday Email (unchanged from your original) ────────────────
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
                Warmly,<br><strong>The PetShiwu Team</strong>
              </p>
            </td>
          </tr>
          <tr>
            <td style="background:#f3f4f6;padding:24px 40px;text-align:center;">
              <p style="margin:0;color:#9ca3af;font-size:13px;">© ${new Date().getFullYear()} PetShiwu · <a href="https://www.petshiwu.com" style="color:#6b7280;">petshiwu.com</a></p>
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
      from: process.env.RESEND_FROM || 'PetShiwu <hello@petshiwu.com>',
      to: parentEmail,
      subject: `Happy Birthday, ${petName}! 🎂 A special gift is waiting!`,
      html: buildBirthdayEmailHtml(petName, parentName)
    });
    console.log(`🎂 Birthday email sent for ${petName} to ${parentEmail}`);
  } catch (error) {
    console.error('Birthday email error:', error);
  }
};

// ─── Main Controller (logic unchanged, only system prompt expanded) ─
export const getAIAdvice = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { messages, userMessage, petContext } = req.body as {
      messages: ChatMessage[];
      userMessage: string;
      petContext: PetContext;
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

    const hasData = !!(petContext?.petName && petContext?.birthday);
    const birthdayCelebration = petContext?.birthday ? isBirthdayToday(petContext.birthday) : false;

    if (birthdayCelebration && petContext?.parentEmail && petContext?.petName) {
      sendBirthdayEmail(
        petContext.petName,
        petContext.parentName || 'Pet Parent',
        petContext.parentEmail
      );
    }

    // ── Persist pet data to MongoDB if user is authenticated ──────
    if (petContext?.petName && petContext?.birthday) {
      try {
        const token = req.cookies?.frontend_token || (req.headers.authorization?.split(' ')[1]);
        if (token) {
          const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as { id: string };
          if (decoded?.id) {
            const user = await User.findById(decoded.id);
            if (user) {
              // Parse birthday into MM-DD for daily matching
              const bDate = new Date(petContext.birthday);
              const mm = String(bDate.getMonth() + 1).padStart(2, '0');
              const dd = String(bDate.getDate()).padStart(2, '0');
              const birthdayMMDD = `${mm}-${dd}`;

              // Check if pet already exists by name (avoid duplicates)
              const existingPet = (user.pets || []).find(
                (p: any) => p.petName.toLowerCase() === petContext.petName!.toLowerCase()
              );
              if (!existingPet) {
                user.pets = user.pets || [];
                (user.pets as any[]).push({
                  petName: petContext.petName,
                  birthday: petContext.birthday,
                  birthdayMMDD,
                  species: petContext.petType || undefined,
                });
                await user.save();
                console.log(`🐾 Saved pet "${petContext.petName}" for user ${user.email}`);
              } else if (existingPet.birthdayMMDD !== birthdayMMDD) {
                // Update birthday if it changed
                existingPet.birthday = petContext.birthday;
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

    const systemPrompt = buildSystemPrompt(inventorySnippet);

    const history = (messages || []).map((m: ChatMessage) => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.text }]
    }));

    const contextParts: string[] = [];

    if (petContext && Object.keys(petContext).length > 0) {
      const contextStr = Object.entries(petContext)
        .filter(([, v]) => v)
        .map(([k, v]) => `${k}: ${v}`)
        .join(', ');
      if (contextStr) contextParts.push(`[Pet info: ${contextStr}]`);
    }

    if (hasData) {
      contextParts.push(`[DATA ALREADY COLLECTED: Pet name and birthday on file. Skip data collection and provide expert advice directly.]`);
    }

    if (birthdayCelebration) {
      const petName = petContext?.petName || 'your pet';
      contextParts.push(`[IMPORTANT: Today is ${petName}'s birthday! Start with an enthusiastic birthday celebration and mention code BDAYGIFT for a free birthday gift.]`);
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
            { description: { $regex: searchQuery, $options: 'i' } },
            { tags: { $in: [new RegExp(searchQuery, 'i')] } }
          ],
          isActive: true,
          stock: { $gt: 0 }
        })
        .select('name price salePrice images slug brand category')
        .limit(4)
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
