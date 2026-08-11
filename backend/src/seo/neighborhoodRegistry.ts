/**
 * Canonical neighborhood × category route registry.
 *
 * This backend registry mirrors the frontend's exact route contract:
 * 28 category slugs × 50 neighborhood slugs = 1,400 canonical paths.
 * Bot-only and legacy sitemap-only families are intentionally excluded.
 */

export interface NeighborhoodRouteMetadata {
  slug: string;
  path: string;
  categorySlug: string;
  categoryName: string;
  petLabel: string;
  neighborhoodSlug: string;
  neighborhoodName: string;
  borough: string;
  boroughSlug: string;
  nearbyAreas: string;
}

export const CANONICAL_NEIGHBORHOOD_CATEGORIES = [
  { slug: "dog-food-delivery", name: "Dog Food Delivery", petLabel: "dog food" },
  { slug: "cat-food-delivery", name: "Cat Food Delivery", petLabel: "cat food" },
  { slug: "pet-supplies-delivery", name: "Pet Supplies Delivery", petLabel: "pet supplies" },
  { slug: "dog-treats-delivery", name: "Dog Treats & Accessories Delivery", petLabel: "dog treats" },
  { slug: "puppy-food-delivery", name: "Puppy Food Delivery", petLabel: "puppy food" },
  { slug: "senior-dog-food-delivery", name: "Senior Dog Food Delivery", petLabel: "senior dog food" },
  { slug: "wet-dog-food-delivery", name: "Wet Dog Food Delivery", petLabel: "wet dog food" },
  { slug: "dry-dog-food-delivery", name: "Dry Dog Food Delivery", petLabel: "dry dog food" },
  { slug: "grain-free-dog-food-delivery", name: "Grain-Free Dog Food Delivery", petLabel: "grain-free dog food" },
  { slug: "raw-dog-food-delivery", name: "Raw Dog Food Delivery", petLabel: "raw dog food" },
  { slug: "dog-toys-delivery", name: "Dog Toys Delivery", petLabel: "dog toys" },
  { slug: "dog-beds-delivery", name: "Dog Beds Delivery", petLabel: "dog beds" },
  { slug: "dog-crates-delivery", name: "Dog Crates Delivery", petLabel: "dog crates" },
  { slug: "dog-grooming-delivery", name: "Dog Grooming Delivery", petLabel: "dog grooming supplies" },
  { slug: "kitten-food-delivery", name: "Kitten Food Delivery", petLabel: "kitten food" },
  { slug: "senior-cat-food-delivery", name: "Senior Cat Food Delivery", petLabel: "senior cat food" },
  { slug: "wet-cat-food-delivery", name: "Wet Cat Food Delivery", petLabel: "wet cat food" },
  { slug: "cat-litter-boxes-delivery", name: "Cat Litter Boxes Delivery", petLabel: "cat litter boxes" },
  { slug: "cat-scratcher-delivery", name: "Cat Scratcher Delivery", petLabel: "cat scratchers" },
  { slug: "cat-toys-delivery", name: "Cat Toys Delivery", petLabel: "cat toys" },
  { slug: "cat-beds-delivery", name: "Cat Beds Delivery", petLabel: "cat beds" },
  { slug: "cat-grooming-delivery", name: "Cat Grooming Delivery", petLabel: "cat grooming supplies" },
  { slug: "fish-supplies-delivery", name: "Fish Supplies Delivery", petLabel: "fish supplies" },
  { slug: "reptile-supplies-delivery", name: "Reptile Supplies Delivery", petLabel: "reptile supplies" },
  { slug: "bird-supplies-delivery", name: "Bird Food & Supplies Delivery", petLabel: "bird food and supplies" },
  { slug: "small-pet-supplies-delivery", name: "Small Pet Supplies Delivery", petLabel: "small pet supplies" },
  { slug: "vet-diet-delivery", name: "Vet-Authorized Diet Delivery", petLabel: "vet-authorized diets" },
  { slug: "pet-medication-delivery", name: "Pet Medication Delivery", petLabel: "pet medication" },
] as const;

export const CANONICAL_NEIGHBORHOODS = [
  {"name": "Flushing", "slug": "flushing-queens", "borough": "Queens", "boroughSlug": "queens", "nearbyAreas": "Whitestone, College Point, and Murray Hill"},
  {"name": "Jackson Heights", "slug": "jackson-heights-queens", "borough": "Queens", "boroughSlug": "queens", "nearbyAreas": "Elmhurst, Woodside, and Corona"},
  {"name": "Astoria", "slug": "astoria-queens", "borough": "Queens", "boroughSlug": "queens", "nearbyAreas": "Long Island City, Ditmars, and Steinway"},
  {"name": "Forest Hills", "slug": "forest-hills-queens", "borough": "Queens", "boroughSlug": "queens", "nearbyAreas": "Rego Park, Kew Gardens, and Austin Street"},
  {"name": "Long Island City", "slug": "long-island-city-queens", "borough": "Queens", "boroughSlug": "queens", "nearbyAreas": "Astoria, Sunnyside, and Hunter's Point"},
  {"name": "Jamaica", "slug": "jamaica-queens", "borough": "Queens", "boroughSlug": "queens", "nearbyAreas": "Hollis, St. Albans, and Springfield Gardens"},
  {"name": "Bayside", "slug": "bayside-queens", "borough": "Queens", "boroughSlug": "queens", "nearbyAreas": "Whitestone, Oakland Gardens, and Fresh Meadows"},
  {"name": "Woodside", "slug": "woodside-queens", "borough": "Queens", "boroughSlug": "queens", "nearbyAreas": "Sunnyside, Jackson Heights, and Maspeth"},
  {"name": "Sunnyside", "slug": "sunnyside-queens", "borough": "Queens", "boroughSlug": "queens", "nearbyAreas": "Woodside, LIC, and Maspeth"},
  {"name": "Elmhurst", "slug": "elmhurst-queens", "borough": "Queens", "boroughSlug": "queens", "nearbyAreas": "Jackson Heights, Corona, and Rego Park"},
  {"name": "Corona", "slug": "corona-queens", "borough": "Queens", "boroughSlug": "queens", "nearbyAreas": "Elmhurst, Jackson Heights, and Flushing"},
  {"name": "Rego Park", "slug": "rego-park-queens", "borough": "Queens", "boroughSlug": "queens", "nearbyAreas": "Forest Hills, Elmhurst, and Woodhaven"},
  {"name": "Ridgewood", "slug": "ridgewood-queens", "borough": "Queens", "boroughSlug": "queens", "nearbyAreas": "Bushwick, Glendale, and Middle Village"},
  {"name": "Fresh Meadows", "slug": "fresh-meadows-queens", "borough": "Queens", "boroughSlug": "queens", "nearbyAreas": "Bayside, Flushing, and Jamaica"},
  {"name": "Howard Beach", "slug": "howard-beach-queens", "borough": "Queens", "boroughSlug": "queens", "nearbyAreas": "Ozone Park, Richmond Hill, and Broad Channel"},
  {"name": "Williamsburg", "slug": "williamsburg-brooklyn", "borough": "Brooklyn", "boroughSlug": "brooklyn", "nearbyAreas": "Greenpoint, Bushwick, and Bedford-Stuyvesant"},
  {"name": "Park Slope", "slug": "park-slope-brooklyn", "borough": "Brooklyn", "boroughSlug": "brooklyn", "nearbyAreas": "Prospect Heights, Carroll Gardens, and Gowanus"},
  {"name": "Sunset Park", "slug": "sunset-park-brooklyn", "borough": "Brooklyn", "boroughSlug": "brooklyn", "nearbyAreas": "Bay Ridge, Greenwood Heights, and Borough Park"},
  {"name": "Crown Heights", "slug": "crown-heights-brooklyn", "borough": "Brooklyn", "boroughSlug": "brooklyn", "nearbyAreas": "Prospect Heights, Flatbush, and Brownsville"},
  {"name": "Flatbush", "slug": "flatbush-brooklyn", "borough": "Brooklyn", "boroughSlug": "brooklyn", "nearbyAreas": "Crown Heights, Midwood, and East Flatbush"},
  {"name": "Bay Ridge", "slug": "bay-ridge-brooklyn", "borough": "Brooklyn", "boroughSlug": "brooklyn", "nearbyAreas": "Fort Hamilton, Dyker Heights, and Bensonhurst"},
  {"name": "Bushwick", "slug": "bushwick-brooklyn", "borough": "Brooklyn", "boroughSlug": "brooklyn", "nearbyAreas": "Ridgewood, East Williamsburg, and Bed-Stuy"},
  {"name": "Greenpoint", "slug": "greenpoint-brooklyn", "borough": "Brooklyn", "boroughSlug": "brooklyn", "nearbyAreas": "Williamsburg, Long Island City, and Astoria"},
  {"name": "Bed-Stuy", "slug": "bed-stuy-brooklyn", "borough": "Brooklyn", "boroughSlug": "brooklyn", "nearbyAreas": "Crown Heights, Bushwick, and Fort Greene"},
  {"name": "Fort Greene", "slug": "fort-greene-brooklyn", "borough": "Brooklyn", "boroughSlug": "brooklyn", "nearbyAreas": "Clinton Hill, Boerum Hill, and Downtown Brooklyn"},
  {"name": "Carroll Gardens", "slug": "carroll-gardens-brooklyn", "borough": "Brooklyn", "boroughSlug": "brooklyn", "nearbyAreas": "Cobble Hill, Red Hook, and Gowanus"},
  {"name": "Cobble Hill", "slug": "cobble-hill-brooklyn", "borough": "Brooklyn", "boroughSlug": "brooklyn", "nearbyAreas": "Carroll Gardens, Boerum Hill, and Red Hook"},
  {"name": "Red Hook", "slug": "red-hook-brooklyn", "borough": "Brooklyn", "boroughSlug": "brooklyn", "nearbyAreas": "Carroll Gardens, Gowanus, and Sunset Park"},
  {"name": "Brighton Beach", "slug": "brighton-beach-brooklyn", "borough": "Brooklyn", "boroughSlug": "brooklyn", "nearbyAreas": "Coney Island, Manhattan Beach, and Sheepshead Bay"},
  {"name": "Bensonhurst", "slug": "bensonhurst-brooklyn", "borough": "Brooklyn", "boroughSlug": "brooklyn", "nearbyAreas": "Bay Ridge, Dyker Heights, and Sunset Park"},
  {"name": "Upper West Side", "slug": "upper-west-side-manhattan", "borough": "Manhattan", "boroughSlug": "manhattan", "nearbyAreas": "Morningside Heights, Lincoln Square, and Riverside Drive"},
  {"name": "Upper East Side", "slug": "upper-east-side-manhattan", "borough": "Manhattan", "boroughSlug": "manhattan", "nearbyAreas": "Carnegie Hill, Yorkville, and East Harlem"},
  {"name": "Chelsea", "slug": "chelsea-manhattan", "borough": "Manhattan", "boroughSlug": "manhattan", "nearbyAreas": "Hell's Kitchen, Flatiron, and West Village"},
  {"name": "Tribeca", "slug": "tribeca-manhattan", "borough": "Manhattan", "boroughSlug": "manhattan", "nearbyAreas": "SoHo, Financial District, and Hudson Square"},
  {"name": "Hell's Kitchen", "slug": "hells-kitchen-manhattan", "borough": "Manhattan", "boroughSlug": "manhattan", "nearbyAreas": "Midtown, Chelsea, and Lincoln Center"},
  {"name": "Harlem", "slug": "harlem-manhattan", "borough": "Manhattan", "boroughSlug": "manhattan", "nearbyAreas": "East Harlem, Washington Heights, and Morningside Heights"},
  {"name": "Washington Heights", "slug": "washington-heights-manhattan", "borough": "Manhattan", "boroughSlug": "manhattan", "nearbyAreas": "Inwood, Harlem, and Fort George"},
  {"name": "Midtown", "slug": "midtown-manhattan", "borough": "Manhattan", "boroughSlug": "manhattan", "nearbyAreas": "Hell's Kitchen, Murray Hill, and Gramercy"},
  {"name": "East Village", "slug": "east-village-manhattan", "borough": "Manhattan", "boroughSlug": "manhattan", "nearbyAreas": "Lower East Side, NoHo, and Gramercy"},
  {"name": "Inwood", "slug": "inwood-manhattan", "borough": "Manhattan", "boroughSlug": "manhattan", "nearbyAreas": "Washington Heights, Fort George, and Hudson Heights"},
  {"name": "Riverdale", "slug": "riverdale-bronx", "borough": "Bronx", "boroughSlug": "bronx", "nearbyAreas": "Fieldston, Kingsbridge, and Spuyten Duyvil"},
  {"name": "Fordham", "slug": "fordham-bronx", "borough": "Bronx", "boroughSlug": "bronx", "nearbyAreas": "Belmont, Kingsbridge, and University Heights"},
  {"name": "Pelham Bay", "slug": "pelham-bay-bronx", "borough": "Bronx", "boroughSlug": "bronx", "nearbyAreas": "Throggs Neck, Co-op City, and City Island"},
  {"name": "Mott Haven", "slug": "mott-haven-bronx", "borough": "Bronx", "boroughSlug": "bronx", "nearbyAreas": "Hunts Point, Port Morris, and Melrose"},
  {"name": "Concourse", "slug": "concourse-bronx", "borough": "Bronx", "boroughSlug": "bronx", "nearbyAreas": "Highbridge, Mount Eden, and Fordham"},
  {"name": "Throgs Neck", "slug": "throgs-neck-bronx", "borough": "Bronx", "boroughSlug": "bronx", "nearbyAreas": "Pelham Bay, Edgewater Park, and Country Club"},
  {"name": "St. George", "slug": "st-george-staten-island", "borough": "Staten Island", "boroughSlug": "staten-island", "nearbyAreas": "Tompkinsville, New Brighton, and Stapleton"},
  {"name": "Tottenville", "slug": "tottenville-staten-island", "borough": "Staten Island", "boroughSlug": "staten-island", "nearbyAreas": "Charleston, Woodrow, and Great Kills"},
  {"name": "Great Kills", "slug": "great-kills-staten-island", "borough": "Staten Island", "boroughSlug": "staten-island", "nearbyAreas": "Eltingville, Bay Terrace, and Annadale"},
  {"name": "Stapleton", "slug": "stapleton-staten-island", "borough": "Staten Island", "boroughSlug": "staten-island", "nearbyAreas": "St. George, Clifton, and Tompkinsville"},
] as const;

export const CANONICAL_NEIGHBORHOOD_ROUTES: NeighborhoodRouteMetadata[] = CANONICAL_NEIGHBORHOODS.flatMap((neighborhood) =>
  CANONICAL_NEIGHBORHOOD_CATEGORIES.map((category) => ({
    slug: `${category.slug}-${neighborhood.slug}`,
    path: `/${category.slug}-${neighborhood.slug}`,
    categorySlug: category.slug,
    categoryName: category.name,
    petLabel: category.petLabel,
    neighborhoodSlug: neighborhood.slug,
    neighborhoodName: neighborhood.name,
    borough: neighborhood.borough,
    boroughSlug: neighborhood.boroughSlug,
    nearbyAreas: neighborhood.nearbyAreas,
  }))
);

if (CANONICAL_NEIGHBORHOOD_CATEGORIES.length !== 28 || CANONICAL_NEIGHBORHOODS.length !== 50 || CANONICAL_NEIGHBORHOOD_ROUTES.length !== 1400) {
  throw new Error('Canonical neighborhood registry must contain exactly 28 categories, 50 neighborhoods, and 1,400 routes');
}

export const NEIGHBORHOOD_PAGE_REGISTRY = new Map<string, NeighborhoodRouteMetadata>(
  CANONICAL_NEIGHBORHOOD_ROUTES.map((route) => [route.slug, route])
);

export const getNeighborhoodRoute = (rawPath: string): NeighborhoodRouteMetadata | undefined => {
  const withoutQuery = rawPath.split('?')[0] || '/';
  const normalized = withoutQuery.length > 1 ? withoutQuery.replace(/\/+$/, '') : withoutQuery;
  return NEIGHBORHOOD_PAGE_REGISTRY.get(normalized.replace(/^\//, ''));
};

