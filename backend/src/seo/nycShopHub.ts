/**
 * First-wave HTML extras for NYC shoppable hubs.
 * Adds ZIP / compare / nationwide facts. Does not drop product lists or landing URLs.
 */

export const NYC_HUB_PATHS = new Set([
  '/dog-food-delivery-nyc',
  '/cat-food-delivery-nyc',
  '/pet-supplies-delivery-nyc',
  '/pet-supplies-queens-ny',
]);

export const NYC_HUB_ZIP_HEADING = 'Check your ZIP — same-day NYC or nationwide soon';
export const NYC_HUB_COMPARE_HEADING = 'Why NYC shoppers pick Petshiwü first';
export const NYC_HUB_NATIONWIDE_HEADING = 'Nationwide next — not same-day outside NYC';

export const NYC_HUB_ZIP_INTRO =
  'NYC same-day: order by 3 PM weekdays or 1 PM weekends, at your door before 11 PM. Same-day is NYC only. Nationwide shipping opens in a few days as standard delivery, never same-day outside the five boroughs.';

export const NYC_HUB_NATIONWIDE_BODY =
  'Currently delivering in NYC. Nationwide shipping opens in a few days. Free shipping over $49. No autoship. Jackson Heights is warehouse and office, not a walk-in store.';

export const NYC_HUB_COMPARE_ROWS: Array<{
  label: string;
  petshiwu: string;
  manhattanShop: string;
  national: string;
}> = [
  {
    label: 'Same-day coverage',
    petshiwu: 'All 5 boroughs when you order by cutoff',
    manhattanShop: 'Usually Manhattan only',
    national: '1–3 day shipping, not same-day NYC',
  },
  {
    label: 'Cutoff',
    petshiwu: '3 PM weekdays / 1 PM weekends, before 11 PM',
    manhattanShop: 'Often later, smaller zone',
    national: 'Warehouse cutoff, not tonight',
  },
  {
    label: 'Free delivery',
    petshiwu: 'Free over $49 ($6 under)',
    manhattanShop: 'Often $100+ or zone fees',
    national: 'Free over $49, slower',
  },
  {
    label: 'Autoship',
    petshiwu: 'None. Buy once.',
    manhattanShop: 'Varies',
    national: 'Usually a subscription',
  },
  {
    label: 'Walk-in store',
    petshiwu: 'No — delivery only',
    manhattanShop: 'Yes',
    national: 'No',
  },
];

export const NYC_HUB_LINKS: Array<{ path: string; title: string; text: string }> = [
  {
    path: '/dog-food-delivery-nyc',
    title: 'Dog food delivery NYC',
    text: 'Same-day in all 5 boroughs when you order by cutoff.',
  },
  {
    path: '/cat-food-delivery-nyc',
    title: 'Cat food delivery NYC',
    text: 'Wet, dry, litter, and specialty diets to the door.',
  },
  {
    path: '/pet-supplies-delivery-nyc',
    title: 'Pet supplies delivery NYC',
    text: '4,000+ SKUs. Free over $49.',
  },
  {
    path: '/pet-supplies-queens-ny',
    title: 'Pet supplies Queens',
    text: 'Packed in Jackson Heights. Delivery only — not a walk-in.',
  },
];

export function buildNycHubLinkHtml(excludePath = ''): string {
  const links = NYC_HUB_LINKS.filter((item) => item.path !== excludePath)
    .map((item) => `<li><a href="https://www.petshiwu.com${item.path}">${item.title}</a> — ${item.text}</li>`)
    .join('');
  return `<h2>NYC same-day now · nationwide shipping next</h2><ul>${links}</ul>`;
}

export function isNycShoppableHub(pathname: string): boolean {
  const path = pathname.split('?')[0].replace(/\/$/, '') || '/';
  return NYC_HUB_PATHS.has(path);
}

export function buildNycHubShopHtml(): string {
  const rows = NYC_HUB_COMPARE_ROWS.map(
    (row) =>
      `<tr><th scope="row">${row.label}</th><td>${row.petshiwu}</td><td>${row.manhattanShop}</td><td>${row.national}</td></tr>`
  ).join('');

  return `
  <h2>${NYC_HUB_ZIP_HEADING}</h2>
  <p>${NYC_HUB_ZIP_INTRO}</p>
  <h2>${NYC_HUB_COMPARE_HEADING}</h2>
  <table>
    <thead><tr><th> </th><th>Petshiwü</th><th>Manhattan-only shops</th><th>National sites</th></tr></thead>
    <tbody>${rows}</tbody>
  </table>
  <h2>${NYC_HUB_NATIONWIDE_HEADING}</h2>
  <p>${NYC_HUB_NATIONWIDE_BODY}</p>`;
}
