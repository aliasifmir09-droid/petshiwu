/** One NYC tonight promise — website, landing pages, and Google Business paste. */

export const TONIGHT = {
  weekdayCutoff: '3 PM',
  weekendCutoff: '1 PM',
  deliverBy: '11 PM',
  timezone: 'EST',
  freeOver: 49,
  underFee: 6,
  phone: '(800) 259-2605',
  promise:
    'Same-day NYC. Order by 3 PM weekdays (1 PM weekends). Delivered before 11 PM. No autoship.',
  shortPromise: 'Order by 3 PM weekdays · 1 PM weekends · before 11 PM · no autoship',
} as const;

export const TONIGHT_STEPS = [
  {
    title: 'Enter your ZIP',
    text: 'We confirm same-day for your neighborhood in all 5 boroughs.',
  },
  {
    title: 'Order before cutoff',
    text: '3 PM weekdays, 1 PM weekends. After that, we deliver tomorrow.',
  },
  {
    title: 'We pack in Queens',
    text: 'Jackson Heights is office and warehouse only — not a walk-in store.',
  },
  {
    title: 'At your door tonight',
    text: 'Before 11 PM. No autoship. Free delivery over $49.',
  },
] as const;

export const TONIGHT_FAQ = {
  question: 'Do you deliver same-day pet supplies in NYC?',
  answer:
    'Yes. Order by 3 PM EST on weekdays (1 PM EST on weekends) and we deliver before 11 PM the same day across Manhattan, Brooklyn, Queens, the Bronx, and Staten Island. After cutoff, we deliver the next day. No autoship. Free delivery over $49 ($6 under that). We are delivery only — Jackson Heights is office and warehouse, not a walk-in store.',
};

/** Google Business Profile description — must stay at or under 750 characters. */
export const GBP_DESCRIPTION = `PetShiwu is same-day pet food and supplies delivery in New York City. We are not a walk-in store. Jackson Heights is office and warehouse only.

Order by 3 PM weekdays (1 PM weekends) and we deliver before 11 PM to all 5 boroughs. No autoship. Free delivery over $49.

Shop 10,000+ products from Hill's Science Diet, Blue Buffalo, Royal Canin, Wellness, Orijen, and Kong.

Queens-based. Delivery to your door.`;

export function withTonightFaq(
  items: Array<{ question: string; answer: string }>
): Array<{ question: string; answer: string }> {
  const alreadyHasSameDay = items.some((item) =>
    /same-day|same day|cutoff|3 PM/i.test(`${item.question} ${item.answer}`)
  );
  if (alreadyHasSameDay) return items;
  return [TONIGHT_FAQ, ...items];
}
