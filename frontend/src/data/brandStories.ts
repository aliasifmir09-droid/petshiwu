export type BrandStorySlug = 'our-promise' | 'for-pet-parents' | 'from-queens';

export type BrandStory = {
  slug: BrandStorySlug;
  path: `/${BrandStorySlug}`;
  kicker: string;
  slogan: string;
  title: string;
  description: string;
  intro: string;
  sections: { heading: string; body: string }[];
  ctaLabel: string;
};

export const HOME_SLOGAN = 'Packed in Queens. At their bowl tonight.';
export const HOME_SLOGAN_SUPPORT = 'Thank you for trusting us with their dinner.';

export const BRAND_STORIES: Record<BrandStorySlug, BrandStory> = {
  'our-promise': {
    slug: 'our-promise',
    path: '/our-promise',
    kicker: 'Our promise',
    slogan: 'Packed in Queens. At their bowl tonight.',
    title: 'Our Promise | Petshiwu',
    description:
      'Petshiwu packs pet food and supplies in Jackson Heights and delivers same-day across NYC’s five boroughs. No autoship. 365-day returns.',
    intro:
      'We pack in Jackson Heights, not a walk-in store. Order by 3 PM on weekdays (1 PM weekends) and we bring food, litter, and everyday care to the door — before 11 PM, across all five boroughs.',
    sections: [
      {
        heading: 'Same-day, said plainly',
        body: 'Weekdays 3 PM. Weekends 1 PM. We pack on 74th Street and deliver before 11 PM in Manhattan, Brooklyn, Queens, the Bronx, and Staten Island. After cutoff, it is next-day NYC.',
      },
      {
        heading: 'No subscription trap',
        body: 'There is no required autoship. First order: FREEDOM20, 20% off, max $10. Repeat: RESTOCK5, 10% off, max $10. Optional restock reminders only charge when you confirm.',
      },
      {
        heading: 'A return you can trust',
        body: 'Unused items come back for 365 days. Call +1 (800) 259-2605 any time. The Jackson Heights address is warehouse and office only.',
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
      'Petshiwu is for NYC pet parents who want vet-quality food and supplies at the door — without a subscription lock-in.',
    intro:
      'You already remember breakfast, dinner, and the late-night water bowl. We remember the bag, the litter, and the chew that lasts past Tuesday. Built for people who take pet care seriously.',
    sections: [
      {
        heading: 'Their bowl, your evening',
        body: 'Hill’s, Royal Canin, Purina, and everyday supplies packed in Queens. Same-day when you order by cutoff. Free delivery over $49.',
      },
      {
        heading: 'Dogs, cats, and the rest of the family',
        body: 'Food and care for dogs and cats, plus birds, fish, reptiles, and small pets. One order. One doorstep. No need to hop stores after work.',
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
    kicker: 'From Queens',
    slogan: 'A Jackson Heights pack. A New York City door.',
    title: 'From Queens | Petshiwu',
    description:
      'Petshiwu packs every order in Jackson Heights, Queens and delivers across NYC. Office and warehouse only — not a walk-in store.',
    intro:
      'Every bag leaves 37-68 74th Street. Neighbors in Jackson Heights, Astoria, Williamsburg, and the rest of the five boroughs get the same pack, the same cutoff, the same 24/7 phone line.',
    sections: [
      {
        heading: 'Warehouse, not a shop floor',
        body: 'You cannot walk in. That keeps the line for packing, not browsing. Order online. We bring it to your door.',
      },
      {
        heading: 'Five boroughs, one standard',
        body: 'Same-day in Manhattan, Brooklyn, Queens, the Bronx, and Staten Island when you order by cutoff. Free over $49. Flat $6 under that.',
      },
      {
        heading: 'A local pack with national brands',
        body: 'Vet-quality food and everyday care, packed here, delivered tonight. If something is unused, you have 365 days to send it back.',
      },
    ],
    ctaLabel: 'Shop from Queens',
  },
};

export const BRAND_STORY_LIST = Object.values(BRAND_STORIES);
