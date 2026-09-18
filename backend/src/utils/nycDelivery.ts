/**
 * NYC delivery ZIP ranges used at checkout.
 * Includes Queens 111xx (Astoria / Long Island City) which the old
 * 11201–11697 range skipped.
 */

const NYC_RANGES: Array<{ start: number; end: number }> = [
  { start: 10001, end: 10282 }, // Manhattan
  { start: 10301, end: 10314 }, // Staten Island
  { start: 10451, end: 10475 }, // Bronx
  { start: 11004, end: 11005 }, // Queens (Glen Oaks)
  { start: 11101, end: 11109 }, // Queens (Astoria / LIC)
  { start: 11201, end: 11256 }, // Brooklyn
  { start: 11351, end: 11697 }, // Queens
];

export function normalizeZip(input: string): string {
  return String(input || '').replace(/[^0-9]/g, '').substring(0, 5);
}

export function isNycDeliveryZip(input: string): boolean {
  const zip = normalizeZip(input);
  if (!/^\d{5}$/.test(zip)) return false;
  const zipNum = Number(zip);
  return NYC_RANGES.some((range) => zipNum >= range.start && zipNum <= range.end);
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

export function normalizeShippingState(state: string): string {
  const trimmed = String(state || '').trim();
  return isNewYorkState(trimmed) ? 'NY' : trimmed;
}

export function isNycShippingAddress(state: string, zipCode: string): boolean {
  return isNewYorkState(state) && isNycDeliveryZip(zipCode);
}

export const NYC_BOROUGHS_LABEL = 'Manhattan, Brooklyn, Queens, the Bronx, and Staten Island';

export const OUTSIDE_DELIVERY_RANGE_MESSAGE =
  `We currently deliver only in New York City's 5 boroughs (${NYC_BOROUGHS_LABEL}). New York State and nationwide shipping are coming soon — we can't complete checkout for this address yet.`;

export function outsideDeliveryRangeMessage(state?: string, zipCode?: string): string {
  if (state && isNewYorkState(state) && zipCode && !isNycDeliveryZip(zipCode) && /^\d{5}$/.test(normalizeZip(zipCode))) {
    return `This ZIP is in New York State, but outside New York City. We currently deliver only in NYC's 5 boroughs (${NYC_BOROUGHS_LABEL}). New York State and nationwide shipping are coming soon — we can't complete checkout for this address yet.`;
  }
  return OUTSIDE_DELIVERY_RANGE_MESSAGE;
}
