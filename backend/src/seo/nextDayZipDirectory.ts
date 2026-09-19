import { NEXT_DAY_ZIPS, NEXT_DAY_RADIUS_MILES, type MetroState, type NextDayZone } from '../data/nextDayMetroZips';

const STATE_LABELS: Record<MetroState, string> = {
  NY: 'New York',
  NJ: 'New Jersey',
  CT: 'Connecticut',
};

const STATE_ORDER: MetroState[] = ['NY', 'NJ', 'CT'];

export const NEXT_DAY_ZIP_COUNT = Object.keys(NEXT_DAY_ZIPS).length;

function esc(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function buildNextDayZipDirectoryHtml(): string {
  const byState = new Map<MetroState, Map<string, string[]>>();
  for (const [zip, zone] of Object.entries(NEXT_DAY_ZIPS) as Array<[string, NextDayZone]>) {
    if (!byState.has(zone.state)) byState.set(zone.state, new Map());
    const cities = byState.get(zone.state)!;
    const current = cities.get(zone.area) ?? [];
    current.push(zip);
    cities.set(zone.area, current);
  }

  const sections = STATE_ORDER.filter((state) => byState.has(state))
    .map((state) => {
      const cities = [...byState.get(state)!.entries()]
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([city, zips]) => {
          const zipList = zips.sort().map((zip) => `<code>${esc(zip)}</code>`).join(' ');
          return `<h3>${esc(city)}</h3><p>${zipList}</p>`;
        })
        .join('');
      const count = [...byState.get(state)!.values()].reduce((sum, zips) => sum + zips.length, 0);
      return `<h2>${esc(STATE_LABELS[state])} (${count})</h2>${cities}`;
    })
    .join('');

  return `<div>
<h1>Next-day delivery ZIPs within ${NEXT_DAY_RADIUS_MILES} miles of Queens</h1>
<p>Petshiwü accepts orders for next-day delivery to ${NEXT_DAY_ZIP_COUNT} ZIP codes within ${NEXT_DAY_RADIUS_MILES} miles of our Jackson Heights, Queens warehouse. Same-day is New York City — all five boroughs. Nationwide shipping soon.</p>
<p><a href="https://www.petshiwu.com/shipping">Shipping information</a> · <a href="https://www.petshiwu.com/products">Shop in-stock</a></p>
${sections}
</div>`;
}
