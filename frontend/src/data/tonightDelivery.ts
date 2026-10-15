/** One NYC tonight promise — website, landing pages, and Google Business paste. */

import { CATALOG_PRODUCT_COUNT_LABEL } from '@/config/catalog';

export const TONIGHT = {
  weekdayCutoff: '3 PM',
  weekendCutoff: '1 PM',
  deliverBy: '11 PM',
  timezone: 'ET',
  freeOver: 49,
  underFee: 7,
  phone: '(800) 259-2605',
  promise:
    'Same-day delivery in NYC on locally stocked items. Order by 3 PM weekdays (1 PM weekends), before 11 PM.',
  shortPromise: 'Order by 3 PM weekdays · 1 PM weekends · before 11 PM',
} as const;

export const TONIGHT_STEPS = [
  {
    title: 'Enter your ZIP',
    text: 'See if we deliver to you now. Shipped items go nationwide in 2-5 business days.',
  },
  {
    title: 'Order before cutoff',
    text: 'NYC same-day: 3 PM weekdays, 1 PM weekends. After that, we deliver the next day.',
  },
  {
    title: 'We pack your order',
    text: 'Orders leave our warehouse. It is not a store. We only deliver.',
  },
  {
    title: 'At your door',
    text: 'Same-day delivery in NYC on locally stocked items, before 11 PM when you order by cutoff. Free shipping on orders $49+. $7 delivery under $49.',
  },
] as const;

export const TONIGHT_FAQ = {
  question: 'Do you deliver same-day pet supplies in NYC?',
  answer:
    'Yes. Order by 3 PM ET on weekdays (1 PM ET on weekends) and we aim to deliver before 11 PM the same day across Manhattan, Brooklyn, Queens, the Bronx, and Staten Island. After cutoff, we deliver the next day. Same-day is NYC only, and only for locally stocked items. The rest of the catalog arrives in 2-5 business days anywhere in the US except Alaska and Hawaii. Free delivery over $49 ($7 under that). We are delivery only — Jackson Heights is office and warehouse, not a store. We only deliver.',
};

/** Google Business Profile description — must stay at or under 750 characters. */
export const GBP_DESCRIPTION = `Petshiwu is a nationwide pet delivery company. We are not a store. We only deliver. The catalog ships in 2-5 business days. Free shipping on orders $49+. $7 delivery under $49.

New York City is our home city. Same-day delivery in NYC on locally stocked items when you order by 3 PM weekdays (1 PM weekends), before 11 PM.

Shop ${CATALOG_PRODUCT_COUNT_LABEL} products from Hill's Science Diet, Blue Buffalo, Royal Canin, Wellness, and Purina.`;

export function withTonightFaq(
  items: Array<{ question: string; answer: string }>
): Array<{ question: string; answer: string }> {
  const alreadyHasSameDay = items.some((item) =>
    /same-day|same day|cutoff|3 PM/i.test(`${item.question} ${item.answer}`)
  );
  if (alreadyHasSameDay) return items;
  return [TONIGHT_FAQ, ...items];
}
