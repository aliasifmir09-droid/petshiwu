/**
 * Neighborhood × Category page data
 * 50 NYC neighborhoods × 28 delivery categories = 1,400 programmatic SEO pages
 * Targets: "[category] delivery [neighborhood] [borough]" — low-competition niche
 */

export interface NeighborhoodData {
  name: string;
  slug: string;           // used in URL, e.g. "flushing-queens"
  borough: string;
  boroughSlug: string;
  nearbyAreas: string;    // comma-separated nearby neighborhoods
  flavor: string;         // 1-2 sentence neighborhood pet owner description
}

export interface NeighborhoodPageConfig {
  slug: string;           // full URL slug, e.g. "dog-food-delivery-flushing-queens"
  title: string;
  description: string;
  h1: string;
  introContent: string;
  problemPoints: string[];
  solutionPoints: string[];
  faqItems: { question: string; answer: string }[];
  searchTerms: string[];
  petType?: 'dog' | 'cat';
  keyword: string;
  neighborhood: NeighborhoodData;
  categorySlug: string;
}

// ─────────────────────────────────────────────
// 50 NYC Neighborhoods
// ─────────────────────────────────────────────
const NEIGHBORHOODS: NeighborhoodData[] = [
  // Queens (15)
  { name: 'Flushing', slug: 'flushing-queens', borough: 'Queens', boroughSlug: 'queens', nearbyAreas: 'Whitestone, College Point, and Murray Hill', flavor: 'Flushing is one of Queens\' most vibrant communities, with pet owners from diverse backgrounds who take great care of their dogs and cats.' },
  { name: 'Jackson Heights', slug: 'jackson-heights-queens', borough: 'Queens', boroughSlug: 'queens', nearbyAreas: 'Elmhurst, Woodside, and Corona', flavor: 'Jackson Heights is a diverse, walkable Queens neighborhood where dog owners and cat lovers are part of the daily fabric of the streets.' },
  { name: 'Astoria', slug: 'astoria-queens', borough: 'Queens', boroughSlug: 'queens', nearbyAreas: 'Long Island City, Ditmars, and Steinway', flavor: 'Astoria\'s mix of longtime residents and young professionals creates a neighborhood full of dedicated pet owners.' },
  { name: 'Forest Hills', slug: 'forest-hills-queens', borough: 'Queens', boroughSlug: 'queens', nearbyAreas: 'Rego Park, Kew Gardens, and Austin Street', flavor: 'Forest Hills is a leafy, family-friendly Queens neighborhood where dogs are a constant presence in the parks and on the streets.' },
  { name: 'Long Island City', slug: 'long-island-city-queens', borough: 'Queens', boroughSlug: 'queens', nearbyAreas: 'Astoria, Sunnyside, and Hunter\'s Point', flavor: 'LIC\'s booming residential towers are home to thousands of dog owners and cat lovers who want reliable doorstep delivery.' },
  { name: 'Jamaica', slug: 'jamaica-queens', borough: 'Queens', boroughSlug: 'queens', nearbyAreas: 'Hollis, St. Albans, and Springfield Gardens', flavor: 'Jamaica is a busy Queens hub where families and pet owners rely on home delivery to skip the trip to the pet store.' },
  { name: 'Bayside', slug: 'bayside-queens', borough: 'Queens', boroughSlug: 'queens', nearbyAreas: 'Whitestone, Oakland Gardens, and Fresh Meadows', flavor: 'Bayside\'s suburban feel and larger yards make it a hub for dog owners who want premium brands without the Manhattan markup.' },
  { name: 'Woodside', slug: 'woodside-queens', borough: 'Queens', boroughSlug: 'queens', nearbyAreas: 'Sunnyside, Jackson Heights, and Maspeth', flavor: 'Woodside\'s tight-knit Irish and Filipino communities include many dog owners who prefer convenient doorstep delivery.' },
  { name: 'Sunnyside', slug: 'sunnyside-queens', borough: 'Queens', boroughSlug: 'queens', nearbyAreas: 'Woodside, LIC, and Maspeth', flavor: 'Sunnyside\'s growing young professional population has brought a wave of first-time pet owners who care deeply about quality.' },
  { name: 'Elmhurst', slug: 'elmhurst-queens', borough: 'Queens', boroughSlug: 'queens', nearbyAreas: 'Jackson Heights, Corona, and Rego Park', flavor: 'Elmhurst is one of NYC\'s most diverse neighborhoods, with a strong tradition of pet ownership across many cultures.' },
  { name: 'Corona', slug: 'corona-queens', borough: 'Queens', boroughSlug: 'queens', nearbyAreas: 'Elmhurst, Jackson Heights, and Flushing', flavor: 'Corona is a vibrant Queens neighborhood where families with dogs and cats look for reliable, affordable home delivery.' },
  { name: 'Rego Park', slug: 'rego-park-queens', borough: 'Queens', boroughSlug: 'queens', nearbyAreas: 'Forest Hills, Elmhurst, and Woodhaven', flavor: 'Rego Park\'s dense residential blocks are home to many families who keep dogs and cats as cherished companions.' },
  { name: 'Ridgewood', slug: 'ridgewood-queens', borough: 'Queens', boroughSlug: 'queens', nearbyAreas: 'Bushwick, Glendale, and Middle Village', flavor: 'Ridgewood straddles Queens and Brooklyn with a growing community of dog owners who want premium pet food delivered.' },
  { name: 'Fresh Meadows', slug: 'fresh-meadows-queens', borough: 'Queens', boroughSlug: 'queens', nearbyAreas: 'Bayside, Flushing, and Jamaica', flavor: 'Fresh Meadows is a quiet, suburban Queens neighborhood where pet owners value quality over chain-store convenience.' },
  { name: 'Howard Beach', slug: 'howard-beach-queens', borough: 'Queens', boroughSlug: 'queens', nearbyAreas: 'Ozone Park, Richmond Hill, and Broad Channel', flavor: 'Howard Beach is a waterfront Queens community where dog-walking culture thrives and pet owners value premium products.' },
  // Brooklyn (15)
  { name: 'Williamsburg', slug: 'williamsburg-brooklyn', borough: 'Brooklyn', boroughSlug: 'brooklyn', nearbyAreas: 'Greenpoint, Bushwick, and Bedford-Stuyvesant', flavor: 'Williamsburg\'s young, urban population includes thousands of dog owners and cat lovers who expect premium brands delivered fast.' },
  { name: 'Park Slope', slug: 'park-slope-brooklyn', borough: 'Brooklyn', boroughSlug: 'brooklyn', nearbyAreas: 'Prospect Heights, Carroll Gardens, and Gowanus', flavor: 'Park Slope is one of Brooklyn\'s most dog-friendly neighborhoods, with Prospect Park as the daily gathering place for dog owners of every breed.' },
  { name: 'Sunset Park', slug: 'sunset-park-brooklyn', borough: 'Brooklyn', boroughSlug: 'brooklyn', nearbyAreas: 'Bay Ridge, Greenwood Heights, and Borough Park', flavor: 'Sunset Park is a large, diverse Brooklyn neighborhood where Chinese and Latino families are among the most devoted pet owners.' },
  { name: 'Crown Heights', slug: 'crown-heights-brooklyn', borough: 'Brooklyn', boroughSlug: 'brooklyn', nearbyAreas: 'Prospect Heights, Flatbush, and Brownsville', flavor: 'Crown Heights\' historic brownstones and growing population include many devoted dog and cat owners who prefer local delivery.' },
  { name: 'Flatbush', slug: 'flatbush-brooklyn', borough: 'Brooklyn', boroughSlug: 'brooklyn', nearbyAreas: 'Crown Heights, Midwood, and East Flatbush', flavor: 'Flatbush is a large, diverse Brooklyn neighborhood where Caribbean and South Asian families have strong traditions of pet care.' },
  { name: 'Bay Ridge', slug: 'bay-ridge-brooklyn', borough: 'Brooklyn', boroughSlug: 'brooklyn', nearbyAreas: 'Fort Hamilton, Dyker Heights, and Bensonhurst', flavor: 'Bay Ridge\'s waterfront walks and suburban character draw many dog owners who want top-quality food without the trip to Manhattan.' },
  { name: 'Bushwick', slug: 'bushwick-brooklyn', borough: 'Brooklyn', boroughSlug: 'brooklyn', nearbyAreas: 'Ridgewood, East Williamsburg, and Bed-Stuy', flavor: 'Bushwick\'s creative community has fully embraced pet ownership, with dog owners and cat lovers throughout every block.' },
  { name: 'Greenpoint', slug: 'greenpoint-brooklyn', borough: 'Brooklyn', boroughSlug: 'brooklyn', nearbyAreas: 'Williamsburg, Long Island City, and Astoria', flavor: 'Greenpoint is one of Brooklyn\'s most beloved neighborhoods, with a strong dog-owner community centered around McCarren Park.' },
  { name: 'Bed-Stuy', slug: 'bed-stuy-brooklyn', borough: 'Brooklyn', boroughSlug: 'brooklyn', nearbyAreas: 'Crown Heights, Bushwick, and Fort Greene', flavor: 'Bed-Stuy\'s historic brownstone blocks and vibrant community include many devoted dog owners who want quality delivered to their door.' },
  { name: 'Fort Greene', slug: 'fort-greene-brooklyn', borough: 'Brooklyn', boroughSlug: 'brooklyn', nearbyAreas: 'Clinton Hill, Boerum Hill, and Downtown Brooklyn', flavor: 'Fort Greene\'s tree-lined streets and proximity to Fort Greene Park make it one of Brooklyn\'s premier dog owner communities.' },
  { name: 'Carroll Gardens', slug: 'carroll-gardens-brooklyn', borough: 'Brooklyn', boroughSlug: 'brooklyn', nearbyAreas: 'Cobble Hill, Red Hook, and Gowanus', flavor: 'Carroll Gardens is a charming, family-friendly Brooklyn neighborhood where dogs are a constant presence on the block and in the garden.' },
  { name: 'Cobble Hill', slug: 'cobble-hill-brooklyn', borough: 'Brooklyn', boroughSlug: 'brooklyn', nearbyAreas: 'Carroll Gardens, Boerum Hill, and Red Hook', flavor: 'Cobble Hill\'s tree-lined streets and brownstone stoops are a favorite destination for dog walkers and devoted pet owners.' },
  { name: 'Red Hook', slug: 'red-hook-brooklyn', borough: 'Brooklyn', boroughSlug: 'brooklyn', nearbyAreas: 'Carroll Gardens, Gowanus, and Sunset Park', flavor: 'Red Hook\'s waterfront community has a devoted group of pet owners who appreciate quality products delivered directly to their door.' },
  { name: 'Brighton Beach', slug: 'brighton-beach-brooklyn', borough: 'Brooklyn', boroughSlug: 'brooklyn', nearbyAreas: 'Coney Island, Manhattan Beach, and Sheepshead Bay', flavor: 'Brighton Beach is a vibrant seaside neighborhood with a strong Russian-speaking community of dog and cat owners.' },
  { name: 'Bensonhurst', slug: 'bensonhurst-brooklyn', borough: 'Brooklyn', boroughSlug: 'brooklyn', nearbyAreas: 'Bay Ridge, Dyker Heights, and Sunset Park', flavor: 'Bensonhurst\'s large Italian and Chinese families have a strong tradition of pet ownership going back generations.' },
  // Manhattan (10)
  { name: 'Upper West Side', slug: 'upper-west-side-manhattan', borough: 'Manhattan', boroughSlug: 'manhattan', nearbyAreas: 'Morningside Heights, Lincoln Square, and Riverside Drive', flavor: 'The Upper West Side is one of Manhattan\'s most dog-dense neighborhoods, with Riverside Park and Central Park serving hundreds of dog owners daily.' },
  { name: 'Upper East Side', slug: 'upper-east-side-manhattan', borough: 'Manhattan', boroughSlug: 'manhattan', nearbyAreas: 'Carnegie Hill, Yorkville, and East Harlem', flavor: 'The Upper East Side\'s affluent residents include many devoted pet owners who demand premium brands and reliable, discreet delivery.' },
  { name: 'Chelsea', slug: 'chelsea-manhattan', borough: 'Manhattan', boroughSlug: 'manhattan', nearbyAreas: 'Hell\'s Kitchen, Flatiron, and West Village', flavor: 'Chelsea\'s vibrant, dog-loving population makes it one of Manhattan\'s top neighborhoods for pet owners who want quality delivered fast.' },
  { name: 'Tribeca', slug: 'tribeca-manhattan', borough: 'Manhattan', boroughSlug: 'manhattan', nearbyAreas: 'SoHo, Financial District, and Hudson Square', flavor: 'Tribeca\'s wealthy families and residential lofts include many dog owners who expect the best brands delivered on their schedule.' },
  { name: "Hell's Kitchen", slug: 'hells-kitchen-manhattan', borough: 'Manhattan', boroughSlug: 'manhattan', nearbyAreas: 'Midtown, Chelsea, and Lincoln Center', flavor: 'Hell\'s Kitchen\'s dense residential population includes thousands of dog and cat owners who need convenient delivery around their busy NYC schedules.' },
  { name: 'Harlem', slug: 'harlem-manhattan', borough: 'Manhattan', boroughSlug: 'manhattan', nearbyAreas: 'East Harlem, Washington Heights, and Morningside Heights', flavor: 'Harlem\'s historic community and Marcus Garvey Park area include many devoted pet owners who value quality and affordability.' },
  { name: 'Washington Heights', slug: 'washington-heights-manhattan', borough: 'Manhattan', boroughSlug: 'manhattan', nearbyAreas: 'Inwood, Harlem, and Fort George', flavor: 'Washington Heights is one of Manhattan\'s most populous neighborhoods, with many Dominican and diverse families who are devoted dog and cat owners.' },
  { name: 'Midtown', slug: 'midtown-manhattan', borough: 'Manhattan', boroughSlug: 'manhattan', nearbyAreas: 'Hell\'s Kitchen, Murray Hill, and Gramercy', flavor: 'Midtown\'s residential blocks are home to thousands of pet owners who rely on home delivery to manage their demanding city schedules.' },
  { name: 'East Village', slug: 'east-village-manhattan', borough: 'Manhattan', boroughSlug: 'manhattan', nearbyAreas: 'Lower East Side, NoHo, and Gramercy', flavor: 'The East Village\'s young, creative population includes many devoted dog and cat owners who want top-quality pet supplies delivered.' },
  { name: 'Inwood', slug: 'inwood-manhattan', borough: 'Manhattan', boroughSlug: 'manhattan', nearbyAreas: 'Washington Heights, Fort George, and Hudson Heights', flavor: 'Inwood\'s northern Manhattan location and proximity to Inwood Hill Park make it a beloved community for dog owners and outdoor pet enthusiasts.' },
  // Bronx (6)
  { name: 'Riverdale', slug: 'riverdale-bronx', borough: 'Bronx', boroughSlug: 'bronx', nearbyAreas: 'Fieldston, Kingsbridge, and Spuyten Duyvil', flavor: 'Riverdale is one of the Bronx\'s most affluent neighborhoods, with many families who keep dogs and cats as treasured members of the household.' },
  { name: 'Fordham', slug: 'fordham-bronx', borough: 'Bronx', boroughSlug: 'bronx', nearbyAreas: 'Belmont, Kingsbridge, and University Heights', flavor: 'Fordham is a busy Bronx neighborhood where families across many backgrounds own and care for their dogs and cats with genuine devotion.' },
  { name: 'Pelham Bay', slug: 'pelham-bay-bronx', borough: 'Bronx', boroughSlug: 'bronx', nearbyAreas: 'Throggs Neck, Co-op City, and City Island', flavor: 'Pelham Bay\'s proximity to Pelham Bay Park and the waterfront attracts many outdoor-loving pet owners with active dogs.' },
  { name: 'Mott Haven', slug: 'mott-haven-bronx', borough: 'Bronx', boroughSlug: 'bronx', nearbyAreas: 'Hunts Point, Port Morris, and Melrose', flavor: 'Mott Haven is a rapidly developing Bronx neighborhood with a growing population of young pet owners who want quality without big-chain prices.' },
  { name: 'Concourse', slug: 'concourse-bronx', borough: 'Bronx', boroughSlug: 'bronx', nearbyAreas: 'Highbridge, Mount Eden, and Fordham', flavor: 'The Grand Concourse area is home to many Bronx families who are devoted to their pets and appreciate reliable home delivery.' },
  { name: 'Throgs Neck', slug: 'throgs-neck-bronx', borough: 'Bronx', boroughSlug: 'bronx', nearbyAreas: 'Pelham Bay, Edgewater Park, and Country Club', flavor: 'Throgs Neck is a waterfront Bronx community with a strong tradition of dog ownership and a preference for quality products.' },
  // Staten Island (4)
  { name: 'St. George', slug: 'st-george-staten-island', borough: 'Staten Island', boroughSlug: 'staten-island', nearbyAreas: 'Tompkinsville, New Brighton, and Stapleton', flavor: 'St. George is Staten Island\'s main hub, with ferry access to Manhattan and a growing community of pet owners who want citywide service.' },
  { name: 'Tottenville', slug: 'tottenville-staten-island', borough: 'Staten Island', boroughSlug: 'staten-island', nearbyAreas: 'Charleston, Woodrow, and Great Kills', flavor: 'Tottenville is Staten Island\'s southernmost neighborhood, where families with large yards and beloved dogs rely on home delivery for premium pet food.' },
  { name: 'Great Kills', slug: 'great-kills-staten-island', borough: 'Staten Island', boroughSlug: 'staten-island', nearbyAreas: 'Eltingville, Bay Terrace, and Annadale', flavor: 'Great Kills is a quiet, suburban Staten Island neighborhood where dog ownership is widespread and pet owners value quality brands.' },
  { name: 'Stapleton', slug: 'stapleton-staten-island', borough: 'Staten Island', boroughSlug: 'staten-island', nearbyAreas: 'St. George, Clifton, and Tompkinsville', flavor: 'Stapleton\'s waterfront location and family-friendly blocks are home to many pet owners who appreciate convenient, affordable delivery.' },
];

// ─────────────────────────────────────────────
// Category template generators
// ─────────────────────────────────────────────
type PageGenerator = (n: NeighborhoodData) => Omit<NeighborhoodPageConfig, 'slug' | 'neighborhood' | 'categorySlug'>;

const dogFoodGenerator: PageGenerator = (n) => ({
  keyword: `dog-food-delivery-${n.slug}`,
  title: `Dog Food Delivery in ${n.name}, ${n.borough} — Same-Day Delivery | Petshiwu`,
  description: `Shop premium dog food and get it delivered in ${n.name}, ${n.borough}. Purina Pro Plan, Blue Buffalo, Hill's Science Diet, Royal Canin. Free shipping on orders over $49. Queens-based, NYC-wide delivery.`,
  h1: `Dog Food Delivery in ${n.name}, ${n.borough}`,
  introContent: `${n.flavor} Petshiwu delivers premium dog food to every address in ${n.name} — from dry kibble to grain-free wet food to prescription diets. We carry every major brand, we're based in Queens, and we offer free delivery on orders over $49. No big-box chain markup. Just the best food for your dog, at your door.`,
  petType: 'dog' as const,
  problemPoints: [
    `Carrying heavy 30–50 lb dog food bags home from the store in ${n.name}`,
    `Local ${n.borough} pet shops with limited brand selection or frequent stockouts`,
    `Big national chains that charge premium delivery fees and don't know NYC`,
    `Driving or taking multiple trains to find prescription or specialty dog food`,
    `Inconsistent availability of brands like Royal Canin, Hill's, or Orijen near ${n.name}`,
  ],
  solutionPoints: [
    `NYC-based delivery covering all of ${n.name} and nearby ${n.nearbyAreas}`,
    `10,000+ dog food products — dry, wet, raw, grain-free, prescription, and puppy`,
    `All top brands: Purina Pro Plan, Blue Buffalo, Hill's Science Diet, Royal Canin, Orijen, Merrick, and more`,
    `Free delivery on orders over $49 — most dog food orders qualify automatically`,
    `Queens-based operation: faster, more reliable NYC delivery than national chains`,
    `Dogs of all sizes covered: small breed, large breed, senior, puppy, and weight management formulas`,
  ],
  faqItems: [
    {
      question: `Do you deliver dog food to ${n.name}, ${n.borough}?`,
      answer: `Yes — Petshiwu delivers dog food throughout ${n.name} and the surrounding ${n.borough} area including ${n.nearbyAreas}. We're Queens-based and cover all five NYC boroughs. Free delivery on orders over $49.`,
    },
    {
      question: `What dog food brands do you carry for ${n.name} delivery?`,
      answer: `We carry all major dog food brands: Purina Pro Plan, Blue Buffalo, Hill's Science Diet, Royal Canin, Orijen, Merrick, Wellness, Iams, Pedigree, and many more. Over 10,000 dog products in total — dry, wet, grain-free, raw, and prescription formulas.`,
    },
    {
      question: `How much does dog food delivery cost in ${n.name}?`,
      answer: `Delivery to ${n.name} is $6 for orders under $49 and completely free for orders over $49. Most dog food orders — especially larger bags — easily hit the free shipping threshold. No subscription required.`,
    },
    {
      question: `Can I get prescription dog food delivered to ${n.name}?`,
      answer: `Yes — we carry prescription and veterinary diet dog food brands including Hill's Prescription Diet and Royal Canin Veterinary formulas for sensitive stomach, kidney support, weight management, and other conditions. Delivered to ${n.name} the same as any other order.`,
    },
    {
      question: `Do you deliver large bags of dog food to ${n.name}?`,
      answer: `Absolutely — we specialize in delivering large, heavy bags of dog food to ${n.name} and all of ${n.borough}. No more hauling 30–50 lb bags on the subway or from your car. Order online and we bring it to your door.`,
    },
  ],
  searchTerms: ['dog food', 'puppy food', 'dry dog food', 'wet dog food', 'grain-free dog food', 'prescription dog food', 'large breed dog food'],
});

const catFoodGenerator: PageGenerator = (n) => ({
  keyword: `cat-food-delivery-${n.slug}`,
  title: `Cat Food Delivery in ${n.name}, ${n.borough} — Same-Day Delivery | Petshiwu`,
  description: `Shop premium cat food and get it delivered in ${n.name}, ${n.borough}. Royal Canin, Hill's, Purina Pro Plan, Blue Buffalo. Free shipping on orders over $49. Queens-based, NYC-wide delivery.`,
  h1: `Cat Food Delivery in ${n.name}, ${n.borough}`,
  introContent: `${n.flavor} Petshiwu delivers premium cat food — wet, dry, grain-free, and prescription — to every address in ${n.name}. We carry all the brands your vet recommends and your cat actually likes. Free delivery on orders over $49, no subscription required.`,
  petType: 'cat' as const,
  problemPoints: [
    `Finding the specific cat food formula your cat will accept in ${n.name}`,
    `Local ${n.borough} stores running out of popular wet food varieties`,
    `Carrying cases of heavy wet food cans home from the supermarket`,
    `Limited selection of veterinary-recommended brands near ${n.name}`,
    `High delivery fees from national services that don't specialize in NYC`,
  ],
  solutionPoints: [
    `Delivery throughout ${n.name} and nearby ${n.nearbyAreas}`,
    `Thousands of cat food options — wet, dry, raw, freeze-dried, prescription`,
    `Royal Canin, Hill's Science Diet, Purina Pro Plan, Blue Buffalo, Fancy Feast, and more`,
    `Free delivery on orders over $49 — easy to reach with a case of wet food`,
    `Queens-based service built for NYC cat owners in dense apartments`,
    `Kitten, adult, and senior formulas for every life stage and health need`,
  ],
  faqItems: [
    {
      question: `Do you deliver cat food to ${n.name}, ${n.borough}?`,
      answer: `Yes — Petshiwu delivers cat food to all of ${n.name} and the surrounding ${n.borough} area including ${n.nearbyAreas}. We're Queens-based and serve all five NYC boroughs. Free delivery on orders over $49.`,
    },
    {
      question: `What cat food brands do you carry for ${n.name} delivery?`,
      answer: `We carry all major cat food brands: Royal Canin, Hill's Science Diet, Purina Pro Plan, Blue Buffalo, Fancy Feast, Wellness, Merrick, Iams, and many more. Wet, dry, grain-free, raw, and prescription formulas available.`,
    },
    {
      question: `How much does cat food delivery cost in ${n.name}?`,
      answer: `Delivery to ${n.name} is $6 for orders under $49 and free for orders over $49. A case of wet food typically reaches the free shipping threshold on its own. No subscription required.`,
    },
    {
      question: `Can I get prescription cat food delivered to ${n.name}?`,
      answer: `Yes — we carry prescription and veterinary diet cat food including Hill's Prescription Diet and Royal Canin Veterinary formulas for urinary health, kidney support, sensitive digestion, and weight management. Delivered directly to ${n.name}.`,
    },
    {
      question: `Do you have grain-free cat food delivery options for ${n.name}?`,
      answer: `Yes — we carry a wide range of grain-free cat food from brands like Blue Buffalo Wilderness, Wellness CORE, Merrick Grain-Free, and Orijen. All delivered to ${n.name} with free shipping on orders over $49.`,
    },
  ],
  searchTerms: ['cat food', 'wet cat food', 'dry cat food', 'grain-free cat food', 'prescription cat food', 'kitten food', 'senior cat food'],
});

const petSuppliesGenerator: PageGenerator = (n) => ({
  keyword: `pet-supplies-delivery-${n.slug}`,
  title: `Pet Supplies Delivery in ${n.name}, ${n.borough} — 10,000+ Products | Petshiwu`,
  description: `Shop 10,000+ pet supplies and get delivered in ${n.name}, ${n.borough}. Dog food, cat food, toys, treats, litter, leashes, and more. Free shipping over $49. Queens-based, NYC-wide.`,
  h1: `Pet Supplies Delivery in ${n.name}, ${n.borough}`,
  introContent: `${n.flavor} Petshiwu is a Queens-based pet supply store that delivers 10,000+ products to every address in ${n.name} — dog food, cat food, toys, treats, leashes, litter, and everything else your pet needs. Free delivery on orders over $49. No subscription, no membership fee.`,
  problemPoints: [
    `Limited selection at local ${n.borough} pet stores near ${n.name}`,
    `Carrying multiple heavy items home from the store`,
    `National chains that charge steep delivery fees to NYC addresses`,
    `Needing to visit multiple stores to find everything your pet needs`,
    `Stockouts on popular brands at nearby ${n.name} shops`,
  ],
  solutionPoints: [
    `Delivery to all of ${n.name} and nearby ${n.nearbyAreas}`,
    `10,000+ products: dog food, cat food, toys, treats, litter, leashes, beds, supplements, and more`,
    `All major brands: Purina, Blue Buffalo, Royal Canin, Hill's, Kong, Frisco, and hundreds more`,
    `Dogs, cats, birds, fish, reptiles, and small animals all covered`,
    `Free delivery on orders over $49 — Queens-based for faster NYC shipping`,
    `No subscription or membership required — shop when you need to`,
  ],
  faqItems: [
    {
      question: `Do you deliver pet supplies to ${n.name}, ${n.borough}?`,
      answer: `Yes — Petshiwu delivers pet supplies throughout ${n.name} and the surrounding ${n.borough} area including ${n.nearbyAreas}. We carry 10,000+ products for dogs, cats, birds, fish, reptiles, and small animals. Free delivery on orders over $49.`,
    },
    {
      question: `What kinds of pet supplies do you deliver to ${n.name}?`,
      answer: `We deliver everything: dog and cat food, treats, toys, leashes, collars, beds, litter, supplements, grooming supplies, aquarium supplies, bird food, reptile supplies, and much more. Over 10,000 products in total.`,
    },
    {
      question: `How much does pet supply delivery cost in ${n.name}?`,
      answer: `Delivery to ${n.name} is $6 for orders under $49 and completely free for orders over $49. Most orders with a bag of food plus a few supplies easily reach the free shipping threshold.`,
    },
    {
      question: `Can I get same-day pet supply delivery in ${n.name}?`,
      answer: `We serve all of ${n.borough} including ${n.name} with fast NYC delivery. We're Queens-based, which means shorter distances and faster turnaround than national chains. Check our site for current delivery time estimates.`,
    },
    {
      question: `Do you carry bird and fish supplies for ${n.name} delivery?`,
      answer: `Yes — we carry a full range of bird food, cages, perches, and toys, plus aquarium supplies including fish food, filters, tanks, and water treatments. Everything for every pet, delivered to ${n.name}.`,
    },
  ],
  searchTerms: ['pet supplies', 'dog food', 'cat food', 'pet toys', 'dog treats', 'cat litter', 'bird food', 'fish food'],
});

const dogTreatsGenerator: PageGenerator = (n) => ({
  keyword: `dog-treats-delivery-${n.slug}`,
  title: `Dog Treats & Accessories Delivery in ${n.name}, ${n.borough} | Petshiwu`,
  description: `Shop dog treats, chews, toys, leashes, and accessories — delivered in ${n.name}, ${n.borough}. All major brands. Free shipping over $49. Queens-based NYC delivery.`,
  h1: `Dog Treats & Accessories Delivery in ${n.name}, ${n.borough}`,
  introContent: `${n.flavor} Petshiwu delivers premium dog treats, dental chews, toys, leashes, and all the accessories your dog needs to ${n.name}. We carry every major brand, from Milk-Bone and Zuke's to Blue Buffalo and Wellness. Free delivery on orders over $49.`,
  petType: 'dog' as const,
  problemPoints: [
    `Limited treat variety at local ${n.borough} pet and grocery stores`,
    `Hard to find dental chews, training treats, and specialty snacks near ${n.name}`,
    `Expensive accessories at local ${n.name} stores with limited selection`,
    `Having to order from multiple sources to get food, treats, AND toys`,
    `National chains with slow delivery and high minimums for NYC addresses`,
  ],
  solutionPoints: [
    `Delivery of treats, toys, and accessories throughout ${n.name} and ${n.nearbyAreas}`,
    `Hundreds of dog treat varieties: training treats, dental chews, bully sticks, jerky, and more`,
    `Full accessories range: leashes, collars, harnesses, beds, crates, and grooming supplies`,
    `Kong, Nylabone, Blue Buffalo, Zuke's, Milk-Bone, Wellness, and many more brands`,
    `Free delivery on orders over $49 — stock up on treats AND food together`,
    `Queens-based for faster delivery to ${n.borough} than national chains`,
  ],
  faqItems: [
    {
      question: `Do you deliver dog treats to ${n.name}, ${n.borough}?`,
      answer: `Yes — Petshiwu delivers dog treats, chews, and accessories to all of ${n.name} and the surrounding area including ${n.nearbyAreas}. Free delivery on orders over $49.`,
    },
    {
      question: `What dog treat brands do you carry for ${n.name} delivery?`,
      answer: `We carry all major dog treat brands: Blue Buffalo, Zuke's, Milk-Bone, Wellness, Merrick, Rocco & Roxie, Whimzees, Nylabone, and many more. Training treats, dental chews, bully sticks, soft chews, and jerky all available.`,
    },
    {
      question: `Do you deliver dog leashes and accessories to ${n.name}?`,
      answer: `Yes — we deliver leashes, collars, harnesses, beds, crates, toys, grooming supplies, and all the accessories your dog needs, all to ${n.name}. Free delivery on orders over $49.`,
    },
    {
      question: `Can I get dental chews delivered to my dog in ${n.name}?`,
      answer: `Yes — we carry a wide range of dental chews for dogs including Greenies, Whimzees, Nylabone, and Milk-Bone Brushing Chews. Great for dental health and available for delivery throughout ${n.name} and ${n.borough}.`,
    },
    {
      question: `How much does dog accessory delivery cost in ${n.name}?`,
      answer: `Delivery to ${n.name} is $6 on orders under $49 and free on orders over $49. Combine dog food with treats and accessories to easily hit the free shipping threshold.`,
    },
  ],
  searchTerms: ['dog treats', 'dog chews', 'dental chews', 'dog toys', 'dog leash', 'dog harness', 'training treats', 'bully sticks'],
});

const puppyFoodGenerator: PageGenerator = (n) => ({
  keyword: `puppy-food-delivery-${n.slug}`,
  title: `Puppy Food Delivery in ${n.name}, ${n.borough} — Same-Day Delivery | Petshiwu`,
  description: `Premium puppy food delivered to ${n.name}, ${n.borough}. Hill's Science Diet Puppy, Purina Pro Plan Puppy, Royal Canin Puppy. Free shipping over $49. Queens-based NYC delivery.`,
  h1: `Puppy Food Delivery in ${n.name}, ${n.borough}`,
  introContent: `Bringing home a new puppy in ${n.name} is one of the best decisions ${n.borough} residents make — but the first months set the stage for a lifetime of health, and choosing the right food from day one matters. Puppies need carefully balanced levels of protein, calcium, DHA, and controlled calories to grow at a healthy pace. Large breed puppies in particular need special formulas to prevent their bones and joints from developing too fast, while small breed puppies need calorie-dense kibble sized for tiny mouths. Weaning typically happens around 6–8 weeks, so most ${n.name} puppies come home already eating solid food. Petshiwu delivers every major puppy food brand to ${n.name}, including Hill's Science Diet Puppy, Purina Pro Plan Puppy, Royal Canin Puppy, Blue Buffalo Life Protection Puppy, Wellness Core Puppy, and Orijen Puppy. We also carry puppy-specific wet food, training treats sized for small mouths, and transition formulas that help puppies move smoothly from one life stage to the next. Whether you have a 4-week-old Yorkie or a 6-month-old Labrador growing fast in your ${n.borough} apartment, we have the right formula. Our team understands the difference between small breed puppy food (tiny kibble, more calories per cup) and large breed puppy food (controlled calcium and phosphorus for joint protection), and we help ${n.name} owners pick the right one. Free delivery on orders over $49, no subscription, and we're Queens-based for fast NYC service to ${n.name} and nearby ${n.nearbyAreas}.`,
  petType: 'dog' as const,
  problemPoints: [
    `Confusion about which puppy food formula matches your puppy's breed size in ${n.name}`,
    `Limited selection of large breed puppy food at local ${n.borough} pet stores`,
    `Puppy food constantly running out because growing puppies eat fast`,
    `Switching brands mid-way and worrying about digestive upset in your ${n.name} puppy`,
    `Premium puppy formulas priced higher at neighborhood ${n.borough} shops than they should be`,
  ],
  solutionPoints: [
    `Complete puppy food selection delivered to ${n.name} and ${n.nearbyAreas}`,
    `Large breed puppy formulas from Royal Canin, Hill's, Purina, and Orijen to control growth rate`,
    `Small breed puppy formulas with smaller kibble and calorie-dense nutrition`,
    `All life stages covered: 4 weeks, 8 weeks, 4 months, 6 months, and beyond`,
    `Free delivery on orders over $49 — most puppy food orders easily qualify`,
    `Queens-based warehouse for fast delivery to all of ${n.borough}`,
  ],
  faqItems: [
    {
      question: `Do you deliver puppy food to ${n.name}, ${n.borough}?`,
      answer: `Yes — Petshiwu delivers puppy food throughout ${n.name} and the surrounding ${n.borough} area including ${n.nearbyAreas}. We carry Hill's Science Diet Puppy, Purina Pro Plan Puppy, Royal Canin Puppy, and many more. Free delivery on orders over $49.`,
    },
    {
      question: `What puppy food brands do you carry for ${n.name} delivery?`,
      answer: `We carry every major puppy food brand: Hill's Science Diet Puppy, Purina Pro Plan Puppy, Royal Canin Puppy, Blue Buffalo Life Protection Puppy, Wellness Core Puppy, Orijen Puppy, and Merrick Grain-Free Puppy. Formulas for small, medium, and large breeds.`,
    },
    {
      question: `Do you have large breed puppy food for ${n.name} delivery?`,
      answer: `Yes — large breed puppy formulas are a specialty. We carry Royal Canin Large Puppy, Hill's Science Diet Large Breed Puppy, Purina Pro Plan Large Breed Puppy, and Orijen Large Puppy. All are designed to control growth rate and protect developing joints.`,
    },
    {
      question: `How often should I order puppy food delivery in ${n.name}?`,
      answer: `Most puppies in ${n.name} eat a 4–8 lb bag every 3–4 weeks. We recommend auto-replenishing every month so you never run out, but there's no subscription required — order when you need to.`,
    },
    {
      question: `How much does puppy food delivery cost in ${n.name}?`,
      answer: `Delivery to ${n.name} is $6 for orders under $49 and completely free for orders over $49. Most puppy food bags hit the free shipping threshold on their own.`,
    },
  ],
  searchTerms: ['puppy food', 'puppy food delivery', 'large breed puppy food', 'small breed puppy food', 'best puppy food', "Hill's Science Diet Puppy", 'Royal Canin Puppy', 'Purina Pro Plan Puppy'],
});

const seniorDogFoodGenerator: PageGenerator = (n) => ({
  keyword: `senior-dog-food-delivery-${n.slug}`,
  title: `Senior Dog Food Delivery in ${n.name}, ${n.borough} — Same-Day Delivery | Petshiwu`,
  description: `Premium senior dog food delivered in ${n.name}, ${n.borough}. Hill's Science Diet Senior, Purina Pro Plan Senior 7+, Royal Canin Mature. Free shipping over $49. NYC delivery.`,
  h1: `Senior Dog Food Delivery in ${n.name}, ${n.borough}`,
  introContent: `Older dogs in ${n.name} have different nutritional needs than younger adults — fewer calories, more joint-supporting glucosamine and chondroitin, easier-to-digest proteins, and targeted omega-3s for aging brains. ${n.borough} pet owners searching for senior dog food know that switching at the right time can add healthy years to a dog's life. As dogs age, their metabolism slows, kidney function naturally declines, and joint stiffness becomes more common. Senior formulas address all of these concerns with carefully calibrated nutrient profiles. Petshiwu delivers every senior and mature dog formula on the market to ${n.name}: Hill's Science Diet Senior, Hill's Science Diet Perfect Weight 7+, Purina Pro Plan Senior 7+, Royal Canin Mature, Blue Buffalo Life Protection Senior, Wellness Complete Health Senior, Orijen Senior, and more. We also carry cognitive-support formulas with medium-chain triglycerides (MCTs) for aging canine brains, plus dental-focused senior kibble sized for older jaws. Whether your dog is a 7-year-old Labrador slowing down or a 13-year-old Chihuahua whose kidneys need gentler protein, we have the right formula delivered to your door. Our Queens-based team helps ${n.name} owners understand when to transition from adult food (typically around age 7 for large breeds, 8–9 for small breeds) and which formula matches their dog's specific senior needs. Free delivery on orders over $49, no subscription required. Serving all of ${n.name} and ${n.nearbyAreas}.`,
  petType: 'dog' as const,
  problemPoints: [
    `Hard to tell when your dog should switch to a senior formula in ${n.name}`,
    `Limited senior dog food variety at local ${n.borough} stores`,
    `Joint-support and cognitive-support formulas not always in stock nearby`,
    `Weight management for older, less-active dogs is harder than it sounds`,
    `Premium senior brands can be expensive at ${n.borough} shops`,
  ],
  solutionPoints: [
    `Wide senior dog food selection delivered to ${n.name} and ${n.nearbyAreas}`,
    `Hill's Science Diet Senior, Purina Pro Plan Senior 7+, Royal Canin Mature, Orijen Senior`,
    `Joint-support formulas with glucosamine, chondroitin, and omega-3s`,
    `Weight management for less-active senior dogs from Hill's, Purina, and Blue Buffalo`,
    `Free delivery on orders over $49 throughout ${n.borough}`,
    `Queens-based delivery for fast, reliable NYC service to ${n.name}`,
  ],
  faqItems: [
    {
      question: `Do you deliver senior dog food to ${n.name}, ${n.borough}?`,
      answer: `Yes — Petshiwu delivers senior dog food to all of ${n.name} and the surrounding ${n.borough} area including ${n.nearbyAreas}. We carry Hill's Science Diet Senior, Purina Pro Plan Senior 7+, Royal Canin Mature, Orijen Senior, and many more. Free delivery on orders over $49.`,
    },
    {
      question: `What senior dog food brands do you carry for ${n.name} delivery?`,
      answer: `We carry every major senior dog brand: Hill's Science Diet Senior, Hill's Science Diet Perfect Weight 7+, Purina Pro Plan Senior 7+, Royal Canin Mature, Blue Buffalo Life Protection Senior, Wellness Complete Health Senior, Orijen Senior, and Merrick Grain-Free Senior.`,
    },
    {
      question: `When should I switch my dog to senior food in ${n.name}?`,
      answer: `Most veterinarians recommend switching around age 7 for large breeds and 8–9 for small breeds. Senior formulas in ${n.name} are gentler on kidneys, support joints, and help maintain a healthy weight for less-active dogs.`,
    },
    {
      question: `Do you carry joint-support dog food for ${n.name} delivery?`,
      answer: `Yes — we carry joint-support formulas from Purina Pro Plan, Hill's Science Diet, Royal Canin, and Orijen, all with added glucosamine, chondroitin, and omega-3s. Delivered to ${n.name} with free shipping on orders over $49.`,
    },
    {
      question: `Can senior dogs in ${n.name} get weight management food delivered?`,
      answer: `Yes — Hill's Science Diet Perfect Weight 7+, Purina Pro Plan Weight Management, and Royal Canin Satiety Support are all available for delivery to ${n.name}. Great for older dogs that put on weight as activity drops.`,
    },
  ],
  searchTerms: ['senior dog food', 'senior dog food delivery', 'joint support dog food', 'dog food for older dogs', 'weight management dog food', 'Hill\'s Science Diet Senior', 'Purina Pro Plan Senior 7+', 'Royal Canin Mature'],
});

const wetDogFoodGenerator: PageGenerator = (n) => ({
  keyword: `wet-dog-food-delivery-${n.slug}`,
  title: `Wet Dog Food Delivery in ${n.name}, ${n.borough} — Same-Day Delivery | Petshiwu`,
  description: `Premium wet dog food delivered to ${n.name}, ${n.borough}. Hill's Science Diet Savory Stew, Blue Buffalo Homestyle, Royal Canin wet food. Free shipping over $49. NYC-wide.`,
  h1: `Wet Dog Food Delivery in ${n.name}, ${n.borough}`,
  introContent: `Wet dog food plays a special role in many ${n.name} dogs' diets. Whether your pup is a senior who needs more moisture, a picky eater who turns up his nose at kibble, a recovering dog who needs extra hydration, or a small breed that does better on calorie-dense pâté — wet food delivers. Wet food is 70–80% moisture, which makes it an excellent way to keep ${n.borough} dogs hydrated without depending solely on the water bowl — particularly useful during hot NYC summers or for dogs recovering from illness. Petshiwu stocks hundreds of wet dog food varieties delivered to ${n.name}: Hill's Science Diet Savory Stew, Hill's Science Diet Gourmet, Blue Buffalo Homestyle Recipe, Royal Canin Adult In Loaf, Royal Canin Mature, Wellness Core Hearty Cuts, Merrick Grain-Free Chunky, and many more. Cuts, stews, pâtés, gravies, shreds — we have every texture ${n.borough} dogs love. We also carry single-serve trays for portion-controlled feeding and pouches for travel or toppers. Many ${n.name} owners feed a mix of wet and dry to balance cost, hydration, and dental benefit — we make that easy with one combined order. Cases ship fast from our Queens warehouse with free delivery on orders over $49. Serving ${n.name}, ${n.nearbyAreas}, and all of NYC.`,
  petType: 'dog' as const,
  problemPoints: [
    `Carrying heavy cases of cans home from the supermarket in ${n.name}`,
    `Limited wet food variety at local ${n.borough} stores — usually only 4–6 brands`,
    `Senior dogs who refuse dry kibble and need wet food alternatives`,
    `Picky eaters who get bored with the same wet food day after day`,
    `Stockouts on the specific cut or flavor your dog actually likes near ${n.name}`,
  ],
  solutionPoints: [
    `Hundreds of wet dog food varieties delivered to ${n.name} and ${n.nearbyAreas}`,
    `Hill's Savory Stew, Blue Buffalo Homestyle, Royal Canin Loaf, Wellness Core, Merrick Chunky`,
    `Cases of cans, single-serve trays, pouches, and 13 oz cans all available`,
    `Grain-free, sensitive stomach, weight management, and senior wet formulas`,
    `Free delivery on orders over $49 — easy to reach with a single case of cans`,
    `Queens-based for fast NYC delivery to ${n.name} and the entire ${n.borough}`,
  ],
  faqItems: [
    {
      question: `Do you deliver wet dog food to ${n.name}, ${n.borough}?`,
      answer: `Yes — Petshiwu delivers wet dog food throughout ${n.name} and the surrounding ${n.borough} area including ${n.nearbyAreas}. Hill's Savory Stew, Blue Buffalo Homestyle, Royal Canin, Wellness, and many more wet formulas available. Free delivery on orders over $49.`,
    },
    {
      question: `What wet dog food brands do you carry for ${n.name} delivery?`,
      answer: `We carry Hill's Science Diet Savory Stew, Blue Buffalo Homestyle Recipe, Royal Canin Adult In Loaf, Wellness Core Hearty Cuts, Merrick Grain-Free Chunky, Purina Pro Plan, Fancy Feast, Pedigree, and dozens more.`,
    },
    {
      question: `Do you deliver cases of canned dog food to ${n.name}?`,
      answer: `Absolutely — cases of 12 or 24 cans ship fast to ${n.name}. We also offer 6 oz, 13 oz, and single-serve pouches if you'd rather mix and match. Free delivery on orders over $49.`,
    },
    {
      question: `Is wet dog food good for senior dogs in ${n.name}?`,
      answer: `Yes — wet food is excellent for senior dogs. The higher moisture content supports hydration, softer texture is easier on aging teeth, and aroma helps older dogs who lose their sense of smell. We deliver senior wet formulas to ${n.name} from Hill's, Royal Canin, and more.`,
    },
    {
      question: `Can I mix wet and dry dog food for delivery in ${n.name}?`,
      answer: `Of course — many ${n.name} dog owners feed a mix. Order wet food for flavor and moisture plus your regular kibble in one combined shipment. Free delivery on combined orders over $49.`,
    },
  ],
  searchTerms: ['wet dog food', 'canned dog food', 'dog food cans', 'Hill\'s Science Diet Savory Stew', 'Blue Buffalo Homestyle', 'wet dog food delivery', 'Royal Canin wet dog food'],
});

const dryDogFoodGenerator: PageGenerator = (n) => ({
  keyword: `dry-dog-food-delivery-${n.slug}`,
  title: `Dry Dog Food (Kibble) Delivery in ${n.name}, ${n.borough} | Petshiwu`,
  description: `Premium dry dog food (kibble) delivered to ${n.name}, ${n.borough}. Purina ONE, Iams ProActive Health, Hill's, Royal Canin. Free shipping over $49. Queens-based NYC delivery.`,
  h1: `Dry Dog Food (Kibble) Delivery in ${n.name}, ${n.borough}`,
  introContent: `Dry kibble is still the backbone of most ${n.name} dogs' diets — affordable per serving, easy to store, gentle on teeth, and convenient for working ${n.borough} pet owners. The crunchy texture of premium kibble also provides mild dental benefits, scraping plaque off teeth as dogs chew. Modern dry foods come in highly specialized formulas — breed-specific, life-stage specific, size-specific, and activity-level specific — far beyond the generic kibble of decades past. Petshiwu delivers every premium dry dog food brand to ${n.name}: Purina ONE SmartBlend, Purina Pro Plan, Iams ProActive Health, Hill's Science Diet, Royal Canin, Blue Buffalo Life Protection, Wellness Complete Health, Orijen, Acana, and Taste of the Wild. We also carry Royal Canin's breed-specific lines (Yorkie, French Bulldog, Labrador, Golden Retriever, German Shepherd, Dachshund, and more) which are formulated to match the specific jaw shape, coat type, and health predispositions of each breed. From 4 lb bags for small apartments to 40 lb bags for big dogs in ${n.borough} homes, every size ships fast from our Queens warehouse. Free delivery on orders over $49, no subscription required. Serving ${n.name}, ${n.nearbyAreas}, and all of NYC with reliable door-to-door delivery.`,
  petType: 'dog' as const,
  problemPoints: [
    `Hauling heavy 30–40 lb bags of kibble home from ${n.borough} stores`,
    `Limited selection of premium kibble at local ${n.name} shops`,
    `Stockouts of popular brands like Purina ONE or Iams ProActive Health nearby`,
    `Switching kibble formulas causes digestive upset in some ${n.name} dogs`,
    `Hard to find breed-specific or life-stage-specific kibble near ${n.borough}`,
  ],
  solutionPoints: [
    `Wide dry dog food selection delivered to ${n.name} and ${n.nearbyAreas}`,
    `Purina ONE, Iams ProActive Health, Hill's Science Diet, Royal Canin, Blue Buffalo, Orijen, Acana`,
    `Breed-specific formulas: Yorkie, French Bulldog, Labrador, Golden Retriever, German Shepherd`,
    `Life-stage formulas: puppy, adult, senior, and weight management`,
    `Free delivery on orders over $49 — most kibble bags easily qualify`,
    `Queens-based warehouse for fast, reliable delivery to ${n.name} and ${n.borough}`,
  ],
  faqItems: [
    {
      question: `Do you deliver dry dog food to ${n.name}, ${n.borough}?`,
      answer: `Yes — Petshiwu delivers dry dog food (kibble) throughout ${n.name} and the surrounding ${n.borough} area including ${n.nearbyAreas}. Purina ONE, Iams, Hill's Science Diet, Royal Canin, Blue Buffalo, and many more. Free delivery on orders over $49.`,
    },
    {
      question: `What dry dog food brands do you carry for ${n.name} delivery?`,
      answer: `We carry every major dry dog food brand: Purina ONE SmartBlend, Purina Pro Plan, Iams ProActive Health, Hill's Science Diet, Royal Canin, Blue Buffalo Life Protection, Wellness Complete Health, Orijen, Acana, Taste of the Wild, Merrick, and dozens more.`,
    },
    {
      question: `Do you deliver large bags of kibble to ${n.name}?`,
      answer: `Absolutely — we specialize in delivering large, heavy bags of kibble. 30 lb, 35 lb, and 40 lb bags are no problem for our delivery. Free shipping on orders over $49 covers most kibble orders to ${n.name} automatically.`,
    },
    {
      question: `Do you have breed-specific dry dog food for ${n.name} delivery?`,
      answer: `Yes — we carry Royal Canin Breed Health Nutrition for Yorkies, French Bulldogs, Chihuahuas, Labrador Retrievers, Golden Retrievers, German Shepherds, and more. Delivered to ${n.name} with free shipping on orders over $49.`,
    },
    {
      question: `Is dry dog food good for dental health in ${n.name}?`,
      answer: `Yes — the crunch of premium kibble from Hill's Science Diet, Royal Canin, and Purina ONE helps scrape plaque off dogs' teeth as they chew. We deliver dental-focused formulas like Hill's Science Diet Oral Care to ${n.name} and ${n.borough}.`,
    },
  ],
  searchTerms: ['dry dog food', 'dog kibble', 'Purina ONE', 'Iams ProActive Health', 'Hill\'s Science Diet', 'large bag dog food', 'breed-specific dog food', 'kibble delivery'],
});

const grainFreeDogFoodGenerator: PageGenerator = (n) => ({
  keyword: `grain-free-dog-food-delivery-${n.slug}`,
  title: `Grain-Free Dog Food Delivery in ${n.name}, ${n.borough} | Petshiwu`,
  description: `Premium grain-free dog food delivered in ${n.name}, ${n.borough}. Orijen, Acana, Taste of the Wild, Blue Buffalo Wilderness. Free shipping over $49. Queens-based NYC delivery.`,
  h1: `Grain-Free Dog Food Delivery in ${n.name}, ${n.borough}`,
  introContent: `Grain-free dog food remains popular in ${n.name}, particularly among owners whose dogs have shown sensitivity to wheat, corn, or soy. Some ${n.borough} dogs genuinely thrive on grain-free diets — itchy skin, ear infections, and digestive upset often improve when common allergens are removed. Petshiwu delivers every premium grain-free brand to ${n.name}: Orijen, Acana, Taste of the Wild, Blue Buffalo Wilderness, Wellness CORE, Merrick Grain-Free, Nature's Variety Instinct, and more. Each recipe uses meat, fish, sweet potatoes, peas, or lentils in place of grains. We also offer limited-ingredient grain-free diets (Natural Balance L.I.D., Canidae Pure) for ${n.name} dogs with multiple sensitivities. We also want to be transparent: the FDA has been investigating a possible link between some grain-free diets (especially those heavy in peas, lentils, or chickpea flour) and a heart condition called dilated cardiomyopathy (DCM) in dogs. The investigation is ongoing and not conclusive, but ${n.borough} pet owners should know about it. We share this so ${n.name} owners can make informed decisions and talk to their vets about whether grain-free is right for their specific dog. Whether you're committed to grain-free or just exploring alternatives, we deliver the full range of options to ${n.name}, ${n.nearbyAreas}, and all of NYC. Free delivery on orders over $49, no subscription required.`,
  petType: 'dog' as const,
  problemPoints: [
    `Hard to find genuine grain-free kibble (not just grain-included) near ${n.name}`,
    `Confusion about which grain-free brands use quality proteins in ${n.borough}`,
    `FDA's DCM investigation has left many ${n.name} owners unsure about safety`,
    `Grain-free wet and dry often more expensive at local ${n.borough} shops`,
    `Limited selection of exotic protein grain-free options (duck, lamb, rabbit)`,
  ],
  solutionPoints: [
    `Complete grain-free dog food line delivered to ${n.name} and ${n.nearbyAreas}`,
    `Orijen, Acana, Taste of the Wild, Blue Buffalo Wilderness, Wellness CORE, Merrick`,
    `Exotic protein options: duck, lamb, rabbit, venison, salmon, bison`,
    `Both kibble and wet/canned grain-free formulas available`,
    `Free delivery on orders over $49 — Queens-based for fast NYC shipping`,
    `Honest information about FDA's DCM investigation so ${n.name} owners can decide`,
  ],
  faqItems: [
    {
      question: `Do you deliver grain-free dog food to ${n.name}, ${n.borough}?`,
      answer: `Yes — Petshiwu delivers grain-free dog food throughout ${n.name} and the surrounding ${n.borough} area including ${n.nearbyAreas}. We carry Orijen, Acana, Taste of the Wild, Blue Buffalo Wilderness, Wellness CORE, Merrick Grain-Free, and more. Free delivery on orders over $49.`,
    },
    {
      question: `What grain-free dog food brands do you carry for ${n.name} delivery?`,
      answer: `We carry Orijen, Acana, Taste of the Wild, Blue Buffalo Wilderness, Wellness CORE, Merrick Grain-Free, Nature's Variety Instinct, Canidae Pure, Diamond Naturals Grain-Free, and many more — including limited-ingredient diets.`,
    },
    {
      question: `Is grain-free dog food safe for dogs in ${n.name}?`,
      answer: `Most grain-free diets are safe for short-to-medium term feeding, but the FDA has been investigating a possible link between some grain-free diets (especially those heavy in peas or lentils) and a heart condition called DCM. ${n.borough} pet owners should talk to their vet and monitor their dog's health.`,
    },
    {
      question: `Do you carry limited-ingredient grain-free dog food for ${n.name} delivery?`,
      answer: `Yes — we carry limited-ingredient grain-free formulas from Natural Balance L.I.D., Canidae Pure, Wellness Simple, and Merrick Limited Ingredient. These work well for ${n.name} dogs with multiple food sensitivities.`,
    },
    {
      question: `Can I get exotic protein grain-free dog food delivered to ${n.name}?`,
      answer: `Yes — we carry grain-free formulas with duck, lamb, rabbit, venison, salmon, bison, and wild boar from Orijen, Acana, and Nature's Variety. Delivered to ${n.name} with free shipping on orders over $49.`,
    },
  ],
  searchTerms: ['grain-free dog food', 'grain free dog food delivery', 'Orijen', 'Acana', 'Taste of the Wild', 'Blue Buffalo Wilderness', 'limited ingredient dog food', 'DCM grain-free'],
});

const rawDogFoodGenerator: PageGenerator = (n) => ({
  keyword: `raw-dog-food-delivery-${n.slug}`,
  title: `Raw Dog Food Delivery in ${n.name}, ${n.borough} — Same-Day Delivery | Petshiwu`,
  description: `Premium raw dog food delivered to ${n.name}, ${n.borough}. Stella & Chewy's, Primal, Nature's Variety Instinct Raw. Free shipping over $49. Queens-based NYC delivery.`,
  h1: `Raw Dog Food Delivery in ${n.name}, ${n.borough}`,
  introContent: `Raw dog food — frozen patties, freeze-dried nuggets, and complete raw mixes — has become a serious option for ${n.name} pet owners who want to feed biologically appropriate diets. The philosophy behind raw feeding is that dogs evolved eating fresh prey, not cooked kibble, and that raw diets better preserve natural enzymes, amino acids, and micronutrients. Many ${n.borough} dogs see real improvements in coat shine, dental health, energy levels, and digestive consistency on raw diets, particularly those with allergies or chronic skin issues. Petshiwu delivers the leading raw brands to ${n.name}: Stella & Chewy's, Primal Pet Foods, Nature's Variety Instinct Raw, Open Farm, Vital Essentials, and K9 Natural. We carry frozen patties, freeze-dried complete meals, raw bone blends, and whole prey formulas — both prey-model and BARF (Biologically Appropriate Raw Food) approaches. Frozen raw keeps the natural enzymes and nutrients intact and works well for ${n.borough} dogs with allergies, picky appetites, or skin and coat issues. Important safety note: raw diets need careful handling — thaw in the fridge (not on the counter), wash bowls and prep surfaces with hot soapy water, keep separate from human food prep, and wash hands thoroughly after handling. We're Queens-based and ship frozen raw on cold packs to ${n.name} and nearby ${n.nearbyAreas}. Free delivery on orders over $49, no subscription required.`,
  petType: 'dog' as const,
  problemPoints: [
    `Limited selection of frozen raw dog food at local ${n.borough} stores`,
    `Concerns about safe handling and bacterial contamination in ${n.name} apartments`,
    `Hard to find freeze-dried raw options for travel or training treats`,
    `Raw food is expensive per pound compared to kibble`,
    `Confusion about balanced raw diets vs. just plain ground beef`,
  ],
  solutionPoints: [
    `Complete raw dog food line delivered to ${n.name} and ${n.nearbyAreas}`,
    `Stella & Chewy's, Primal, Nature's Variety Instinct Raw, Open Farm, Vital Essentials`,
    `Frozen patties, freeze-dried nuggets, complete raw mixes, and raw bones`,
    `Cold-pack shipping for frozen raw to keep products safe in transit`,
    `Free delivery on orders over $49 throughout ${n.borough}`,
    `Clear handling guidelines included with every raw order to ${n.name}`,
  ],
  faqItems: [
    {
      question: `Do you deliver raw dog food to ${n.name}, ${n.borough}?`,
      answer: `Yes — Petshiwu delivers raw dog food to ${n.name} and the surrounding ${n.borough} area including ${n.nearbyAreas}. We carry Stella & Chewy's, Primal, Nature's Variety Instinct Raw, Open Farm, Vital Essentials, and K9 Natural. Frozen items ship on cold packs. Free delivery on orders over $49.`,
    },
    {
      question: `What raw dog food brands do you carry for ${n.name} delivery?`,
      answer: `We carry Stella & Chewy's (frozen and freeze-dried), Primal Pet Foods, Nature's Variety Instinct Raw Boost, Open Farm, Vital Essentials, K9 Natural, and Northwest Naturals. Beef, chicken, turkey, lamb, venison, and fish proteins.`,
    },
    {
      question: `Is raw dog food safe to feed in ${n.name} apartments?`,
      answer: `Yes — with proper handling. Thaw in the refrigerator (not on the counter), wash bowls and prep surfaces with hot soapy water, keep separate from human food prep, and wash hands after handling. We include safety guidance with every raw order to ${n.name}.`,
    },
    {
      question: `Do you deliver freeze-dried raw dog food to ${n.name}?`,
      answer: `Yes — freeze-dried raw from Stella & Chewy's, Primal, Vital Essentials, and Open Farm is perfect for ${n.name} dog owners who want raw nutrition without frozen storage. Use as a complete meal or topper.`,
    },
    {
      question: `How much does raw dog food delivery cost in ${n.name}?`,
      answer: `Raw dog food runs higher per pound than kibble, but Petshiwu delivers to ${n.name} with free shipping on orders over $49. Buying larger packs brings the per-meal cost down.`,
    },
  ],
  searchTerms: ['raw dog food', 'frozen raw dog food', 'Stella & Chewy\'s', 'Primal raw dog food', 'freeze-dried raw', 'raw dog food delivery', 'biologically appropriate raw food', 'BARF diet'],
});

const dogToysGenerator: PageGenerator = (n) => ({
  keyword: `dog-toys-delivery-${n.slug}`,
  title: `Dog Toys Delivery in ${n.name}, ${n.borough} — Same-Day Delivery | Petshiwu`,
  description: `Premium dog toys delivered to ${n.name}, ${n.borough}. KONG, puzzle toys, chew toys, fetch toys, plush. Free shipping over $49. Queens-based NYC delivery.`,
  h1: `Dog Toys Delivery in ${n.name}, ${n.borough}`,
  introContent: `${n.name} is full of dogs who need stimulation, exercise, and an outlet for their chewing instincts — and the right toys make a real difference in behavior and happiness. ${n.borough} dogs living in apartments without yards especially depend on toys to burn energy and stay mentally engaged. Without proper enrichment, dogs develop destructive chewing, excessive barking, and other behavioral issues. Petshiwu delivers the best dog toys to ${n.name} from KONG, Nylabone, Chuckit, Outward Hound, JW Pet, Bark, Benebone, and many more. We carry KONG classic, KONG extreme, KONG puppy (softer rubber for baby teeth), KONG senior (gentler formula), plus KONG Wobbler and KONG Goodie Bone for treat-dispensing fun. For heavy chewers in ${n.name}, we have Goughnuts indestructible rings, Nylabone power chew, and Bark Super Chewer toys. Puzzle toys from Outward Hound (Hide-A-Squirrel, Brick Puzzle) and JW Pet (Hol-ee Roller) challenge working breeds and high-energy pups mentally. Whether your ${n.borough} pup is a heavy chewer who destroys everything, a senior who needs gentle enrichment, a working breed that needs puzzle toys to stay calm, or a puppy who's just learning fetch — we have the right toys delivered to your door. Free delivery on orders over $49, no subscription required. Queens-based for fast NYC service to ${n.name}, ${n.nearbyAreas}, and all five boroughs.`,
  petType: 'dog' as const,
  problemPoints: [
    `Walking into ${n.borough} pet stores and finding the same 10 toys everywhere`,
    `Heavy chewer who destroys toys within hours in ${n.name}`,
    `Hard to find puzzle toys and enrichment toys locally`,
    `Stuffed toys with squeakers that get ripped apart in 5 minutes`,
    `Hard to know which toy is safe vs. risky (small parts, toxic dyes)`,
  ],
  solutionPoints: [
    `Wide dog toy selection delivered to ${n.name} and ${n.nearbyAreas}`,
    `KONG classic, KONG extreme, KONG puppy, KONG wobbler, KONG goodie bone`,
    `Puzzle toys from Outward Hound, JW Pet, and Bark for mental enrichment`,
    `Indestructible chew toys: Nylabone, Benebone, Goughnuts`,
    `Free delivery on orders over $49 — bulk up your toy box in one order`,
    `Queens-based for fast, reliable NYC delivery to ${n.borough}`,
  ],
  faqItems: [
    {
      question: `Do you deliver dog toys to ${n.name}, ${n.borough}?`,
      answer: `Yes — Petshiwu delivers dog toys throughout ${n.name} and the surrounding ${n.borough} area including ${n.nearbyAreas}. KONG, Nylabone, Chuckit, Outward Hound, JW Pet, Bark, and many more brands. Free delivery on orders over $49.`,
    },
    {
      question: `What dog toy brands do you carry for ${n.name} delivery?`,
      answer: `We carry KONG, Nylabone, Chuckit, Outward Hound, JW Pet, Bark, Benebone, Goughnuts, Planet Dog, ZippyPaws, Tuffy, and many more. Plush, rubber, rope, fetch, puzzle, and chew toys all available.`,
    },
    {
      question: `Do you have indestructible dog toys for heavy chewers in ${n.name}?`,
      answer: `Yes — we carry Goughnuts indestructible rings, KONG Extreme, Nylabone power chew, Benebone wishbone, and Bark Super Chewer toys. All designed for dogs who destroy regular toys within minutes.`,
    },
    {
      question: `Do you deliver puzzle toys for dogs in ${n.name}?`,
      answer: `Yes — we carry Outward Hound Hide-A-Squirrel, KONG Wobbler, JW Pet Hol-ee Roller, and Bark puzzle toys that challenge ${n.name} dogs mentally. Great for working breeds and high-energy pups.`,
    },
    {
      question: `Can I get KONG toys delivered to ${n.name}?`,
      answer: `Absolutely — we carry the full KONG line: KONG Classic, KONG Extreme, KONG Puppy, KONG Senior, KONG Wobbler, KONG Goodie Bone, and KONG Tennis Ball. Free shipping on orders over $49 to ${n.name} and ${n.borough}.`,
    },
  ],
  searchTerms: ['dog toys', 'dog toy delivery', 'KONG toys', 'puzzle toys for dogs', 'indestructible dog toys', 'chew toys for dogs', 'puppy toys', 'fetch toys'],
});

const dogBedsGenerator: PageGenerator = (n) => ({
  keyword: `dog-beds-delivery-${n.slug}`,
  title: `Dog Beds Delivery in ${n.name}, ${n.borough} — Same-Day Delivery | Petshiwu`,
  description: `Premium dog beds delivered to ${n.name}, ${n.borough}. Orthopedic, calming, K&H, Furhaven, large breed. Free shipping over $49. Queens-based NYC delivery.`,
  h1: `Dog Beds Delivery in ${n.name}, ${n.borough}`,
  introContent: `${n.name} dogs deserve a comfortable, supportive place to rest — and the right bed matters for joint health, anxiety, and overall well-being. A typical ${n.borough} dog sleeps 12–14 hours a day, so the bed they sleep on directly impacts their joint health, muscle recovery, and behavior. Premium orthopedic beds use human-grade memory foam that maintains its shape over years, unlike cheap polyfill beds that flatten within months. Petshiwu delivers premium dog beds to ${n.name} from K&H Pet Products, Furhaven, Big Barker (orthopedic for large breeds), PetFusion, Bedsure, and MidWest. Whether your ${n.borough} pup needs an orthopedic memory foam bed for arthritic joints, a calming donut bed with raised edges for separation anxiety, a heated bed for cold NYC winters, or a simple bolster bed for everyday comfort, we have the right fit. For large breeds in ${n.name} (Mastiffs, Great Danes, St. Bernards, Newfoundlands), Big Barker beds are specifically engineered with 7-inch thick foam and a 10-year warranty. Calming donut beds from Furhaven and Best Friends by Sheri create a sense of security with raised edges that ${n.name} dogs love. Sizes from XS to XXL to accommodate every breed, plus waterproof liners, replacement covers, and machine-washable options. Free delivery on orders over $49, no subscription required. Serving ${n.name}, ${n.nearbyAreas}, and all of NYC.`,
  petType: 'dog' as const,
  problemPoints: [
    `Bulky dog beds are awkward to carry home from ${n.borough} pet stores`,
    `Hard to find orthopedic beds for senior or large breed dogs near ${n.name}`,
    `Calming beds for anxious ${n.name} dogs often expensive and limited in style`,
    `Standard beds lose shape within months for chewers and diggers`,
    `Wrong-sized bed picked because stores don't let dogs try them out`,
  ],
  solutionPoints: [
    `Wide dog bed selection delivered to ${n.name} and ${n.nearbyAreas}`,
    `Orthopedic memory foam beds from Big Barker, PetFusion, and Furhaven`,
    `Calming donut beds with raised edges for anxious ${n.name} dogs`,
    `Heated beds and self-warming beds for cold ${n.borough} winters`,
    `Crate mats, bolster beds, sofa-style beds, and outdoor beds`,
    `Free delivery on orders over $49 — bulk dog beds ship free to ${n.name}`,
  ],
  faqItems: [
    {
      question: `Do you deliver dog beds to ${n.name}, ${n.borough}?`,
      answer: `Yes — Petshiwu delivers dog beds throughout ${n.name} and the surrounding ${n.borough} area including ${n.nearbyAreas}. K&H, Furhaven, Big Barker, PetFusion, Bedsure, and many more brands. Free delivery on orders over $49.`,
    },
    {
      question: `What dog bed brands do you carry for ${n.name} delivery?`,
      answer: `We carry K&H Pet Products, Furhaven, Big Barker (orthopedic for large breeds), PetFusion, Bedsure, MidWest, Majestic Pet, and many more. Orthopedic, calming, heated, bolster, and crate beds.`,
    },
    {
      question: `Do you have orthopedic dog beds for senior dogs in ${n.name}?`,
      answer: `Yes — we carry orthopedic memory foam beds from Big Barker, PetFusion, and Furhaven that relieve joint pressure for senior dogs, large breeds, and dogs with arthritis. All delivered to ${n.name} with free shipping on orders over $49.`,
    },
    {
      question: `Do you have calming beds for anxious dogs in ${n.name}?`,
      answer: `Yes — we carry calming donut-style beds with raised edges from Furhaven and Best Friends by Sheri. These create a sense of security that helps ${n.name} dogs with separation anxiety feel more relaxed.`,
    },
    {
      question: `What size dog bed should I order for delivery in ${n.name}?`,
      answer: `Measure your dog from nose to tail and add 6–12 inches. We stock XS, S, M, L, XL, and XXL beds. For ${n.borough} apartments, jumbo and XXL orthopedic beds work great for Mastiffs, Great Danes, and Labradors.`,
    },
  ],
  searchTerms: ['dog beds', 'orthopedic dog bed', 'calming dog bed', 'large dog bed', 'dog bed delivery', 'Big Barker', 'K&H dog bed', 'heated dog bed'],
});

const dogCratesGenerator: PageGenerator = (n) => ({
  keyword: `dog-crates-delivery-${n.slug}`,
  title: `Dog Crates Delivery in ${n.name}, ${n.borough} — Same-Day Delivery | Petshiwu`,
  description: `Premium dog crates delivered to ${n.name}, ${n.borough}. MidWest wire crates, plastic kennels, soft-sided crates. Free shipping over $49. Queens-based NYC delivery.`,
  h1: `Dog Crates Delivery in ${n.name}, ${n.borough}`,
  introContent: `Dog crates serve as training tools, safe spaces, travel carriers, and vet-visit essentials for ${n.name} dog owners. In NYC apartments especially, crates give dogs a quiet den of their own and help with housetraining, separation anxiety, and managing destructive behavior when owners are at work. Veterinarians also recommend crate training as part of preparation for emergencies, vet visits, and travel. Petshiwu delivers the leading crate brands to ${n.name}: MidWest Homes for Pets wire crates, MidWest iCrate (folding double-door design), Frisco crates, Petmate plastic kennels, Petnation Port-A-Crate (soft-sided), and Diggs Revol (award-winning collapsible crate). Sizing matters: your ${n.borough} dog should be able to stand up, turn around, and lie down comfortably without touching the sides. We carry sizes from XXS for Chihuahuas, Yorkies, and toy breeds to XXL for Great Danes, Mastiffs, and other giant breeds. We also stock divider panels for growing puppies — start with a smaller space and expand as the puppy grows — plus replacement trays, crate mats, and soft crate liners. Free delivery on orders over $49, no subscription required. Queens-based for fast NYC service to ${n.name}, ${n.nearbyAreas}, and all five boroughs.`,
  petType: 'dog' as const,
  problemPoints: [
    `Bulky wire crates are hard to fit in cars and ${n.borough} apartment elevators`,
    `Confusion about the right crate size for ${n.name} dog breeds`,
    `Limited selection of heavy-duty crates for strong or anxious dogs`,
    `Plastic kennels for air travel hard to find in ${n.name} shops`,
    `Soft-sided crates and designer crates often expensive at ${n.borough} stores`,
  ],
  solutionPoints: [
    `Wide dog crate selection delivered to ${n.name} and ${n.nearbyAreas}`,
    `MidWest iCrate, MidWest wire crate, Frisco, Petmate, Petnation, Diggs Revol`,
    `All sizes: XXS for small breeds through XXL for Great Danes and Mastiffs`,
    `Divider panels for growing puppies so the crate grows with the dog`,
    `Free delivery on orders over $49 — bulk crates ship free to ${n.name}`,
    `Queens-based for fast, reliable NYC delivery to ${n.borough}`,
  ],
  faqItems: [
    {
      question: `Do you deliver dog crates to ${n.name}, ${n.borough}?`,
      answer: `Yes — Petshiwu delivers dog crates throughout ${n.name} and the surrounding ${n.borough} area including ${n.nearbyAreas}. MidWest, Frisco, Petmate, Petnation, Diggs, and many more. Free delivery on orders over $49.`,
    },
    {
      question: `What dog crate brands do you carry for ${n.name} delivery?`,
      answer: `We carry MidWest Homes for Pets (iCrate, wire crate, double door), Frisco, Petmate (plastic kennels), Petnation Port-A-Crate, Diggs Revol, and Carlson. Wire, plastic, soft-sided, and heavy-duty crates all available.`,
    },
    {
      question: `What size crate does my dog need in ${n.name}?`,
      answer: `Your dog should be able to stand up without crouching, turn around, and lie down. Add 2–4 inches to your dog's height for wire crates. We have a sizing guide for ${n.name} dog owners selecting crates for any breed.`,
    },
    {
      question: `Do you deliver heavy-duty dog crates for ${n.name} dogs?`,
      answer: `Yes — we carry heavy-duty wire crates with reinforced frames for strong dogs like Pit Bulls, German Shepherds, and Huskies. The MidWest iCrate and XL wire crates ship to ${n.name} with free delivery on orders over $49.`,
    },
    {
      question: `Do you carry airline-approved plastic dog crates for ${n.name}?`,
      answer: `Yes — Petmate plastic kennels in sizes 100, 200, 300, 400, and 500 are all airline-approved and delivered to ${n.name}. Great for travel and vet visits from ${n.borough}.`,
    },
  ],
  searchTerms: ['dog crates', 'wire dog crate', 'MidWest iCrate', 'plastic dog kennel', 'soft dog crate', 'dog crate delivery', 'large dog crate', 'puppy crate'],
});

const dogGroomingGenerator: PageGenerator = (n) => ({
  keyword: `dog-grooming-delivery-${n.slug}`,
  title: `Dog Grooming Supplies Delivery in ${n.name}, ${n.borough} | Petshiwu`,
  description: `Premium dog grooming supplies delivered to ${n.name}, ${n.borough}. Brushes, shampoos, nail clippers, deshedding tools. Free shipping over $49. Queens-based NYC delivery.`,
  h1: `Dog Grooming Supplies Delivery in ${n.name}, ${n.borough}`,
  introContent: `Regular grooming keeps ${n.name} dogs healthy, comfortable, and looking their best — but ${n.borough} groomer appointments cost $75–$150 per visit, and many pet owners prefer handling routine maintenance at home. Home grooming also strengthens the bond between owner and dog, lets you spot skin issues, lumps, or parasites early, and reduces stress for dogs who hate the grooming salon. Petshiwu delivers professional-grade dog grooming supplies to ${n.name}: brushes from Hertzko and FURminator, deshedding tools, nail clippers and grinders, dog shampoos from Earthbath and Burt's Bees, ear cleaners, toothbrushes and toothpaste, and grooming tables for serious home groomers. We carry slicker brushes (great for most coats), pin brushes (for long-haired breeds), bristle brushes (for short-haired smooth coats), undercoat rakes (essential for Huskies, Malamutes, and other double-coated breeds), and deshedding tools that pull loose undercoat without damaging topcoat. Nail clippers come in scissor, guillotine, and rechargeable grinder styles (Andis, Wahl). Shampoos include Earthbath Oatmeal & Aloe for sensitive skin, Burt's Bees Hypoallergenic, medicated formulas for skin conditions, and flea formulas. From Yorkies needing daily brushing to Labs who shed year-round, Huskies needing undercoat rakes, and seniors who need gentle paw care — we have the right tools delivered. Free delivery on orders over $49, no subscription required. Serving ${n.name}, ${n.nearbyAreas}, and all of NYC.`,
  petType: 'dog' as const,
  problemPoints: [
    `Limited selection of professional grooming tools at ${n.borough} stores`,
    `Slicker brushes, undercoat rakes, and deshedding tools hard to find near ${n.name}`,
    `Dog shampoos for sensitive skin often out of stock locally`,
    `Nail clippers and grinders hard to evaluate without trying them`,
    `${n.borough} groomer appointments cost $75–$150 per visit — at-home maintenance saves money`,
  ],
  solutionPoints: [
    `Wide dog grooming supply selection delivered to ${n.name} and ${n.nearbyAreas}`,
    `Slicker brushes, pin brushes, undercoat rakes from Hertzko, FURminator, and Paw Brothers`,
    `Deshedding tools for Labs, Huskies, German Shepherds, and other heavy shedders`,
    `Dog shampoos: Earthbath, Burt's Bees, Oatmeal, hypoallergenic, and flea formulas`,
    `Nail clippers, grinders, ear cleaners, toothbrushes, and toothpaste`,
    `Free delivery on orders over $49 — bulk grooming supplies ship free to ${n.name}`,
  ],
  faqItems: [
    {
      question: `Do you deliver dog grooming supplies to ${n.name}, ${n.borough}?`,
      answer: `Yes — Petshiwu delivers dog grooming supplies throughout ${n.name} and the surrounding ${n.borough} area including ${n.nearbyAreas}. Brushes, shampoos, nail clippers, deshedding tools, ear cleaners, and more. Free delivery on orders over $49.`,
    },
    {
      question: `What dog grooming brands do you carry for ${n.name} delivery?`,
      answer: `We carry Hertzko, FURminator, Paw Brothers, Andis, Wahl, Earthbath, Burt's Bees, TropiClean, Vet's Best, and many more. Professional-grade brushes, clippers, nail grinders, and shampoos.`,
    },
    {
      question: `Do you have deshedding tools for ${n.name} dogs?`,
      answer: `Yes — we carry FURminator deShedding tools, Hertzko self-cleaning slicker brushes, undercoat rakes, and shedding blades. Perfect for ${n.borough} Labs, Huskies, German Shepherds, and Golden Retrievers who shed year-round.`,
    },
    {
      question: `Do you deliver dog nail clippers and grinders to ${n.name}?`,
      answer: `Yes — we carry nail clippers for small to giant breeds plus rechargeable nail grinders from Andis and Wahl. Delivered to ${n.name} with free shipping on orders over $49.`,
    },
    {
      question: `What shampoo is best for sensitive-skin dogs in ${n.name}?`,
      answer: `We deliver Earthbath Oatmeal & Aloe, Burt's Bees Hypoallergenic, Vet's Best Sensitive Skin, and TropiClean hypoallergenic formulas to ${n.name}. All gentle and free of harsh sulfates.`,
    },
  ],
  searchTerms: ['dog grooming supplies', 'dog brush', 'dog shampoo', 'nail clippers for dogs', 'deshedding tool', 'FURminator', 'dog grooming delivery', 'dog nail grinder'],
});

const kittenFoodGenerator: PageGenerator = (n) => ({
  keyword: `kitten-food-delivery-${n.slug}`,
  title: `Kitten Food Delivery in ${n.name}, ${n.borough} — Same-Day Delivery | Petshiwu`,
  description: `Premium kitten food delivered to ${n.name}, ${n.borough}. Hill's Science Diet Kitten, Royal Canin Kitten, high-protein formulas. Free shipping over $49. NYC delivery.`,
  h1: `Kitten Food Delivery in ${n.name}, ${n.borough}`,
  introContent: `Kittens in ${n.name} grow at a remarkable pace — they typically double their birth weight in the first week and continue growing rapidly for 12 months. They need food specifically designed for that growth, with higher levels of protein, fat, and key nutrients like DHA for brain development and calcium for bone growth. Adult cat food simply doesn't have enough of these critical nutrients for kittens to develop properly. Petshiwu delivers every major kitten food brand to ${n.name}: Hill's Science Diet Kitten, Royal Canin Kitten, Purina Pro Plan Kitten, Blue Buffalo Wilderness Kitten, Wellness Core Kitten, and Orijen Cat & Kitten. We carry dry kibble, wet food (pâté, cuts, shreds), and mixed-feeding options, plus growth-stage transitions for kittens moving toward adult food around 12 months. Royal Canin's breed-specific kitten food (Maine Coon Kitten, Persian Kitten, British Shorthair Kitten) addresses the unique needs of large and long-haired breeds. Whether you just adopted a 6-week-old kitten from a ${n.borough} rescue or are feeding a 6-month-old growing furball, we have the right formula delivered to your door. Free delivery on orders over $49, no subscription required. Serving ${n.name}, ${n.nearbyAreas}, and all of NYC.`,
  petType: 'cat' as const,
  problemPoints: [
    `Limited kitten-specific formulas at local ${n.borough} pet stores`,
    `Confusion about when to switch from kitten to adult food in ${n.name}`,
    `Wet kitten food options often expensive and limited locally`,
    `High-protein kitten formulas hard to find in NYC ${n.borough} shops`,
    `Brand-hopping because kittens are picky eaters`,
  ],
  solutionPoints: [
    `Complete kitten food line delivered to ${n.name} and ${n.nearbyAreas}`,
    `Hill's Science Diet Kitten, Royal Canin Kitten, Purina Pro Plan Kitten, Wellness Core Kitten`,
    `Wet food, dry food, and mixed-feeding options`,
    `Growth-stage formulas for kittens 6 weeks to 12 months`,
    `Free delivery on orders over $49 throughout ${n.borough}`,
    `Queens-based for fast NYC delivery to ${n.name}`,
  ],
  faqItems: [
    {
      question: `Do you deliver kitten food to ${n.name}, ${n.borough}?`,
      answer: `Yes — Petshiwu delivers kitten food throughout ${n.name} and the surrounding ${n.borough} area including ${n.nearbyAreas}. Hill's Science Diet Kitten, Royal Canin Kitten, Purina Pro Plan Kitten, and more. Free delivery on orders over $49.`,
    },
    {
      question: `What kitten food brands do you carry for ${n.name} delivery?`,
      answer: `We carry Hill's Science Diet Kitten, Royal Canin Kitten, Purina Pro Plan Kitten, Blue Buffalo Wilderness Kitten, Wellness Core Kitten, Orijen Cat & Kitten, Fancy Feast Kitten, and many more. Wet and dry formulas available.`,
    },
    {
      question: `When should kittens in ${n.name} switch to adult cat food?`,
      answer: `Most kittens can transition to adult food around 12 months, though large breeds like Maine Coons benefit from kitten food until 18 months. ${n.borough} kittens should stay on kitten food for healthy growth.`,
    },
    {
      question: `Do you deliver wet kitten food to ${n.name}?`,
      answer: `Yes — we carry Hill's Science Diet Kitten wet food, Royal Canin Kitten In Sauce, Wellness Core Kitten pâté, and many more wet kitten formulas. Cases of cans and single-serve trays all available for delivery to ${n.name}.`,
    },
    {
      question: `How much kitten food should I order for delivery in ${n.name}?`,
      answer: `Kittens in ${n.name} typically eat a 3–6 lb bag of dry food per month and 1–2 cases of wet food per month. Free shipping on orders over $49 makes regular delivery easy.`,
    },
  ],
  searchTerms: ['kitten food', 'kitten food delivery', 'Hill\'s Science Diet Kitten', 'Royal Canin Kitten', 'high-protein kitten food', 'wet kitten food', 'best kitten food'],
});

const seniorCatFoodGenerator: PageGenerator = (n) => ({
  keyword: `senior-cat-food-delivery-${n.slug}`,
  title: `Senior Cat Food Delivery in ${n.name}, ${n.borough} — Same-Day Delivery | Petshiwu`,
  description: `Premium senior cat food delivered in ${n.name}, ${n.borough}. Hill's Science Diet Senior 7+, Purina Pro Plan Senior, kidney support. Free shipping over $49. NYC-wide.`,
  h1: `Senior Cat Food Delivery in ${n.name}, ${n.borough}`,
  introContent: `Senior cats — typically 7 years and older — need food tailored to slower metabolisms, kidney support, easier-to-digest proteins, and joint health. As cats age, they become less efficient at processing protein and phosphorus, which can stress aging kidneys. They also tend to lose muscle mass and may have dental issues that make chewing harder. Senior cat formulas address all of these concerns with controlled mineral levels, highly digestible proteins, and softer kibble textures. Petshiwu delivers every senior cat formula to ${n.name}: Hill's Science Diet Senior 7+, Hill's Science Diet Senior Hairball, Purina Pro Plan Senior, Royal Canin Indoor 7+, Royal Canin Mature, Blue Buffalo Life Protection Senior, Wellness Complete Health Senior, and Orijen Cat & Kitten (for active seniors who need more calories). ${n.borough} cat owners searching for kidney-support diets can find Hill's Prescription Diet k/d and Royal Canin Renal Support through our vet-diet line — these therapeutic formulas are specifically designed for cats with diagnosed kidney disease. We also carry senior wet food formulas for ${n.name} cats who need easier-to-eat textures. Free delivery on orders over $49, no subscription required. Queens-based for fast NYC service to ${n.name}, ${n.nearbyAreas}, and all five boroughs.`,
  petType: 'cat' as const,
  problemPoints: [
    `Hard to tell when cats should switch to senior food in ${n.name}`,
    `Limited senior cat food options at ${n.borough} stores`,
    `Kidney-support formulas not always in stock nearby`,
    `Older cats losing weight need calorie-dense senior food hard to find`,
    `Sensitive stomach senior formulas often expensive at ${n.borough} shops`,
  ],
  solutionPoints: [
    `Wide senior cat food line delivered to ${n.name} and ${n.nearbyAreas}`,
    `Hill's Science Diet Senior 7+, Purina Pro Plan Senior, Royal Canin Mature, Wellness Senior`,
    `Kidney-support formulas: Hill's k/d, Royal Canin Renal, and other vet diets`,
    `Weight management for less-active senior cats`,
    `Free delivery on orders over $49 throughout ${n.borough}`,
    `Queens-based delivery for fast, reliable NYC service to ${n.name}`,
  ],
  faqItems: [
    {
      question: `Do you deliver senior cat food to ${n.name}, ${n.borough}?`,
      answer: `Yes — Petshiwu delivers senior cat food throughout ${n.name} and the surrounding ${n.borough} area including ${n.nearbyAreas}. Hill's Science Diet Senior 7+, Purina Pro Plan Senior, Royal Canin Mature, and more. Free delivery on orders over $49.`,
    },
    {
      question: `What senior cat food brands do you carry for ${n.name} delivery?`,
      answer: `We carry Hill's Science Diet Senior 7+, Purina Pro Plan Senior, Royal Canin Indoor 7+, Royal Canin Mature, Blue Buffalo Life Protection Senior, Wellness Complete Health Senior, and Orijen. Wet and dry formulas.`,
    },
    {
      question: `When should cats in ${n.name} switch to senior food?`,
      answer: `Most veterinarians recommend switching around age 7. Senior formulas support kidney function, joint health, and weight management for less-active ${n.borough} cats. Talk to your vet about the right time for your cat.`,
    },
    {
      question: `Do you have kidney-support cat food for ${n.name} delivery?`,
      answer: `Yes — Hill's Prescription Diet k/d, Royal Canin Renal Support, and Purina Pro Plan NF are all available for delivery to ${n.name}. These support kidney function in cats with chronic kidney disease.`,
    },
    {
      question: `Is senior wet cat food available for delivery in ${n.name}?`,
      answer: `Yes — wet senior formulas from Hill's, Royal Canin, and Wellness deliver hydration plus easier-to-eat texture. We ship wet senior cat food to ${n.name} with free shipping on orders over $49.`,
    },
  ],
  searchTerms: ['senior cat food', 'senior cat food delivery', 'Hill\'s Science Diet Senior 7+', 'Purina Pro Plan Senior', 'kidney support cat food', 'cat food for older cats', 'Royal Canin Mature'],
});

const wetCatFoodGenerator: PageGenerator = (n) => ({
  keyword: `wet-cat-food-delivery-${n.slug}`,
  title: `Wet Cat Food Delivery in ${n.name}, ${n.borough} — Same-Day Delivery | Petshiwu`,
  description: `Premium wet cat food delivered in ${n.name}, ${n.borough}. Fancy Feast, Sheba, Friskies, Hill's, Royal Canin. Free shipping over $49. Queens-based NYC delivery.`,
  h1: `Wet Cat Food Delivery in ${n.name}, ${n.borough}`,
  introContent: `Cats are notoriously low-water drinkers — they evolved from desert-dwelling ancestors who got most of their moisture from prey. Domestic cats often don't drink enough water on their own, and chronic mild dehydration contributes to urinary tract issues, kidney problems, and constipation in ${n.name} cats. Wet food plays a critical role in keeping ${n.name} cats hydrated and healthy, with 70–80% moisture content. Wet food also helps with urinary tract health, weight management (cats feel fuller on wet food), and palatability for picky eaters — the strong aroma of wet food appeals to cats who turn up their noses at kibble. Petshiwu delivers the broadest selection of wet cat food in NYC to ${n.name}: Fancy Feast, Sheba Perfect Portions, Friskies, Hill's Science Diet Gourmet, Royal Canin Feline In Loaf, Wellness Core, Blue Buffalo Tastefuls, Tiki Cat, and many more. Cuts, pâtés, gravies, broths, shreds — every texture your ${n.borough} cat loves. Cases of cans, single-serve trays (perfect for portion control), and pouches (great for travel) all delivered. Free delivery on orders over $49, no subscription required.`,
  petType: 'cat' as const,
  problemPoints: [
    `Heavy cases of wet cat food cans are awkward to carry in ${n.name}`,
    `Limited wet food variety at ${n.borough} stores — usually just Fancy Feast and Friskies`,
    `Picky cats that get bored with the same flavor day after day`,
    `Single-serve trays and Perfect Portions hard to find in bulk locally`,
    `Premium wet food brands like Tiki Cat often not stocked near ${n.name}`,
  ],
  solutionPoints: [
    `Wide wet cat food selection delivered to ${n.name} and ${n.nearbyAreas}`,
    `Fancy Feast, Sheba, Friskies, Hill's, Royal Canin, Wellness, Tiki Cat, and more`,
    `Cuts, pâtés, gravies, broths, shreds — every texture available`,
    `Cases of cans, single-serve trays, and 1.5 oz pouches`,
    `Free delivery on orders over $49 — easy to reach with a single case of cans`,
    `Queens-based for fast NYC delivery to ${n.name} and the entire ${n.borough}`,
  ],
  faqItems: [
    {
      question: `Do you deliver wet cat food to ${n.name}, ${n.borough}?`,
      answer: `Yes — Petshiwu delivers wet cat food throughout ${n.name} and the surrounding ${n.borough} area including ${n.nearbyAreas}. Fancy Feast, Sheba, Friskies, Hill's, Royal Canin, Wellness, and more. Free delivery on orders over $49.`,
    },
    {
      question: `What wet cat food brands do you carry for ${n.name} delivery?`,
      answer: `We carry Fancy Feast, Sheba Perfect Portions, Friskies, Hill's Science Diet Gourmet, Royal Canin Feline In Loaf, Wellness Core, Blue Buffalo Tastefuls, Tiki Cat, Merrick, and many more.`,
    },
    {
      question: `Do you deliver cases of canned cat food to ${n.name}?`,
      answer: `Absolutely — cases of 12 or 24 cans ship fast to ${n.name}. We also offer single-serve trays (1.5 oz to 3 oz) and 6 oz cans for ${n.borough} cats on portion control.`,
    },
    {
      question: `Is wet cat food good for hydration in ${n.name} cats?`,
      answer: `Yes — wet food is 70–80% moisture and helps keep ${n.name} cats hydrated. Especially important for cats that don't drink enough water or have urinary tract issues. Pair with fresh water for best results.`,
    },
    {
      question: `Can I get variety packs of wet cat food delivered to ${n.name}?`,
      answer: `Yes — we carry Fancy Feast and Friskies variety packs with multiple flavors. Great for picky ${n.borough} cats that get bored with the same flavor. Free shipping on orders over $49.`,
    },
  ],
  searchTerms: ['wet cat food', 'canned cat food', 'Fancy Feast', 'Sheba Perfect Portions', 'wet cat food delivery', 'Friskies', 'Hill\'s wet cat food', 'cat food cans'],
});

const catLitterBoxesGenerator: PageGenerator = (n) => ({
  keyword: `cat-litter-boxes-delivery-${n.slug}`,
  title: `Cat Litter Boxes Delivery in ${n.name}, ${n.borough} | Petshiwu`,
  description: `Premium cat litter boxes delivered in ${n.name}, ${n.borough}. Covered, open, self-cleaning, sifting. Free shipping over $49. Queens-based NYC delivery.`,
  h1: `Cat Litter Boxes Delivery in ${n.name}, ${n.borough}`,
  introContent: `${n.name} cat owners need litter boxes that fit their apartments, their cats' preferences, and their cleaning routines. The general rule is one litter box per cat plus one extra, so ${n.borough} multi-cat households often need 3–5 boxes spread throughout the home. Choosing the right style matters: some cats prefer covered boxes for privacy, others hate them; some owners love self-cleaning systems, others prefer the simplicity of a basic pan. Petshiwu delivers every style of litter box to ${n.name}: covered/hooded boxes (helps contain odor in small NYC apartments), open pans (most cats' preference), top-entry boxes (Modkat — keeps dogs out, reduces litter scatter), self-cleaning boxes (PetSafe ScoopFree — auto-rakes after each use), sifting boxes (easy to clean without liners), and disposable litter box liners. Brands include Petmate, IRIS, Modkat (designer top-entry), PetSafe ScoopFree (self-cleaning), Nature's Miracle, and Frisco. Whether you live in a small ${n.borough} studio and need a discreet covered box, or have a multi-cat household needing jumbo self-cleaning systems, we have the right litter box delivered. We also stock litter mats, hood replacements, replacement rakes for self-cleaning boxes, and litter box furniture (decorative cabinets that hide the box). Free delivery on orders over $49, no subscription required. Serving ${n.name}, ${n.nearbyAreas}, and all of NYC.`,
  petType: 'cat' as const,
  problemPoints: [
    `Bulky litter boxes awkward to bring home from ${n.borough} stores`,
    `Limited selection of self-cleaning litter boxes near ${n.name}`,
    `Designer top-entry boxes (Modkat) hard to find locally`,
    `Hard to find jumbo litter boxes for multi-cat ${n.name} households`,
    `Litter box liners and replacement trays often out of stock at ${n.borough} shops`,
  ],
  solutionPoints: [
    `Wide litter box selection delivered to ${n.name} and ${n.nearbyAreas}`,
    `Covered boxes, open boxes, top-entry boxes, and self-cleaning boxes`,
    `Petmate, IRIS, Modkat, PetSafe ScoopFree, Nature's Miracle, Frisco`,
    `Sizes for single cats through multi-cat households`,
    `Free delivery on orders over $49 — bulk litter boxes ship free to ${n.name}`,
    `Queens-based for fast NYC delivery to ${n.borough}`,
  ],
  faqItems: [
    {
      question: `Do you deliver litter boxes to ${n.name}, ${n.borough}?`,
      answer: `Yes — Petshiwu delivers cat litter boxes throughout ${n.name} and the surrounding ${n.borough} area including ${n.nearbyAreas}. Covered, open, top-entry, and self-cleaning boxes available. Free delivery on orders over $49.`,
    },
    {
      question: `What litter box brands do you carry for ${n.name} delivery?`,
      answer: `We carry Petmate, IRIS, Modkat (designer top-entry), PetSafe ScoopFree (self-cleaning), Nature's Miracle, Frisco, and more. Plus litter box liners, replacement trays, and litter mats.`,
    },
    {
      question: `Do you deliver self-cleaning litter boxes to ${n.name}?`,
      answer: `Yes — PetSafe ScoopFree self-cleaning litter boxes ship to ${n.name}. They use disposable trays that automatically rake after each use — perfect for ${n.borough} cat owners with busy schedules.`,
    },
    {
      question: `What size litter box do I need for ${n.name} cats?`,
      answer: `Standard rule: litter box should be 1.5 times the length of your cat. For multi-cat ${n.borough} households, one litter box per cat plus one extra. We stock sizes from small to jumbo.`,
    },
    {
      question: `Do you carry litter box liners and accessories for ${n.name}?`,
      answer: `Yes — disposable liners, sifting liners, litter mats, litter box furniture/coverings, and replacement filters all available for delivery to ${n.name} with free shipping on orders over $49.`,
    },
  ],
  searchTerms: ['cat litter box', 'covered litter box', 'self-cleaning litter box', 'Modkat', 'PetSafe ScoopFree', 'top-entry litter box', 'litter box delivery', 'litter box liners'],
});

const catScratcherGenerator: PageGenerator = (n) => ({
  keyword: `cat-scratcher-delivery-${n.slug}`,
  title: `Cat Scratcher & Scratching Posts Delivery in ${n.name}, ${n.borough} | Petshiwu`,
  description: `Cat scratchers and scratching posts delivered to ${n.name}, ${n.borough}. Sisal, cardboard, cat trees. Free shipping over $49. Queens-based NYC delivery.`,
  h1: `Cat Scratcher & Scratching Posts Delivery in ${n.name}, ${n.borough}`,
  introContent: `Scratching is a hardwired cat behavior — it's how they stretch, mark territory (scent glands in their paws leave visual and olfactory marks), and keep their claws healthy by shedding the outer husks. ${n.name} cat owners who don't provide a designated scratcher end up with destroyed sofas, curtains, and carpets. The right scratcher also gives indoor ${n.borough} cats an essential physical and mental outlet. Petshiwu delivers every style of cat scratcher to ${n.name}: vertical scratching posts (most cats' preference for full-body stretching), horizontal cardboard scratchers (great for cats who scratch carpets), sisal rope posts (most durable), cat trees with built-in scratchers (combine vertical space + scratcher), multi-level towers, and replacement scratcher pads. The general rule is to provide scratchers at least 28–32 inches tall for full stretching. Brands include SmartCat (the popular Ultimate Scratching Post), Pioneer Pet (Sisal Cat Tree), PetFusion, Frisco, and MidWest. For multi-cat ${n.name} households, we recommend multiple scratchers in different orientations. Free delivery on orders over $49, no subscription required. Serving ${n.name}, ${n.nearbyAreas}, and all of NYC.`,
  petType: 'cat' as const,
  problemPoints: [
    `Bulky scratching posts and cat trees are hard to transport in ${n.borough}`,
    `Limited selection of sturdy, tall scratching posts near ${n.name}`,
    `Cardboard scratchers wear out fast and need replacing`,
    `Cat trees with built-in scratchers often expensive at ${n.borough} stores`,
    `Wrong type of scratcher (vertical vs horizontal) leads to ignored posts`,
  ],
  solutionPoints: [
    `Wide cat scratcher selection delivered to ${n.name} and ${n.nearbyAreas}`,
    `Vertical sisal posts, horizontal cardboard scratchers, cat trees, and towers`,
    `SmartCat, Pioneer Pet, PetFusion, Frisco, MidWest, and many more brands`,
    `Sizes from small apartment posts to multi-level cat trees`,
    `Free delivery on orders over $49 — bulk scratchers ship free to ${n.name}`,
    `Queens-based for fast, reliable NYC delivery to ${n.borough}`,
  ],
  faqItems: [
    {
      question: `Do you deliver cat scratchers to ${n.name}, ${n.borough}?`,
      answer: `Yes — Petshiwu delivers cat scratchers and scratching posts throughout ${n.name} and the surrounding ${n.borough} area including ${n.nearbyAreas}. Sisal, cardboard, vertical, horizontal, and cat trees. Free delivery on orders over $49.`,
    },
    {
      question: `What cat scratcher brands do you carry for ${n.name} delivery?`,
      answer: `We carry SmartCat, Pioneer Pet (Sisal Cat Tree), PetFusion, Frisco, MidWest, Trixie, and many more. Vertical posts, horizontal cardboard, multi-level cat trees, and replacement pads.`,
    },
    {
      question: `Do you deliver cat trees to ${n.name}?`,
      answer: `Yes — we deliver cat trees from 3 feet to 6+ feet tall with multiple platforms, hiding spots, and built-in scratchers. Perfect for ${n.borough} apartments where cats need vertical space.`,
    },
    {
      question: `What kind of scratcher do ${n.name} cats prefer?`,
      answer: `Most cats prefer tall vertical sisal posts (at least 28–32 inches) so they can stretch fully. Cats who scratch carpets often prefer horizontal cardboard. We deliver both styles to ${n.name} so you can find what your cat likes.`,
    },
    {
      question: `Do you have replacement scratcher pads for ${n.name} cat owners?`,
      answer: `Yes — replacement cardboard pads and sisal refills are available for popular scratchers. Delivered to ${n.name} with free shipping on orders over $49.`,
    },
  ],
  searchTerms: ['cat scratcher', 'scratching post', 'cat tree', 'sisal scratching post', 'cardboard cat scratcher', 'cat scratcher delivery', 'SmartCat', 'tall scratching post'],
});

const catToysGenerator: PageGenerator = (n) => ({
  keyword: `cat-toys-delivery-${n.slug}`,
  title: `Cat Toys Delivery in ${n.name}, ${n.borough} — Same-Day Delivery | Petshiwu`,
  description: `Premium cat toys delivered to ${n.name}, ${n.borough}. Wand toys, laser toys, puzzle feeders, kickers. Free shipping over $49. Queens-based NYC delivery.`,
  h1: `Cat Toys Delivery in ${n.name}, ${n.borough}`,
  introContent: `Cats need mental and physical stimulation, and the right toys prevent boredom, reduce behavioral problems, and keep ${n.name} cats engaged. Indoor cats especially depend on toys to express natural hunting behaviors — stalking, chasing, pouncing, and "killing" prey. Without proper stimulation, ${n.borough} cats develop destructive behavior, over-grooming, and aggression. The best approach combines interactive play (wand toys that mimic birds, mice, and insects) with solo enrichment (puzzle feeders that mimic hunting for food). Petshiwu delivers the best cat toys to ${n.name}: wand toys from Da Bird (the iconic feather wand that drives cats wild) and Wiggly Wand, laser pointers from PetSafe and Petstages, puzzle feeders from Trixie and Outward Hound, kicker toys from KONG and Petstages (long toys cats grab with both front paws and bunny-kick), automated toys from PetSafe (mimics prey movement on its own), and catnip toys from Yeowww! and Catnip Cat Toys. Whether your ${n.borough} cat is a high-energy Bengal who needs daily play, an older cat who needs gentle enrichment, or a kitten learning to hunt — we have the right toys delivered. Free delivery on orders over $49, no subscription required.`,
  petType: 'cat' as const,
  problemPoints: [
    `${n.borough} pet stores carry the same 5 cat toys — feather wand, laser, mouse`,
    `Hard to find quality puzzle feeders for ${n.name} cats locally`,
    `Catnip toys often dry out or lose potency fast`,
    `Kick toys and crinkle toys expensive at ${n.name} shops`,
    `Automated/motion toys hard to evaluate before buying`,
  ],
  solutionPoints: [
    `Wide cat toy selection delivered to ${n.name} and ${n.nearbyAreas}`,
    `Da Bird wand, Wiggly Wand, PetSafe laser, KONG kicker, Yeowww! catnip toys`,
    `Puzzle feeders from Trixie, Outward Hound, and Cat Amazing`,
    `Interactive toys, motion toys, and battery-powered toys`,
    `Free delivery on orders over $49 — bulk cat toys ship free to ${n.name}`,
    `Queens-based for fast NYC delivery to ${n.borough}`,
  ],
  faqItems: [
    {
      question: `Do you deliver cat toys to ${n.name}, ${n.borough}?`,
      answer: `Yes — Petshiwu delivers cat toys throughout ${n.name} and the surrounding ${n.borough} area including ${n.nearbyAreas}. Wand toys, laser toys, puzzle feeders, kickers, and more. Free delivery on orders over $49.`,
    },
    {
      question: `What cat toy brands do you carry for ${n.name} delivery?`,
      answer: `We carry Da Bird, Wiggly Wand, PetSafe, KONG, Yeowww!, Catnip Cat Toys, Trixie, Outward Hound, Petstages, Cat Amazing, and many more. Interactive, automated, and classic cat toys.`,
    },
    {
      question: `Do you deliver puzzle feeders for cats in ${n.name}?`,
      answer: `Yes — we carry Trixie puzzle feeders, Cat Amazing, Outward Hound puzzle toys, and Doc & Phoebe's indoor hunting system. Great for ${n.borough} cats who eat too fast or need mental stimulation.`,
    },
    {
      question: `What are the best cat toys for indoor cats in ${n.name}?`,
      answer: `Wand toys (Da Bird, Wiggly Wand) for daily interactive play, plus puzzle feeders for solo enrichment. We deliver the full interactive cat toy line to ${n.name} with free shipping on orders over $49.`,
    },
    {
      question: `Do you have catnip toys for delivery to ${n.name}?`,
      answer: `Yes — Yeowww! catnip toys, Catnip Cat Toys, and KONG catnip kickers all available. Catnip grows locally and our toys stay potent. Free delivery on orders over $49.`,
    },
  ],
  searchTerms: ['cat toys', 'cat toy delivery', 'wand toys', 'laser pointer cat toy', 'puzzle feeder cat', 'catnip toys', 'interactive cat toys', 'Da Bird'],
});

const catBedsGenerator: PageGenerator = (n) => ({
  keyword: `cat-beds-delivery-${n.slug}`,
  title: `Cat Beds Delivery in ${n.name}, ${n.borough} — Same-Day Delivery | Petshiwu`,
  description: `Premium cat beds delivered to ${n.name}, ${n.borough}. Heated beds, covered beds, window perches, cat caves. Free shipping over $49. Queens-based NYC delivery.`,
  h1: `Cat Beds Delivery in ${n.name}, ${n.borough}`,
  introContent: `${n.name} cats love a cozy place of their own — and the right bed depends on your cat's personality. Some ${n.borough} cats crave open sunny spots by windows; others prefer covered hideaways where they feel secure; senior cats often need heated beds to ease joint stiffness. Cats sleep 12–16 hours a day on average, so the bed they choose is their second home. Petshiwu delivers every style of cat bed to ${n.name}: heated beds (K&H thermo-electric, safe and low-voltage), self-warming beds (no electricity — uses the cat's own body heat reflected back), covered cat caves (enclosed "donut" style for security), bolster beds (raised edges for head support), window perches (suction-cup mounted, gives ${n.name} cats a sunny lookout), hammocks (attach to radiators or chair legs), and elevated beds (off the cold floor in winter). Brands include K&H Pet Products, Furhaven, PetFusion, Best Friends by Sheri, AmazonBasics, and Frisco. Window perches are particularly popular in ${n.borough} apartments where cats enjoy the view (and the warmth of the sun), heated beds help senior cats in cold apartments, and covered beds give anxious cats a sense of security. Free delivery on orders over $49, no subscription required. Serving ${n.name}, ${n.nearbyAreas}, and all of NYC.`,
  petType: 'cat' as const,
  problemPoints: [
    `Bulky cat beds awkward to bring home from ${n.borough} stores`,
    `Heated cat beds expensive and limited in selection locally`,
    `Window perches hard to install without testing for ${n.name} window types`,
    `Covered cat caves and hooded beds often out of stock near ${n.borough}`,
    `Multi-cat households need multiple beds in ${n.name} apartments`,
  ],
  solutionPoints: [
    `Wide cat bed selection delivered to ${n.name} and ${n.nearbyAreas}`,
    `Heated beds, self-warming beds, covered caves, window perches, hammocks`,
    `K&H Pet Products, Furhaven, PetFusion, Best Friends by Sheri, Frisco`,
    `Sizes and styles for single cats through multi-cat ${n.borough} households`,
    `Free delivery on orders over $49 throughout ${n.borough}`,
    `Queens-based delivery for fast, reliable NYC service to ${n.name}`,
  ],
  faqItems: [
    {
      question: `Do you deliver cat beds to ${n.name}, ${n.borough}?`,
      answer: `Yes — Petshiwu delivers cat beds throughout ${n.name} and the surrounding ${n.borough} area including ${n.nearbyAreas}. Heated, covered, window perches, hammocks, and more. Free delivery on orders over $49.`,
    },
    {
      question: `What cat bed brands do you carry for ${n.name} delivery?`,
      answer: `We carry K&H Pet Products, Furhaven, PetFusion, Best Friends by Sheri, Frisco, MidWest, and AmazonBasics. Heated beds, self-warming beds, cat caves, window perches, and elevated beds.`,
    },
    {
      question: `Do you deliver heated cat beds to ${n.name}?`,
      answer: `Yes — K&H Pet Products heated cat beds and self-warming cat beds (no electricity needed) ship to ${n.name}. Perfect for cold NYC winters and senior ${n.borough} cats who need extra warmth.`,
    },
    {
      question: `Do you have window perches for cats in ${n.name}?`,
      answer: `Yes — we carry K&H window-mounted cat perches and Furhaven window hammocks. Most ${n.name} windows can fit a perch with the included suction cups or brackets.`,
    },
    {
      question: `What size cat bed should I order for delivery in ${n.name}?`,
      answer: `Standard cat beds are 16–20 inches and fit most cats. Maine Coons and large breeds need jumbo (24+ inches). Senior cats often prefer heated or covered beds for warmth and security.`,
    },
  ],
  searchTerms: ['cat beds', 'heated cat bed', 'window perch cat', 'cat cave', 'cat bed delivery', 'self-warming cat bed', 'cat hammock', 'covered cat bed'],
});

const catGroomingGenerator: PageGenerator = (n) => ({
  keyword: `cat-grooming-delivery-${n.slug}`,
  title: `Cat Grooming Supplies Delivery in ${n.name}, ${n.borough} | Petshiwu`,
  description: `Premium cat grooming supplies delivered to ${n.name}, ${n.borough}. Brushes, deshedding tools, nail clippers, dental care. Free shipping over $49. NYC delivery.`,
  h1: `Cat Grooming Supplies Delivery in ${n.name}, ${n.borough}`,
  introContent: `Regular grooming keeps ${n.name} cats healthy, reduces hairballs, prevents matting, and gives owners an opportunity to spot health issues early. Cats are self-groomers, but they still need human help — especially long-haired breeds that ingest too much hair during self-grooming, which leads to hairballs and potentially dangerous intestinal blockages. Daily brushing removes loose hair before ${n.borough} cats can swallow it, and also reduces shedding around the home. Petshiwu delivers professional-grade cat grooming supplies to ${n.name}: slicker brushes (essential for most cats), pin brushes (gentle for short-haired breeds), deshedding tools from FURminator (pulls out massive amounts of loose undercoat), rubber grooming gloves (great for cats who hate brushes), nail clippers (cat-specific, smaller blade than dog clippers), toothbrushes and toothpaste (enzymatic cat toothpaste, never use human toothpaste), ear cleaners (to prevent ear infections), and dental treats (mechanical scrubbing action). Long-haired ${n.borough} cats (Persians, Maine Coons, Ragdolls, Himalayans) need daily brushing with a slicker and undercoat rake, while short-haired cats do well with weekly brushing. We deliver the right tools for every coat type. Free delivery on orders over $49, no subscription required. Serving ${n.name}, ${n.nearbyAreas}, and all of NYC.`,
  petType: 'cat' as const,
  problemPoints: [
    `Limited selection of cat brushes at ${n.borough} pet stores`,
    `Deshedding tools for long-haired cats hard to find near ${n.name}`,
    `Cat-specific nail clippers vs. dog clippers confusing`,
    `Cat toothbrushes and toothpaste often out of stock locally`,
    `${n.name} long-haired cats prone to matting without proper tools`,
  ],
  solutionPoints: [
    `Wide cat grooming supply selection delivered to ${n.name} and ${n.nearbyAreas}`,
    `Slicker brushes, pin brushes, deshedding tools, grooming gloves`,
    `Cat nail clippers, grinders, and replacement files`,
    `Cat toothbrushes, toothpaste, dental treats, and ear cleaners`,
    `Free delivery on orders over $49 throughout ${n.borough}`,
    `Queens-based delivery for fast NYC service to ${n.name}`,
  ],
  faqItems: [
    {
      question: `Do you deliver cat grooming supplies to ${n.name}, ${n.borough}?`,
      answer: `Yes — Petshiwu delivers cat grooming supplies throughout ${n.name} and the surrounding ${n.borough} area including ${n.nearbyAreas}. Brushes, deshedding tools, nail clippers, dental care, and more. Free delivery on orders over $49.`,
    },
    {
      question: `What cat grooming brands do you carry for ${n.name} delivery?`,
      answer: `We carry FURminator, Hertzko, Petstages, Safari, JW Pet, Arm & Hammer, TropiClean, and many more. Professional-grade cat brushes, nail clippers, and dental care.`,
    },
    {
      question: `Do you have brushes for long-haired cats in ${n.name}?`,
      answer: `Yes — we carry slicker brushes, undercoat rakes, and deshedding tools perfect for ${n.name} Maine Coons, Persians, Ragdolls, and other long-haired breeds. Daily brushing prevents mats and hairballs.`,
    },
    {
      question: `Do you deliver cat nail clippers to ${n.name}?`,
      answer: `Yes — we carry cat-specific nail clippers (smaller blade than dog clippers) plus rechargeable nail grinders. Easy to use on ${n.borough} cats of all ages with safe, sharp blades.`,
    },
    {
      question: `Do you have dental care products for cats in ${n.name}?`,
      answer: `Yes — cat toothbrushes, enzymatic toothpaste, dental treats, and oral care water additives. We deliver Arm & Hammer, TropiClean, and Vet's Best dental products to ${n.name} with free shipping on orders over $49.`,
    },
  ],
  searchTerms: ['cat grooming supplies', 'cat brush', 'cat nail clippers', 'deshedding cat', 'FURminator cat', 'cat dental care', 'cat grooming delivery', 'cat toothbrush'],
});

const fishSuppliesGenerator: PageGenerator = (n) => ({
  keyword: `fish-supplies-delivery-${n.slug}`,
  title: `Fish & Aquarium Supplies Delivery in ${n.name}, ${n.borough} | Petshiwu`,
  description: `Fish and aquarium supplies delivered to ${n.name}, ${n.borough}. Filters, heaters, tanks, food, decorations. Free shipping over $49. Queens-based NYC delivery.`,
  h1: `Fish & Aquarium Supplies Delivery in ${n.name}, ${n.borough}`,
  introContent: `${n.name} fish keepers — from casual goldfish owners to serious reef aquarists — need reliable access to filters, heaters, food, and water treatments. A thriving aquarium depends on stable water chemistry, proper filtration, appropriate temperature, and species-compatible feeding. NYC water is hard and chlorinated, so ${n.borough} aquarists need water conditioners (Seachem Prime, API Tap Water Conditioner) before adding fish. Petshiwu delivers the full range of fish and aquarium supplies to ${n.name}: tanks and aquariums from Aqueon and Tetra (5 to 75 gallons, with stands available), filters from Fluval and Marineland (HOB, canister, and internal power filters), heaters (submersible, with thermostatic control), LED lighting (essential for planted tanks and reef tanks), water conditioners, fish food from Tetra, Hikari, and Omega One, plus gravel, decorations, driftwood, live plants, and water testing kits. Tropical fish, goldfish, bettas, cichlids, saltwater fish — we carry food and supplies for every setup, from beginner 10-gallon tanks to advanced reef systems. Free delivery on orders over $49, no subscription required. Serving ${n.name}, ${n.nearbyAreas}, and all of NYC.`,
  problemPoints: [
    `Limited fish supply selection at ${n.borough} pet stores`,
    `Bulky aquariums and tank stands hard to transport in ${n.name} apartments`,
    `Hard to find specialty fish food (Hikari, Omega One) locally`,
    `Replacement filters and parts often back-ordered at ${n.name} shops`,
    `Water testing kits and treatments in inconsistent stock`,
  ],
  solutionPoints: [
    `Wide fish supply selection delivered to ${n.name} and ${n.nearbyAreas}`,
    `Aqueon, Tetra, Fluval, Marineland, API, Hikari, Omega One`,
    `Tanks, filters, heaters, lighting, water conditioners, and gravel`,
    `Specialty foods for tropical, goldfish, betta, cichlid, and saltwater fish`,
    `Free delivery on orders over $49 throughout ${n.borough}`,
    `Queens-based delivery for fast, reliable NYC service to ${n.name}`,
  ],
  faqItems: [
    {
      question: `Do you deliver fish supplies to ${n.name}, ${n.borough}?`,
      answer: `Yes — Petshiwu delivers fish and aquarium supplies throughout ${n.name} and the surrounding ${n.borough} area including ${n.nearbyAreas}. Tanks, filters, heaters, food, decorations, and more. Free delivery on orders over $49.`,
    },
    {
      question: `What fish supply brands do you carry for ${n.name} delivery?`,
      answer: `We carry Aqueon, Tetra, Fluval, Marineland, API, Hikari, Omega One, Seachem, Instant Ocean, and many more. Freshwater and saltwater aquarium supplies.`,
    },
    {
      question: `Do you deliver aquariums and tanks to ${n.name}?`,
      answer: `Yes — Aqueon and Tetra aquariums from 5 gallons to 75 gallons ship to ${n.name}. We also carry tank stands and replacement lids. Larger tanks ship via freight with scheduled delivery.`,
    },
    {
      question: `Do you have fish food delivered to ${n.name}?`,
      answer: `Yes — Tetra, Hikari, Omega One, API, and New Life Spectrum fish foods. Flakes, pellets, freeze-dried, and frozen options for tropical, goldfish, betta, cichlid, and saltwater fish.`,
    },
    {
      question: `Do you carry water treatment and testing kits for ${n.name} aquariums?`,
      answer: `Yes — Seachem Prime, API water conditioners, API test kits, and pH adjusters all delivered to ${n.name}. Free shipping on orders over $49.`,
    },
  ],
  searchTerms: ['fish supplies', 'aquarium supplies', 'fish tank', 'aquarium filter', 'fish food', 'fish supplies delivery', 'Hikari', 'Tetra aquarium', 'Marineland'],
});

const reptileSuppliesGenerator: PageGenerator = (n) => ({
  keyword: `reptile-supplies-delivery-${n.slug}`,
  title: `Reptile Supplies Delivery in ${n.name}, ${n.borough} — Same-Day Delivery | Petshiwu`,
  description: `Reptile supplies delivered to ${n.name}, ${n.borough}. UVB lights, substrate, heat lamps, hides, thermometers. Free shipping over $49. Queens-based NYC delivery.`,
  h1: `Reptile Supplies Delivery in ${n.name}, ${n.borough}`,
  introContent: `Reptile keepers in ${n.name} know that proper husbandry depends on the right equipment — UVB lighting for vitamin D3 synthesis and calcium absorption, temperature gradients so reptiles can thermoregulate, appropriate substrate for the species, and humidity control matching their natural environment. Mistakes in any of these areas can lead to metabolic bone disease, respiratory infections, or shell rot in turtles and tortoises. Petshiwu delivers the leading reptile supply brands to ${n.name}: UVB lights from Arcadia (T5 HO kits, considered the gold standard) and Zoo Med (Reptisun T5 and T8 bulbs), heat lamps and ceramic heat emitters (no light, just heat for nighttime), thermostats (essential to prevent overheating — Zoo Med and Exo Terra), thermometers and hygrometers (digital and analog, for accurate monitoring), substrates from Zoo Med and Exo Terra (coconut fiber, bioactive, reptile carpet, sand, sphagnum moss), hides, water dishes, climbing branches, and decor. Whether you keep bearded dragons, leopard geckos, ball pythons, crested geckos, turtles, or tortoises in your ${n.borough} home — we have the supplies delivered. We also carry feeder insects and frozen rodents for ${n.name} reptile owners. Free delivery on orders over $49, no subscription required. Serving ${n.name}, ${n.nearbyAreas}, and all of NYC.`,
  problemPoints: [
    `Limited reptile supply selection at ${n.borough} pet stores`,
    `Hard to find quality UVB bulbs (Arcadia, Zoo Med) locally for ${n.name} keepers`,
    `Specialty substrates (bioactive, coconut fiber) hard to find near ${n.name}`,
    `Replacement thermostats and thermometers often back-ordered`,
    `Live feeder insects and frozen rodents inconsistent stock in ${n.borough}`,
  ],
  solutionPoints: [
    `Wide reptile supply selection delivered to ${n.name} and ${n.nearbyAreas}`,
    `Arcadia, Zoo Med, Exo Terra, Fluker, Zilla, and many more brands`,
    `UVB lights, heat lamps, thermostats, thermometers, hygrometers`,
    `Substrates: coconut fiber, bioactive, reptile carpet, sand, moss`,
    `Free delivery on orders over $49 throughout ${n.borough}`,
    `Queens-based delivery for fast NYC service to ${n.name}`,
  ],
  faqItems: [
    {
      question: `Do you deliver reptile supplies to ${n.name}, ${n.borough}?`,
      answer: `Yes — Petshiwu delivers reptile supplies throughout ${n.name} and the surrounding ${n.borough} area including ${n.nearbyAreas}. UVB lights, heat lamps, substrates, hides, and more. Free delivery on orders over $49.`,
    },
    {
      question: `What reptile supply brands do you carry for ${n.name} delivery?`,
      answer: `We carry Arcadia, Zoo Med, Exo Terra, Fluker, Zilla, Penn-Plax, Galapagos, and many more. UVB lighting, heating, substrate, decor, and feeders.`,
    },
    {
      question: `Do you have UVB lights for ${n.name} reptiles?`,
      answer: `Yes — Arcadia T5 HO UVB kits, Zoo Med Reptisun T5 and T8 UVB bulbs, and compact fluorescents. We deliver replacement UVB bulbs to ${n.name} and recommend replacing every 6–12 months.`,
    },
    {
      question: `Do you deliver reptile substrate to ${n.name}?`,
      answer: `Yes — Zoo Med, Exo Terra, and Galapagos substrates: coconut fiber (Eco Earth), bioactive substrate, reptile carpet, play sand, sphagnum moss, and more. Delivered to ${n.name} with free shipping on orders over $49.`,
    },
    {
      question: `Do you carry reptile thermostats and heat lamps for ${n.name}?`,
      answer: `Yes — we carry Zoo Med and Exo Terra thermostats (on/off and dimming/proportional), ceramic heat emitters, basking bulbs, and halogen heat bulbs for proper temperature gradients in ${n.borough} reptile enclosures.`,
    },
  ],
  searchTerms: ['reptile supplies', 'reptile supplies delivery', 'UVB light', 'reptile substrate', 'heat lamp', 'Zoo Med', 'Exo Terra', 'bearded dragon supplies'],
});

const birdSuppliesGenerator: PageGenerator = (n) => ({
  keyword: `bird-supplies-delivery-${n.slug}`,
  title: `Bird Supplies Delivery in ${n.name}, ${n.borough} — Same-Day Delivery | Petshiwu`,
  description: `Bird supplies delivered to ${n.name}, ${n.borough}. Cages, perches, food, toys, cuttlebone. Free shipping over $49. Queens-based NYC delivery.`,
  h1: `Bird Supplies Delivery in ${n.name}, ${n.borough}`,
  introContent: `${n.name} bird owners — keeping parakeets, cockatiels, conures, finches, canaries, parrots, and other species — need reliable access to cages, food, perches, toys, and health supplies. Birds are intelligent, social animals that need proper cage size (large enough to fully extend wings), species-appropriate diets (seed-only leads to malnutrition in many species), enrichment toys to prevent feather plucking and behavioral issues, and regular access to natural sunlight or full-spectrum lighting for vitamin D synthesis. Petshiwu delivers the leading bird brands to ${n.name}: cages from Prevue Pet Products and A&E (in sizes appropriate for every species from budgies through macaws), food from Higgins, Kaytee, Lafeber (NutriBerries and Avi-Cakes are great foraging foods), and Zupreem (pellet and seed blends), perches and stands (natural wood, rope, calcium, and pedicure perches), toys for enrichment (foraging, shredding, puzzle toys), cuttlebone and mineral blocks (essential calcium source), and bird-safe cleaning supplies. Whether you have a single budgie or a flock of finches in your ${n.borough} home — we deliver everything. Free delivery on orders over $49, no subscription required. Serving ${n.name}, ${n.nearbyAreas}, and all of NYC.`,
  problemPoints: [
    `Limited bird supply selection at ${n.borough} pet stores`,
    `Bulky cages hard to transport in ${n.name} apartments`,
    `Specialty bird food (Higgins, Lafeber) hard to find locally`,
    `Bird-safe toys and foraging supplies often out of stock`,
    `Cuttlebone, mineral blocks, and grit inconsistent locally`,
  ],
  solutionPoints: [
    `Wide bird supply selection delivered to ${n.name} and ${n.nearbyAreas}`,
    `Prevue Pet Products, A&E, Higgins, Kaytee, Lafeber, Zupreem, JW Pet`,
    `Cages, perches, stands, toys, food, and health supplies`,
    `Sizes and styles for parakeets through large parrots`,
    `Free delivery on orders over $49 throughout ${n.borough}`,
    `Queens-based delivery for fast NYC service to ${n.name}`,
  ],
  faqItems: [
    {
      question: `Do you deliver bird supplies to ${n.name}, ${n.borough}?`,
      answer: `Yes — Petshiwu delivers bird supplies throughout ${n.name} and the surrounding ${n.borough} area including ${n.nearbyAreas}. Cages, food, toys, perches, cuttlebone, and more. Free delivery on orders over $49.`,
    },
    {
      question: `What bird supply brands do you carry for ${n.name} delivery?`,
      answer: `We carry Prevue Pet Products, A&E Cage Company, Higgins, Kaytee, Lafeber, Zupreem, JW Pet, Caitec, and many more. Cages, food, perches, toys, and health supplies for all bird species.`,
    },
    {
      question: `Do you deliver bird cages to ${n.name}?`,
      answer: `Yes — Prevue Pet Products and A&E bird cages from small budgie cages through large macaw flight cages ship to ${n.name}. We also carry play stands, travel cages, and replacement cage parts.`,
    },
    {
      question: `Do you have specialty bird food for ${n.name} delivery?`,
      answer: `Yes — Higgins, Lafeber (NutriBerries and Avi-Cakes), Zupreem, Kaytee, and Top's Parrot Food. Seed mixes, pellets, foraging blends, and treat sticks for parakeets through macaws.`,
    },
    {
      question: `Do you carry bird toys and perches for ${n.name} birds?`,
      answer: `Yes — JW Pet, Caitec, and Super Bird Creations toys. Rope perches, natural wood perches, calcium perches, and pedicure perches for ${n.borough} birds of all sizes.`,
    },
  ],
  searchTerms: ['bird supplies', 'bird supplies delivery', 'bird cage', 'parakeet food', 'parrot toys', 'cuttlebone', 'Kaytee bird food', 'Lafeber'],
});

const smallPetSuppliesGenerator: PageGenerator = (n) => ({
  keyword: `small-pet-supplies-delivery-${n.slug}`,
  title: `Small Pet Supplies Delivery in ${n.name}, ${n.borough} | Petshiwu`,
  description: `Small pet supplies delivered to ${n.name}, ${n.borough}. Hamster, guinea pig, rabbit cages, bedding, food. Free shipping over $49. Queens-based NYC delivery.`,
  h1: `Small Pet Supplies Delivery in ${n.name}, ${n.borough}`,
  introContent: `${n.name} has a strong community of small pet owners — hamsters, guinea pigs, rabbits, gerbils, mice, rats, ferrets, chinchillas, and hedgehogs all need species-appropriate care. Each species has very different housing, dietary, and socialization needs: guinea pigs need constant hay access and vitamin C supplementation; rabbits need hay-based diets and large enclosures; hamsters are solitary and need appropriately-sized wheels (not the small wire wheels that cause back injury); chinchillas need dust baths and cool temperatures; ferrets need high-protein diets and lots of out-of-cage time. Petshiwu delivers the leading small pet brands to ${n.name}: cages from MidWest Homes for Pets and Prevue Pet Products (species-appropriate sizes for hamsters, guinea pigs, rabbits, chinchillas, and ferrets), bedding from Carefresh (paper, low-dust) and Kaytee (various materials), food from Oxbow (the gold standard for guinea pigs and rabbits) and Higgins (hamsters, gerbils, rats, mice), Timothy and Orchard hay (essential for guinea pigs and rabbits), hides, exercise wheels (Silent Runner and Wodent Wheel — safe sizes for each species), water bottles, and toys. Whether you have a single Syrian hamster or a pair of guinea pigs in your ${n.borough} home — we have the supplies delivered. Free delivery on orders over $49, no subscription required. Serving ${n.name}, ${n.nearbyAreas}, and all of NYC.`,
  problemPoints: [
    `Limited small pet supply selection at ${n.borough} pet stores`,
    `Bulky cages and bagged bedding hard to transport in ${n.name} apartments`,
    `Quality hay (Oxbow) hard to find locally for guinea pigs and rabbits`,
    `Small pet food brands (Oxbow, Higgins) often out of stock near ${n.name}`,
    `Replacement water bottles, wheels, and accessories inconsistent locally`,
  ],
  solutionPoints: [
    `Wide small pet supply selection delivered to ${n.name} and ${n.nearbyAreas}`,
    `MidWest, Prevue, Carefresh, Kaytee, Oxbow, Higgins, and many more`,
    `Cages, bedding, food, hay, hides, wheels, and accessories`,
    `Species-appropriate formulas for hamsters, guinea pigs, rabbits, and more`,
    `Free delivery on orders over $49 throughout ${n.borough}`,
    `Queens-based delivery for fast NYC service to ${n.name}`,
  ],
  faqItems: [
    {
      question: `Do you deliver small pet supplies to ${n.name}, ${n.borough}?`,
      answer: `Yes — Petshiwu delivers small pet supplies throughout ${n.name} and the surrounding ${n.borough} area including ${n.nearbyAreas}. Hamster, guinea pig, rabbit, gerbil, ferret, and chinchilla supplies. Free delivery on orders over $49.`,
    },
    {
      question: `What small pet supply brands do you carry for ${n.name} delivery?`,
      answer: `We carry MidWest Homes for Pets, Prevue Pet Products, Carefresh, Kaytee, Oxbow, Higgins, Supreme, and many more. Cages, bedding, food, hay, hides, and accessories.`,
    },
    {
      question: `Do you have Oxbow hay delivered to ${n.name}?`,
      answer: `Yes — Oxbow Timothy Hay, Orchard Grass, Alfalfa Hay, and Botanical Hay all ship to ${n.name}. Essential for guinea pigs and rabbits. Oxbow Western Timothy and Oat Hay are bestsellers for ${n.borough} small pet owners.`,
    },
    {
      question: `Do you deliver guinea pig food to ${n.name}?`,
      answer: `Yes — Oxbow Essentials Cavy Cuisine, Higgins Sunburst Gourmet Blend, and Kaytee Supreme Guinea Pig food. Delivered to ${n.name} with free shipping on orders over $49.`,
    },
    {
      question: `Do you carry hamster cages and bedding for ${n.name} delivery?`,
      answer: `Yes — MidWest Homes for Pets hamster cages, Kaytee and Carefresh bedding, Silent Runner and Wodent Wheel exercise wheels, water bottles, and hides. Everything for ${n.name} hamsters delivered.`,
    },
  ],
  searchTerms: ['small pet supplies', 'small pet supplies delivery', 'hamster cage', 'guinea pig food', 'rabbit hay', 'Oxbow hay', 'Carefresh bedding', 'gerbil supplies'],
});

const vetDietGenerator: PageGenerator = (n) => ({
  keyword: `vet-diet-delivery-${n.slug}`,
  title: `Veterinary Diet Food Delivery in ${n.name}, ${n.borough} | Petshiwu`,
  description: `Veterinary diet food delivered to ${n.name}, ${n.borough}. Hill's Prescription Diet, Royal Canin Veterinary. Free shipping over $49. Queens-based NYC delivery.`,
  h1: `Veterinary Diet Food Delivery in ${n.name}, ${n.borough}`,
  introContent: `When ${n.name} veterinarians recommend a prescription diet for kidney disease, urinary issues, sensitive stomach, weight management, or food allergies, pet owners need a reliable source. Veterinary diets are formulated with specific nutrient profiles — reduced phosphorus for kidney disease, controlled mineral levels for urinary issues, hydrolyzed proteins for allergies — that go far beyond what's available in regular pet food. Petshiwu delivers the leading veterinary-authorized diet brands to ${n.name}: Hill's Prescription Diet (k/d kidney, c/d urinary, i/d gastrointestinal, z/d hypoallergenic, w/d weight, r/d obesity, s/d dental, j/d joint, and more), Royal Canin Veterinary Diet (Gastrointestinal, Renal Support, Urinary SO, Hydrolyzed Protein, Satiety, and more), and Purina Pro Plan Veterinary Diets (NF kidney, UR urinary, EN gastrointestinal, HA hypoallergenic). These therapeutic foods are formulated under veterinary guidance to manage specific health conditions. We carry both dry and wet/canned formulas for most conditions, plus specialized formulas for life-stage and breed-specific needs. We deliver to ${n.name} and the surrounding ${n.borough} area including ${n.nearbyAreas}. Free delivery on orders over $49, no subscription required. Queens-based for fast NYC service. Important note: veterinary diets should be used under vet supervision — we deliver what's prescribed, you maintain the relationship with your ${n.name} veterinarian.`,
  problemPoints: [
    `Limited prescription diet selection at ${n.borough} veterinary clinics`,
    `Specialty veterinary food expensive at ${n.name} vet offices`,
    `Hard to find Royal Canin Veterinary Diet locally`,
    `Concerns about running out of essential prescription food`,
    `Specialty diet for cats with urinary issues hard to source in ${n.name}`,
  ],
  solutionPoints: [
    `Wide veterinary diet selection delivered to ${n.name} and ${n.nearbyAreas}`,
    `Hill's Prescription Diet, Royal Canin Veterinary Diet, Purina Pro Plan Veterinary Diets`,
    `Kidney, urinary, gastrointestinal, weight, hypoallergenic, and other formulas`,
    `Dry and wet/canned options for most conditions`,
    `Free delivery on orders over $49 throughout ${n.borough}`,
    `Queens-based delivery for fast, reliable NYC service to ${n.name}`,
  ],
  faqItems: [
    {
      question: `Do you deliver veterinary diet food to ${n.name}, ${n.borough}?`,
      answer: `Yes — Petshiwu delivers veterinary diet food to ${n.name} and the surrounding ${n.borough} area including ${n.nearbyAreas}. Hill's Prescription Diet, Royal Canin Veterinary Diet, and Purina Pro Plan Veterinary Diets. Free delivery on orders over $49.`,
    },
    {
      question: `What veterinary diet brands do you carry for ${n.name} delivery?`,
      answer: `We carry Hill's Prescription Diet (k/d, c/d, i/d, z/d, w/d, r/d, s/d), Royal Canin Veterinary Diet (Gastrointestinal, Renal, Urinary, Hydrolyzed Protein), and Purina Pro Plan Veterinary Diets (NF, UR, EN, HA).`,
    },
    {
      question: `Do I need a prescription to order veterinary diet food in ${n.name}?`,
      answer: `These foods are formulated for medical conditions and are intended for use under veterinary supervision. ${n.borough} pet owners should consult their vet, who can recommend the right formula for their pet's specific condition.`,
    },
    {
      question: `Do you deliver Hill's Prescription Diet k/d to ${n.name}?`,
      answer: `Yes — Hill's Prescription Diet k/d Kidney Care for both dogs and cats ships to ${n.name}. Available in dry and wet/canned formulas, plus stew varieties. Free delivery on orders over $49.`,
    },
    {
      question: `Do you have Royal Canin Veterinary Diet for ${n.name} delivery?`,
      answer: `Yes — Royal Canin Gastrointestinal, Renal Support, Urinary SO, Hydrolyzed Protein, and other veterinary formulas for dogs and cats. Delivered to ${n.name} and ${n.borough} with free shipping on orders over $49.`,
    },
  ],
  searchTerms: ['veterinary diet', 'prescription dog food', 'Hill\'s Prescription Diet', 'Royal Canin Veterinary', 'kidney diet dog food', 'urinary cat food', 'vet diet delivery', 'sensitive stomach dog food'],
});

const petMedicationGenerator: PageGenerator = (n) => ({
  keyword: `pet-medication-delivery-${n.slug}`,
  title: `Pet Medication & Preventive Delivery in ${n.name}, ${n.borough} | Petshiwu`,
  description: `Pet medications and preventives delivered to ${n.name}, ${n.borough}. Flea/tick, heartworm, dental care products. Free shipping over $49. Queens-based NYC delivery.`,
  h1: `Pet Medication & Preventive Delivery in ${n.name}, ${n.borough}`,
  introContent: `Preventive care keeps ${n.name} pets healthy year-round, and Petshiwu delivers the trusted brands ${n.borough} pet owners rely on. NYC is a high-risk area for fleas, ticks, and heartworm — Central Park, Prospect Park, and the many green spaces around the city harbor these parasites even in cold months. Year-round prevention is recommended for ${n.borough} dogs and outdoor cats. We carry flea and tick prevention products (topical, oral, and collars), heartworm preventives (monthly chewables), dewormers, dental care products, joint supplements, skin and coat supplements, and over-the-counter health aids. Brands include Frontline Plus, Frontline Gold, Advantage II, K9 Advantix II, Seresto collars (8-month flea/tick protection), Capstar, Comfortis, Heartgard Plus, Sentinel, Interceptor Plus, Cosequin, Dasuquin, Nutramax, and more. For prescription medications, work with your ${n.name} veterinarian — but we deliver the OTC preventives, supplements, and wellness products you reorder regularly, so you never run out of your dog's monthly heartworm chew or flea treatment. Free delivery on orders over $49, no subscription required. Queens-based for fast NYC service to ${n.name}, ${n.nearbyAreas}, and all five boroughs.`,
  problemPoints: [
    `Limited selection of preventive medications at ${n.borough} stores`,
    `Hard to find Seresto collars and Frontline locally for ${n.name} pets`,
    `Joint supplements (Cosequin, Dasuquin) expensive at ${n.borough} shops`,
    `Dewormers and over-the-counter health aids inconsistent stock`,
    `Auto-reorder of monthly preventives is awkward from ${n.name} vet offices`,
  ],
  solutionPoints: [
    `Wide pet medication line delivered to ${n.name} and ${n.nearbyAreas}`,
    `Frontline, Advantage, K9 Advantix, Seresto, Capstar, Comfortis`,
    `Heartgard, Sentinel, Interceptor, and other heartworm preventives`,
    `Cosequin, Dasuquin, and joint supplements for senior ${n.borough} pets`,
    `Dental products, ear cleaners, skin and coat supplements, dewormers`,
    `Free delivery on orders over $49 throughout ${n.borough}`,
  ],
  faqItems: [
    {
      question: `Do you deliver pet medications to ${n.name}, ${n.borough}?`,
      answer: `Yes — Petshiwu delivers over-the-counter pet medications and preventives throughout ${n.name} and the surrounding ${n.borough} area including ${n.nearbyAreas}. Flea/tick, heartworm, dental, joint supplements, and more. Free delivery on orders over $49.`,
    },
    {
      question: `What pet medication brands do you carry for ${n.name} delivery?`,
      answer: `We carry Frontline, Advantage, K9 Advantix, Seresto, Capstar, Comfortis, Heartgard, Sentinel, Interceptor, Cosequin, Dasuquin, and many more.`,
    },
    {
      question: `Do you deliver flea and tick prevention to ${n.name}?`,
      answer: `Yes — Frontline Plus, Frontline Gold, Advantage II, K9 Advantix II, Seresto collars (8-month protection), Capstar, and Comfortis. Delivered to ${n.name} with free shipping on orders over $49.`,
    },
    {
      question: `Do you deliver heartworm prevention to ${n.name}?`,
      answer: `Yes — Heartgard Plus, Sentinel, Interceptor Plus, and other heartworm preventives. We carry them for ${n.name} pet owners who need ongoing prevention for dogs and cats.`,
    },
    {
      question: `Do you carry joint supplements for senior pets in ${n.name}?`,
      answer: `Yes — Cosequin, Dasuquin, Nutramax, VetriScience, and NaturVet joint supplements for senior ${n.borough} dogs and cats with arthritis or joint issues.`,
    },
  ],
  searchTerms: ['pet medication', 'flea and tick prevention', 'Frontline', 'heartworm prevention', 'Heartgard', 'Seresto collar', 'Cosequin', 'pet medication delivery'],
});

const CATEGORY_GENERATORS: { slug: string; generator: PageGenerator }[] = [
  { slug: 'dog-food-delivery', generator: dogFoodGenerator },
  { slug: 'cat-food-delivery', generator: catFoodGenerator },
  { slug: 'pet-supplies-delivery', generator: petSuppliesGenerator },
  { slug: 'dog-treats-delivery', generator: dogTreatsGenerator },
  { slug: 'puppy-food-delivery', generator: puppyFoodGenerator },
  { slug: 'senior-dog-food-delivery', generator: seniorDogFoodGenerator },
  { slug: 'wet-dog-food-delivery', generator: wetDogFoodGenerator },
  { slug: 'dry-dog-food-delivery', generator: dryDogFoodGenerator },
  { slug: 'grain-free-dog-food-delivery', generator: grainFreeDogFoodGenerator },
  { slug: 'raw-dog-food-delivery', generator: rawDogFoodGenerator },
  { slug: 'dog-toys-delivery', generator: dogToysGenerator },
  { slug: 'dog-beds-delivery', generator: dogBedsGenerator },
  { slug: 'dog-crates-delivery', generator: dogCratesGenerator },
  { slug: 'dog-grooming-delivery', generator: dogGroomingGenerator },
  { slug: 'kitten-food-delivery', generator: kittenFoodGenerator },
  { slug: 'senior-cat-food-delivery', generator: seniorCatFoodGenerator },
  { slug: 'wet-cat-food-delivery', generator: wetCatFoodGenerator },
  { slug: 'cat-litter-boxes-delivery', generator: catLitterBoxesGenerator },
  { slug: 'cat-scratcher-delivery', generator: catScratcherGenerator },
  { slug: 'cat-toys-delivery', generator: catToysGenerator },
  { slug: 'cat-beds-delivery', generator: catBedsGenerator },
  { slug: 'cat-grooming-delivery', generator: catGroomingGenerator },
  { slug: 'fish-supplies-delivery', generator: fishSuppliesGenerator },
  { slug: 'reptile-supplies-delivery', generator: reptileSuppliesGenerator },
  { slug: 'bird-supplies-delivery', generator: birdSuppliesGenerator },
  { slug: 'small-pet-supplies-delivery', generator: smallPetSuppliesGenerator },
  { slug: 'vet-diet-delivery', generator: vetDietGenerator },
  { slug: 'pet-medication-delivery', generator: petMedicationGenerator },
];

// ─────────────────────────────────────────────
// Generate all 1,400 page configs
// ─────────────────────────────────────────────
export const ALL_NEIGHBORHOOD_PAGES: NeighborhoodPageConfig[] = NEIGHBORHOODS.flatMap((neighborhood) =>
  CATEGORY_GENERATORS.map(({ slug: categorySlug, generator }) => {
    const generated = generator(neighborhood);
    return {
      ...generated,
      slug: `${categorySlug}-${neighborhood.slug}`,
      neighborhood,
      categorySlug,
    };
  })
);

// Fast lookup map: slug → config
export const NEIGHBORHOOD_PAGE_MAP = new Map<string, NeighborhoodPageConfig>(
  ALL_NEIGHBORHOOD_PAGES.map((p) => [p.slug, p])
);
