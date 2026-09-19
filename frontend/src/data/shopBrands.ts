/** Curated shoppable brand URLs. Keep in sync with backend/src/seo/shopBrands.ts.
 * Do not generate a page per catalog brand — only this allowlist is indexable. */

export type ShopBrand = {
  slug: string;
  name: string;
  query: string;
  h1: string;
  title: string;
  description: string;
  intro: string;
  logo?: string;
  dark?: boolean;
  homeStrip?: boolean;
  footer?: boolean;
  relatedSlugs?: string[];
};

const SNIPPET_SUFFIX =
  'In stock. Free shipping over $49. No autoship. Nationwide shipping soon.';

export function shopBrandTitle(name: string): string {
  return `${name} | In stock · free ship $49+ | Petshiwu`;
}

export function shopBrandDescription(name: string, unique: string): string {
  return `Shop ${name} at Petshiwu. ${unique} ${SNIPPET_SUFFIX}`;
}

export const BRAND_INDEX_META = {
  h1: 'Shop pet food brands',
  title: 'Shop Pet Food Brands | In stock · free ship $49+ | Petshiwu',
  description:
    "Shop Hill's, Merrick, Purina, Blue Buffalo, Royal Canin, and more at Petshiwu. In stock. Free shipping over $49. No autoship. Nationwide shipping soon.",
  intro:
    "Choose a brand and shop in-stock food, treats, and supplies. Same-day in NYC. Next-day within 50 miles of Queens. Nationwide shipping soon. No autoship.",
};

export const SHOP_BRANDS: ShopBrand[] = [
  {
    slug: 'hills-science-diet',
    name: "Hill's Science Diet",
    query: "Hill's Science Diet",
    h1: "Shop Hill's Science Diet",
    title: shopBrandTitle("Hill's Science Diet"),
    description: shopBrandDescription("Hill's Science Diet", 'Vet-formulated food for dogs and cats.'),
    intro:
      "Hill's Science Diet is in stock for dogs and cats, including sensitive-stomach and adult recipes. Same-day NYC. Nationwide shipping soon. No autoship.",
    logo: '/brands/hills.png',
    homeStrip: true,
    footer: true,
  },
  {
    slug: 'merrick',
    name: 'Merrick',
    query: 'Merrick',
    h1: 'Shop Merrick',
    title: shopBrandTitle('Merrick'),
    description: shopBrandDescription('Merrick', 'Real-ingredient recipes for dogs and cats.'),
    intro:
      'Merrick recipes use real meat and wholesome ingredients for dogs and cats. In stock now. Same-day NYC. Nationwide shipping soon. No autoship.',
    homeStrip: true,
    footer: true,
  },
  {
    slug: 'blue-buffalo',
    name: 'Blue Buffalo',
    query: 'Blue Buffalo',
    h1: 'Shop Blue Buffalo',
    title: shopBrandTitle('Blue Buffalo'),
    description: shopBrandDescription('Blue Buffalo', 'Natural food with LifeSource Bits.'),
    intro:
      'Blue Buffalo dry and wet recipes for dogs and cats, including Life Protection and Wilderness. In stock. Same-day NYC. Nationwide shipping soon.',
    logo: '/brands/bluebuffalo.png',
    homeStrip: true,
    footer: true,
  },
  {
    slug: 'purina',
    name: 'Purina',
    query: 'Purina',
    h1: 'Shop Purina',
    title: shopBrandTitle('Purina'),
    description: shopBrandDescription('Purina', 'Pro Plan, Cat Chow, Friskies, and more.'),
    intro:
      'Shop the Purina family at Petshiwu — Pro Plan, Cat Chow, Friskies, and everyday Purina recipes. In stock. Same-day NYC. Nationwide shipping soon. No autoship.',
    logo: '/brands/purina.svg',
    homeStrip: true,
    footer: true,
    relatedSlugs: ['purina-pro-plan', 'purina-cat-chow', 'friskies', 'temptations'],
  },
  {
    slug: 'purina-pro-plan',
    name: 'Purina Pro Plan',
    query: 'Purina Pro Plan',
    h1: 'Shop Purina Pro Plan',
    title: shopBrandTitle('Purina Pro Plan'),
    description: shopBrandDescription('Purina Pro Plan', 'Performance and sensitive-stomach formulas.'),
    intro:
      'Purina Pro Plan performance recipes for dogs and cats, including sensitive-stomach and high-protein bags. In stock. Same-day NYC. Nationwide shipping soon.',
    footer: true,
    relatedSlugs: ['purina', 'purina-cat-chow'],
  },
  {
    slug: 'purina-cat-chow',
    name: 'Purina Cat Chow',
    query: 'Purina Cat Chow',
    h1: 'Shop Purina Cat Chow',
    title: shopBrandTitle('Purina Cat Chow'),
    description: shopBrandDescription('Purina Cat Chow', 'Everyday complete dry cat food.'),
    intro:
      'Purina Cat Chow complete dry recipes for indoor and adult cats. In stock. Same-day NYC. Nationwide shipping soon. No autoship.',
    footer: true,
    relatedSlugs: ['purina', 'friskies', 'temptations'],
  },
  {
    slug: 'royal-canin',
    name: 'Royal Canin',
    query: 'Royal Canin',
    h1: 'Shop Royal Canin',
    title: shopBrandTitle('Royal Canin'),
    description: shopBrandDescription('Royal Canin', 'Breed- and size-specific formulas.'),
    intro:
      'Royal Canin breed, size, and veterinary-diet recipes for dogs and cats. In stock. Same-day NYC. Nationwide shipping soon. No autoship.',
    logo: '/brands/royalcanin.svg',
    homeStrip: true,
    footer: true,
  },
  {
    slug: 'friskies',
    name: 'Friskies',
    query: 'Friskies',
    h1: 'Shop Friskies',
    title: shopBrandTitle('Friskies'),
    description: shopBrandDescription('Friskies', 'Wet and dry cat food cats actually finish.'),
    intro:
      'Friskies wet and dry cat food, including classic pate and gravy recipes. In stock. Same-day NYC. Nationwide shipping soon. No autoship.',
    homeStrip: true,
    footer: true,
    relatedSlugs: ['purina', 'purina-cat-chow', 'temptations'],
  },
  {
    slug: 'temptations',
    name: 'Temptations',
    query: 'Temptations',
    h1: 'Shop Temptations',
    title: shopBrandTitle('Temptations'),
    description: shopBrandDescription('Temptations', 'Crunchy cat treats and snack mixes.'),
    intro:
      'Temptations cat treats and mix-ins for everyday rewards. In stock. Same-day NYC. Nationwide shipping soon. No autoship.',
    homeStrip: true,
    footer: true,
    relatedSlugs: ['friskies', 'purina-cat-chow'],
  },
  {
    slug: 'simply-nourish',
    name: 'Simply Nourish',
    query: 'Simply Nourish',
    h1: 'Shop Simply Nourish',
    title: shopBrandTitle('Simply Nourish'),
    description: shopBrandDescription('Simply Nourish', 'Limited-ingredient recipes for dogs and cats.'),
    intro:
      'Simply Nourish limited-ingredient and wholesome recipes for dogs and cats. In stock. Same-day NYC. Nationwide shipping soon. No autoship.',
    homeStrip: true,
    footer: true,
  },
  {
    slug: 'wellness',
    name: 'Wellness',
    query: 'Wellness',
    h1: 'Shop Wellness',
    title: shopBrandTitle('Wellness'),
    description: shopBrandDescription('Wellness', 'Core and Complete Health lines.'),
    intro:
      'Wellness Core and Complete Health recipes for dogs and cats. In stock. Same-day NYC. Nationwide shipping soon. No autoship.',
    logo: '/brands/wellness.png',
    homeStrip: true,
  },
  {
    slug: 'iams',
    name: 'Iams',
    query: 'Iams',
    h1: 'Shop Iams',
    title: shopBrandTitle('Iams'),
    description: shopBrandDescription('Iams', 'Everyday nutrition for dogs and cats.'),
    intro:
      'Iams everyday dog and cat food at a fair price. In stock. Same-day NYC. Nationwide shipping soon. No autoship.',
    logo: '/brands/iams.png',
    homeStrip: true,
  },
  {
    slug: 'pedigree',
    name: 'Pedigree',
    query: 'Pedigree',
    h1: 'Shop Pedigree',
    title: shopBrandTitle('Pedigree'),
    description: shopBrandDescription('Pedigree', 'Dog food and treats at everyday prices.'),
    intro:
      'Pedigree dry food, wet food, and treats for dogs. In stock. Same-day NYC. Nationwide shipping soon. No autoship.',
    logo: '/brands/pedigree.png',
    dark: true,
    homeStrip: true,
  },
  {
    slug: 'nutro',
    name: 'Nutro',
    query: 'NUTRO',
    h1: 'Shop Nutro',
    title: shopBrandTitle('Nutro'),
    description: shopBrandDescription('Nutro', 'Natural recipes with farm-grown ingredients.'),
    intro:
      'Nutro natural dog and cat recipes with farm-grown ingredients. In stock. Same-day NYC. Nationwide shipping soon. No autoship.',
    logo: '/brands/nutro.png',
    homeStrip: true,
  },
  {
    slug: 'natures-recipe',
    name: "Nature's Recipe",
    query: "Nature's Recipe",
    h1: "Shop Nature's Recipe",
    title: shopBrandTitle("Nature's Recipe"),
    description: shopBrandDescription("Nature's Recipe", 'Grain-free and wholesome recipes.'),
    intro:
      "Nature's Recipe grain-free and wholesome recipes for dogs. In stock. Same-day NYC. Nationwide shipping soon. No autoship.",
    logo: '/brands/natures.svg',
    homeStrip: true,
  },
];

export const SHOP_BRAND_BY_SLUG: Record<string, ShopBrand> = Object.fromEntries(
  SHOP_BRANDS.map((brand) => [brand.slug, brand])
);

export const SHOP_BRAND_PATHS: string[] = ['/brand', ...SHOP_BRANDS.map((brand) => `/brand/${brand.slug}`)];

export const HOME_STRIP_BRANDS = SHOP_BRANDS.filter((brand) => brand.homeStrip);
export const FOOTER_SHOP_BRANDS = SHOP_BRANDS.filter((brand) => brand.footer);

export function getShopBrand(slug: string | undefined): ShopBrand | undefined {
  if (!slug) return undefined;
  return SHOP_BRAND_BY_SLUG[slug];
}

export function isShopBrandSlug(slug: string | undefined): boolean {
  return Boolean(slug && SHOP_BRAND_BY_SLUG[slug]);
}

export function shopBrandForPath(pathname: string): ShopBrand | undefined {
  const clean = (pathname.split('?')[0] || '/').replace(/\/+$/, '') || '/';
  const match = clean.match(/^\/brand\/([a-z0-9-]+)$/);
  if (!match) return undefined;
  return getShopBrand(match[1]);
}

export function shopBrandStaticPages(): Record<string, { title: string; description: string }> {
  const pages: Record<string, { title: string; description: string }> = {
    '/brand': { title: BRAND_INDEX_META.title, description: BRAND_INDEX_META.description },
  };
  for (const brand of SHOP_BRANDS) {
    pages[`/brand/${brand.slug}`] = { title: brand.title, description: brand.description };
  }
  return pages;
}
