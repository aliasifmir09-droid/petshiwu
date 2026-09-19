/**
 * NYC same-day ZIPs plus next-day metro ZIPs within 50 miles of Queens.
 */

import { NEXT_DAY_ZIPS, type MetroState } from '../data/nextDayMetroZips';

const NYC_RANGES: Array<{ start: number; end: number }> = [
  { start: 10001, end: 10282 }, // Manhattan
  { start: 10301, end: 10314 }, // Staten Island
  { start: 10451, end: 10475 }, // Bronx
  { start: 11004, end: 11005 }, // Queens (Glen Oaks)
  { start: 11101, end: 11109 }, // Queens (Astoria / LIC)
  { start: 11201, end: 11256 }, // Brooklyn
  { start: 11351, end: 11697 }, // Queens (includes Hillside / Jamaica 11432, Hollis 11423)
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

export function isNextDayDeliveryZip(input: string): boolean {
  const zip = normalizeZip(input);
  return /^\d{5}$/.test(zip) && Boolean(NEXT_DAY_ZIPS[zip]);
}

function normalizeStateName(state: string): string {
  return String(state || '')
    .trim()
    .toUpperCase()
    .replace(/\./g, '')
    .replace(/\s+/g, ' ');
}

/** Accept NY, N.Y., New York, and New York State. */
export function isNewYorkState(state: string): boolean {
  const normalized = normalizeStateName(state);
  return normalized === 'NY' || normalized === 'NEW YORK' || normalized === 'NEW YORK STATE';
}

export function isNewJerseyState(state: string): boolean {
  const normalized = normalizeStateName(state);
  return normalized === 'NJ' || normalized === 'NEW JERSEY';
}

export function isConnecticutState(state: string): boolean {
  const normalized = normalizeStateName(state);
  return normalized === 'CT' || normalized === 'CONNECTICUT';
}

function stateMatchesZone(state: string, zoneState: MetroState): boolean {
  if (zoneState === 'NY') return isNewYorkState(state);
  if (zoneState === 'NJ') return isNewJerseyState(state);
  return isConnecticutState(state);
}

export function normalizeShippingState(state: string): string {
  const trimmed = String(state || '').trim();
  if (isNewYorkState(trimmed)) return 'NY';
  if (isNewJerseyState(trimmed)) return 'NJ';
  if (isConnecticutState(trimmed)) return 'CT';
  return trimmed;
}

export function isNycShippingAddress(state: string, zipCode: string): boolean {
  return isNewYorkState(state) && isNycDeliveryZip(zipCode);
}

/** NYC same-day, or next-day to any ZIP within 50 miles of Queens. */
export function isDeliverableShippingAddress(state: string, zipCode: string): boolean {
  const zip = normalizeZip(zipCode);
  if (isNycDeliveryZip(zip)) return isNewYorkState(state);
  const zone = NEXT_DAY_ZIPS[zip];
  if (!zone) return false;
  return stateMatchesZone(state, zone.state);
}

export const OUT_OF_AREA_DELIVERY_MESSAGE =
  'We currently deliver same-day in NYC and next-day to every ZIP within 50 miles of Queens. Nationwide shipping opens in a few days.';
