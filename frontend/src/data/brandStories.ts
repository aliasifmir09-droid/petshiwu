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
  imageJpg: string;
  imageWide: string;
  imageWideJpg: string;
  imageAlt: string;
  sections: { heading: string; body: string }[];
  ctaLabel: string;
};

export const HOME_SLOGAN = '20% off first order.';
export const HOME_SLOGAN_SUPPORT = 'Max $10 · no autoship. Same-day NYC.';
export const HOME_HERO_IMAGE = '/hero-side-family.webp';
export const HOME_HERO_IMAGE_JPG = '/hero-side-family.jpg';
export const HOME_HERO_IMAGE_WIDE = '/hero-wide-family.webp';
export const HOME_HERO_IMAGE_WIDE_JPG = '/hero-wide-family.jpg';
export const NATIONWIDE_SOON_NOTE =
  'Currently delivering in NYC. Nationwide shipping opens in a few days.';
export const HOME_OFFER_STRIP =
  'FREEDOM20 · 20% off first order, max $10 · No autoship · Free shipping over $49';

export const HOME_PROMO_TILES = [
  {
    title: 'Same-day NYC',
    text: 'Order by cutoff. At the door tonight.',
    to: '/products',
    label: 'Shop same-day',
    image: '/hero-wide-delivery.webp',
    imageJpg: '/hero-wide-delivery.jpg',
    imageAlt: 'Dog and cat at the door with a Petshiwü delivery',
  },
  {
    title: '365-day returns',
    text: 'PayPal or card. Call 24/7.',
    to: '/our-promise',
    label: 'See our promise',
    image: '/hero-wide-play.webp',
    imageJpg: '/hero-wide-play.jpg',
    imageAlt: 'Puppy, kitten, and small pets with Petshiwü toys',
  },
] as const;

export const NATIONWIDE_CHIPS = [
  'Free over $49',
  'No autoship',
  '365-day returns',
  'PayPal checkout',
  '24/7 support',
];

export const BRAND_STORIES: Record<BrandStorySlug, BrandStory> = {
  'our-promise': {
    slug: 'our-promise',
    path: '/our-promise',
    kicker: 'Our promise',
    slogan: 'Fair prices. Fast delivery. No autoship.',
    title: 'Our Promise | Petshiwu',
    description:
      'Petshiwu is an online pet store for food, treats, and supplies. Free shipping over $49. No autoship. 365-day returns. Currently delivering in NYC, with nationwide shipping opening soon.',
    intro:
      'Shop the brands you already buy, at a fair price, without a subscription. Free shipping over $49. Unused items come back for 365 days. We are delivering in NYC now, and nationwide shipping opens in a few days.',
    image: '/hero-side-family.webp',
    imageJpg: '/hero-side-family.jpg',
    imageWide: '/hero-wide-family.webp',
    imageWideJpg: '/hero-wide-family.jpg',
    imageAlt: 'Golden retriever, cat, and macaw with Petshiwü food and bags',
    sections: [
      {
        heading: 'The brands you already trust',
        body: 'Hill’s, Royal Canin, Purina, Blue Buffalo, Wellness, and everyday supplies for dogs, cats, birds, fish, reptiles, and small pets. One cart. One checkout.',
      },
      {
        heading: 'No subscription trap',
        body: 'There is no required autoship. First order: FREEDOM20, 20% off, max $10. Repeat: RESTOCK5, 10% off, max $10. Optional restock reminders only charge when you confirm.',
      },
      {
        heading: 'A return you can trust',
        body: 'Unused items come back for 365 days. Call +1 (800) 259-2605 any time. Our warehouse packs orders — it is not a walk-in store.',
      },
    ],
    ctaLabel: 'Shop now',
  },
  'for-pet-parents': {
    slug: 'for-pet-parents',
    path: '/for-pet-parents',
    kicker: 'For pet parents',
    slogan: 'Food, treats, and care — without a subscription.',
    title: 'For Pet Parents | Petshiwu',
    description:
      'Petshiwu is for pet parents who want vet-quality food and supplies at the door — without a subscription lock-in. Free shipping over $49. No autoship.',
    intro:
      'You already remember breakfast, dinner, and the late-night water bowl. We remember the bag, the litter, and the chew that lasts past Tuesday. Shop like a national pet store: by pet, by brand, and by what they eat every day.',
    image: '/hero-side-play.webp',
    imageJpg: '/hero-side-play.jpg',
    imageWide: '/hero-wide-play.webp',
    imageWideJpg: '/hero-wide-play.jpg',
    imageAlt: 'Puppy, kitten, hamster, and rabbit with Petshiwü toys and treats',
    sections: [
      {
        heading: 'Shop by pet, then by aisle',
        body: 'Dogs, cats, birds, fish, reptiles, and small pets. Food, treats, litter, toys, and prescription diets — the same aisles you expect from a national pet retailer.',
      },
      {
        heading: 'Vet-quality nutrition',
        body: 'Hill’s, Royal Canin, Purina, and everyday care. Your vet can upload or fax a prescription at checkout for veterinary diets.',
      },
      {
        heading: 'Quiet on the upsell',
        body: 'We will not enroll you in autoship to get a fair price. Order once, or set a reminder you confirm. That is the whole offer.',
      },
    ],
    ctaLabel: 'Shop for them',
  },
  'from-queens': {
    slug: 'from-queens',
    path: '/from-queens',
    kicker: 'How we ship',
    slogan: 'Online pet store. We bring it to your door.',
    title: 'How We Ship | Petshiwu',
    description:
      'Petshiwu is an online pet store. Currently delivering in NYC, with nationwide shipping opening in a few days. Office and warehouse only — not a walk-in store. Free shipping over $49. No autoship.',
    intro:
      'Every order is packed at our warehouse and sent to your door. We are delivering in NYC today. Nationwide shipping opens in a few days — same brands, same 24/7 phone line, same 365-day returns.',
    image: '/hero-side-delivery.webp',
    imageJpg: '/hero-side-delivery.jpg',
    imageWide: '/hero-wide-delivery.webp',
    imageWideJpg: '/hero-wide-delivery.jpg',
    imageAlt: 'Dog and cat at the door with a Petshiwü delivery',
    sections: [
      {
        heading: 'Warehouse, not a shop floor',
        body: 'You cannot walk in. That keeps the line for packing, not browsing. Order online and we bring it to your door.',
      },
      {
        heading: 'NYC now, nationwide next',
        body: 'Same-day in the five boroughs when you order by cutoff (3 PM weekdays, 1 PM weekends). Nationwide shipping opens in a few days. Free over $49. Flat $6 under that.',
      },
      {
        heading: 'One standard, every order',
        body: 'Vet-quality food and everyday care, packed here, delivered to you. If something is unused, you have 365 days to send it back.',
      },
    ],
    ctaLabel: 'Shop all products',
  },
};

export const BRAND_STORY_LIST = Object.values(BRAND_STORIES);
