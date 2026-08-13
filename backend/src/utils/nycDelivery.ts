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

export function isNycShippingAddress(state: string, zipCode: string): boolean {
  const isNY = String(state || '').trim().toUpperCase() === 'NY';
  return isNY && isNycDeliveryZip(zipCode);
}
