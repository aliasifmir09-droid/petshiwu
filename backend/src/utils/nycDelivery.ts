/**
 * NYC same-day ZIPs (includes Queens Hillside) plus next-day metro ZIPs (Hicksville, Hoboken, Westchester).
 */

const NYC_RANGES: Array<{ start: number; end: number }> = [
  { start: 10001, end: 10282 }, // Manhattan
  { start: 10301, end: 10314 }, // Staten Island
  { start: 10451, end: 10475 }, // Bronx
  { start: 11004, end: 11005 }, // Queens (Glen Oaks)
  { start: 11101, end: 11109 }, // Queens (Astoria / LIC)
  { start: 11201, end: 11256 }, // Brooklyn
  { start: 11351, end: 11697 }, // Queens (includes Hillside / Jamaica 11432, Hollis 11423)
];

type NextDayZone = { area: string; state: 'NY' | 'NJ' };

const NEXT_DAY_ZIPS: Record<string, NextDayZone> = {
  '07030': { area: 'Hoboken', state: 'NJ' },
  '07086': { area: 'Weehawken', state: 'NJ' },
  '07302': { area: 'Jersey City', state: 'NJ' },
  '07304': { area: 'Jersey City', state: 'NJ' },
  '07305': { area: 'Jersey City', state: 'NJ' },
  '07306': { area: 'Jersey City', state: 'NJ' },
  '07307': { area: 'Jersey City', state: 'NJ' },
  '07310': { area: 'Jersey City', state: 'NJ' },
  '07311': { area: 'Jersey City', state: 'NJ' },
  '10528': { area: 'Harrison', state: 'NY' },
  '10550': { area: 'Mount Vernon', state: 'NY' },
  '10552': { area: 'Mount Vernon', state: 'NY' },
  '10553': { area: 'Mount Vernon', state: 'NY' },
  '10583': { area: 'Scarsdale', state: 'NY' },
  '10601': { area: 'White Plains', state: 'NY' },
  '10603': { area: 'White Plains', state: 'NY' },
  '10604': { area: 'White Plains', state: 'NY' },
  '10605': { area: 'White Plains', state: 'NY' },
  '10606': { area: 'White Plains', state: 'NY' },
  '10701': { area: 'Yonkers', state: 'NY' },
  '10703': { area: 'Yonkers', state: 'NY' },
  '10704': { area: 'Yonkers', state: 'NY' },
  '10705': { area: 'Yonkers', state: 'NY' },
  '10708': { area: 'Bronxville', state: 'NY' },
  '10801': { area: 'New Rochelle', state: 'NY' },
  '11801': { area: 'Hicksville', state: 'NY' },
  '11802': { area: 'Hicksville', state: 'NY' },
  '11803': { area: 'Plainview', state: 'NY' },
  '11804': { area: 'Old Bethpage', state: 'NY' },
};

export function normalizeZip(input: string): string {
  return String(input || '').replace(/[^0-9]/g, '').substring(0, 5);
}

export function isNycDeliveryZip(input: string): boolean {
  const zip = normalizeZip(input);
  if (!/^\d{5}$/.test(zip)) return false;
  const zipNum = Number(zip);
  return NYC_RANGES.some((range) => zipNum >= range.start && zipNum <= range.end);
}

export function isNextDayDeliveryZip(input: string): boolean {
  const zip = normalizeZip(input);
  return /^\d{5}$/.test(zip) && Boolean(NEXT_DAY_ZIPS[zip]);
}

/** Accept NY, N.Y., New York, and New York State. */
export function isNewYorkState(state: string): boolean {
  const normalized = String(state || '')
    .trim()
    .toUpperCase()
    .replace(/\./g, '')
    .replace(/\s+/g, ' ');
  return normalized === 'NY' || normalized === 'NEW YORK' || normalized === 'NEW YORK STATE';
}

export function isNewJerseyState(state: string): boolean {
  const normalized = String(state || '')
    .trim()
    .toUpperCase()
    .replace(/\./g, '')
    .replace(/\s+/g, ' ');
  return normalized === 'NJ' || normalized === 'NEW JERSEY';
}

export function normalizeShippingState(state: string): string {
  const trimmed = String(state || '').trim();
  if (isNewYorkState(trimmed)) return 'NY';
  if (isNewJerseyState(trimmed)) return 'NJ';
  return trimmed;
}

export function isNycShippingAddress(state: string, zipCode: string): boolean {
  return isNewYorkState(state) && isNycDeliveryZip(zipCode);
}

/** NYC same-day or next-day metro. San Francisco and other US ZIPs stay blocked until nationwide opens. */
export function isDeliverableShippingAddress(state: string, zipCode: string): boolean {
  const zip = normalizeZip(zipCode);
  if (isNycDeliveryZip(zip)) return isNewYorkState(state);
  const zone = NEXT_DAY_ZIPS[zip];
  if (!zone) return false;
  return zone.state === 'NY' ? isNewYorkState(state) : isNewJerseyState(state);
}

export const OUT_OF_AREA_DELIVERY_MESSAGE =
  'We currently deliver same-day in NYC (including Queens Hillside) and next-day to nearby metro ZIPs including Hicksville. Nationwide shipping opens in a few days.';

