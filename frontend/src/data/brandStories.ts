export type BrandStorySlug = 'our-promise' | 'for-pet-parents' | 'from-queens';

export type BrandStory = {
  slug: BrandStorySlug;
  path: `/${BrandStorySlug}`;
  kicker: string;
  slogan: string;
  title: string;
  description: string;
  intro: string;
  image: string;
  imageAlt: string;
  sections: { heading: string; body: string }[];
  ctaLabel: string;
};

export const HOME_SLOGAN = 'Their bowl, wherever you call home.';
export const HOME_SLOGAN_SUPPORT =
  'Vet-quality food and everyday care for every pet parent in America. Same-day in NYC. Two-day to every state. No autoship.';
export const HOME_HERO_IMAGE = '/banner-premium-care.webp';

export const NATIONWIDE_CHIPS = [
  'Same-day NYC',
  '2-day U.S. shipping',
  'Free over $49',
  'No autoship',
  '365-day returns',
];

export const BRAND_STORIES: Record<BrandStorySlug, BrandStory> = {
  'our-promise': {
    slug: 'our-promise',
    path: '/our-promise',
    kicker: 'Our promise',
    slogan: 'Fair prices. Fast to the door. Anywhere you live.',
    title: 'Our Promise | Petshiwu',
    description:
      'Petshiwu ships vet-quality pet food and supplies nationwide. Same-day in NYC, two-day across the U.S. No autoship. 365-day returns.',
    intro:
      'We pack in New York and ship to every state. NYC pet parents can order by cutoff for same-day. Everyone else gets two-day shipping, free over $49. No subscription required — ever.',
    image: '/banner-premium-care.webp',
    imageAlt: 'Premium pet care products packed for delivery',
    sections: [
      {
        heading: 'America first, New York close',
        body: 'Two-day shipping to homes across the United States. Same-day in all five NYC boroughs when you order by 3 PM weekdays (1 PM weekends). Next-day to select nearby metro ZIPs.',
      },
      {
        heading: 'No subscription trap',
        body: 'There is no required autoship. First order: FREEDOM20, 20% off, max $10. Repeat: RESTOCK5, 10% off, max $10. Optional restock reminders only charge when you confirm.',
      },
      {
        heading: 'A return you can trust',
        body: 'Unused items come back for 365 days, wherever we delivered. Call +1 (800) 259-2605 any time. Our Jackson Heights address is warehouse and office only — not a walk-in store.',
      },
    ],
    ctaLabel: 'Shop the promise',
  },
  'for-pet-parents': {
    slug: 'for-pet-parents',
    path: '/for-pet-parents',
    kicker: 'For pet parents',
    slogan: 'For the humans who never skip a meal.',
    title: 'For Pet Parents | Petshiwu',
    description:
      'Petshiwu is for pet parents across America who want vet-quality food and supplies at the door — without a subscription lock-in.',
    intro:
      'You already remember breakfast, dinner, and the late-night water bowl. We remember the bag, the litter, and the chew that lasts past Tuesday. Built for people who take pet care seriously, from coast to coast.',
    image: '/banner-one-stop.webp',
    imageAlt: 'Pet parents shopping food, treats, and everyday supplies',
    sections: [
      {
        heading: 'Their bowl, your evening',
        body: 'Hill’s, Royal Canin, Purina, and everyday supplies. Same-day in NYC when you order by cutoff. Two-day to the rest of the country. Free delivery over $49.',
      },
      {
        heading: 'Dogs, cats, and the rest of the family',
        body: 'Food and care for dogs and cats, plus birds, fish, reptiles, and small pets. One order. One doorstep. No need to hop stores after work.',
      },
      {
        heading: 'Quiet on the upsell',
        body: 'We will not enroll you in autoship to get a fair price. Order once, or set a reminder you confirm. That is the whole offer — in every state we ship to.',
      },
    ],
    ctaLabel: 'Shop for them',
  },
  'from-queens': {
    slug: 'from-queens',
    path: '/from-queens',
    kicker: 'From New York',
    slogan: 'Born in New York. Built for the whole country.',
    title: 'From New York | Petshiwu',
    description:
      'Petshiwu packs in Jackson Heights, New York and ships nationwide. Same-day in NYC. Two-day across the U.S. Office and warehouse only — not a walk-in store.',
    intro:
      'Every order still leaves 37-68 74th Street. From that New York pack we now reach pet parents in every state — same brands, same 24/7 phone line, same 365-day returns.',
    image: '/banner-nyc-tonight.webp',
    imageAlt: 'Petshiwu packing pet supplies in New York for nationwide delivery',
    sections: [
      {
        heading: 'Warehouse, not a shop floor',
        body: 'You cannot walk in. That keeps the line for packing, not browsing. Order online. We bring it to your door — in New York tonight, or across America in two days.',
      },
      {
        heading: 'One standard, fifty states',
        body: 'Same-day in Manhattan, Brooklyn, Queens, the Bronx, and Staten Island when you order by cutoff. Two-day shipping everywhere else in the U.S. Free over $49. Flat $6 under that.',
      },
      {
        heading: 'A New York pack with national brands',
        body: 'Vet-quality food and everyday care, packed here, delivered to you. If something is unused, you have 365 days to send it back.',
      },
    ],
    ctaLabel: 'Shop nationwide',
  },
};

export const BRAND_STORY_LIST = Object.values(BRAND_STORIES);
