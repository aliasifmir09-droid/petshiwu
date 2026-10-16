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

export const HOME_SLOGAN = 'Ships nationwide.';
export const HOME_SLOGAN_SUPPORT =
  'Free shipping on orders $49+. $7 delivery under $49. Same-day delivery in NYC on locally stocked items.';
export const HOME_HERO_IMAGE = '/hero-side-family.webp';
export const HOME_HERO_IMAGE_JPG = '/hero-side-family.jpg';
export const HOME_HERO_IMAGE_WIDE = '/hero-wide-family.webp';
export const HOME_HERO_IMAGE_WIDE_JPG = '/hero-wide-family.jpg';
export const NATIONWIDE_SOON_NOTE =
  'Nationwide delivery in 2-5 business days. Same-day delivery in NYC on locally stocked items.';
export const HOME_OFFER_STRIP =
  'FREEDOM20 · 20% off first order, max $10 · Free shipping on orders $49+';

export const HOME_PROMO_TILES = [
  {
    title: 'Dog food',
    text: 'Everyday bowls, stocked and ready to ship.',
    to: '/dog',
    label: 'Shop dogs',
    image: '/hero-wide-delivery.webp',
    imageJpg: '/hero-wide-delivery.jpg',
    imageAlt: 'Dog and cat at the door with a Petshiwü delivery',
  },
  {
    title: 'Cat care',
    text: 'Food, litter, and treats in one delivery.',
    to: '/cat',
    label: 'Shop cats',
    image: '/hero-wide-play.webp',
    imageJpg: '/hero-wide-play.jpg',
    imageAlt: 'Puppy, kitten, and small pets with Petshiwü toys',
  },
] as const;

export const NATIONWIDE_CHIPS = [
  'Free shipping on orders $49+',
  '$7 delivery under $49',
  '365-day returns',
  'Secure checkout',
  'Nationwide 2-5 day delivery',
];

export const BRAND_STORIES: Record<BrandStorySlug, BrandStory> = {
  'our-promise': {
    slug: 'our-promise',
    path: '/our-promise',
    kicker: 'Our promise',
    slogan: 'Fair prices. Fast delivery.',
    title: 'Our Promise | Petshiwu',
    description:
      'Petshiwu is a pet delivery platform and company. Free shipping on orders $49+. 365-day returns. Nationwide delivery in 2-5 business days. Same-day delivery in NYC on locally stocked items.',
    intro:
      'Shop the brands you already buy, at a fair price, without a subscription. Free shipping on orders $49+. Unused items come back for 365 days. Same-day in NYC for locally stocked items, and nationwide delivery in 2-5 business days.',
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
        body: 'Unused items come back for 365 days. Call +1 (800) 259-2605 any time. Our warehouse packs orders — it is not a store. We only deliver.',
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
      'Petshiwu is for pet parents who want vet-quality food and supplies at the door — without a subscription lock-in. Free shipping on orders $49+.',
    intro:
      'You already remember breakfast, dinner, and the late-night water bowl. We remember the bag, the litter, and the chew that lasts past Tuesday. Order by pet, by brand, and by what they eat every day.',
    image: '/hero-side-play.webp',
    imageJpg: '/hero-side-play.jpg',
    imageWide: '/hero-wide-play.webp',
    imageWideJpg: '/hero-wide-play.jpg',
    imageAlt: 'Puppy, kitten, hamster, and rabbit with Petshiwü toys and treats',
    sections: [
      {
        heading: 'Shop by pet, then by aisle',
        body: 'Dogs, cats, birds, fish, reptiles, and small pets. Food, treats, litter, toys, and prescription diets — delivered to your door.',
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
    slogan: 'A delivery platform and company. We bring it to your door.',
    title: 'How We Ship | Petshiwu',
    description:
      'Petshiwu is a pet delivery platform and company. Nationwide delivery in 2-5 business days. Same-day delivery in NYC on locally stocked items. Office and warehouse only — not a store. We only deliver. Free shipping on orders $49+.',
    intro:
      'Every order is packed at our warehouse and sent to your door. Nationwide delivery in 2-5 business days. Same-day delivery in NYC on locally stocked items. Same 365-day returns.',
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
        heading: 'Same-day NYC and nationwide delivery',
        body: 'Nationwide delivery in 2-5 business days anywhere in the US except Alaska and Hawaii. Same-day delivery in NYC on locally stocked items when you order by cutoff (3 PM weekdays, 1 PM weekends). Free shipping on orders $49+. $7 delivery under $49.',
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
