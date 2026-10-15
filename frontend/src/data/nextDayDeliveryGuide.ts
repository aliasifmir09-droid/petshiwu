import type { TrendingLearningMeta } from './trendingLearningMeta';

export const NEXT_DAY_DELIVERY_GUIDE_META: TrendingLearningMeta = {
  slug: 'next-day-pet-delivery-within-50-miles-of-queens',
  title: 'NYC Same-Day Pet Delivery: Check Your ZIP',
  description:
    'Petshiwü delivers same-day in New York City — all five boroughs — for locally stocked items. The whole catalog arrives in 3-5 business days anywhere in the US except Alaska and Hawaii.',
  publishedAt: '2026-09-19T12:00:00.000Z',
  featuredImage: '/blog/kibble-bowl.jpg',
  featuredImageWebp: '/blog/kibble-bowl.webp',
  imageAlt: 'A bowl of pet food packed for a Petshiwü order from the Queens warehouse',
  petType: 'all',
  category: 'Delivery',
  tags: [
    'next day pet delivery',
    'Queens delivery ZIP codes',
    'Hicksville pet delivery',
    'same-day NYC pet delivery',
  ],
  excerpt:
    'In-stock locally stocked products are eligible for same-day delivery in NYC. Everywhere else in the US they arrive in 3-5 business days. TopDawg items are never same-day.',
  shopPath: '/products',
};

export const NEXT_DAY_DELIVERY_GUIDE_HTML = `
      <p>Petshiwü packs from Jackson Heights, Queens — warehouse and office, not a walk-in store. In-stock products are eligible for same-day delivery in New York City.</p>
      <figure>
        <picture>
          <source srcset="/blog/kibble-bowl.webp" type="image/webp" />
          <img src="/blog/kibble-bowl.jpg" alt="A bowl of pet food packed for a Petshiwü order from the Queens warehouse" width="1200" height="675" />
        </picture>
        <figcaption>We ship in-stock food and supplies. Check your ZIP before checkout. No autoship.</figcaption>
      </figure>
      <h2>Same-day in New York City</h2>
      <p><strong>Same-day</strong> is New York City only — Manhattan, Brooklyn, Queens, the Bronx, and Staten Island — when you order by 3 PM ET weekdays or 1 PM ET weekends. After cutoff, NYC orders deliver the next day. Queens Hillside (ZIP 11432) is inside that same-day map. The product you select shows that it is eligible for same-day delivery when it is in stock.</p>
      <p>Locally stocked items outside New York City, and every TopDawg item, arrive in 3-5 business days anywhere in the US except Alaska and Hawaii.</p>
      <h2>How to check your ZIP</h2>
      <p>Open the <a href="/delivery-zips">NYC delivery checker</a>. Enter a five-digit ZIP. A New York City ZIP is eligible for same-day delivery on locally stocked items when you order by cutoff. Every other US ZIP gets nationwide delivery in 3-5 business days. We do not ship to Alaska or Hawaii.</p>
      <h2>Cutoffs, packing, and cost</h2>
      <p>Same-day in NYC is a target, not a guarantee. Weather, traffic, and volume can delay a route. Shipping is $7 under $49 and free at $49, including NYC, for the whole catalog. There is no autoship. Unused items can come back within 365 days. Read the <a href="/shipping">shipping policy</a> for the cutoff matrix.</p>
      <h2>Shop when you already know the food</h2>
      <p>This guide is not a diagnosis and not a flash sale. If a pet is in distress, call a veterinarian. When you are ready to order, <a href="/products">shop in-stock products</a>. For NYC same-day landing pages see <a href="/pet-supplies-delivery-nyc">pet supplies delivery NYC</a>. Editorial rules live on <a href="/editorial-standards">how we write guides</a>.</p>
    `;