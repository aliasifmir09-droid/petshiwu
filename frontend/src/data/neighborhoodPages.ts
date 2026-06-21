/**
 * Neighborhood × Category page data
 * 50 NYC neighborhoods × 4 delivery categories = 200 programmatic SEO pages
 * Targets: "[category] delivery [neighborhood] [borough]" — zero Chewy competition
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
  title: `Dog Food Delivery in ${n.name}, ${n.borough} — Free Shipping | Petshiwu`,
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
  title: `Cat Food Delivery in ${n.name}, ${n.borough} — Free Shipping | Petshiwu`,
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

const CATEGORY_GENERATORS: { slug: string; generator: PageGenerator }[] = [
  { slug: 'dog-food-delivery', generator: dogFoodGenerator },
  { slug: 'cat-food-delivery', generator: catFoodGenerator },
  { slug: 'pet-supplies-delivery', generator: petSuppliesGenerator },
  { slug: 'dog-treats-delivery', generator: dogTreatsGenerator },
];

// ─────────────────────────────────────────────
// Generate all 200 page configs
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
