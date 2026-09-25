/**
 * Instant delivery lookup for NYC ZIP codes.
 * Same-day cutoff matches ShippingPolicy: 3 PM EST weekdays, 1 PM EST weekends.
 */

import { NEXT_DAY_ZIPS, type MetroState } from '@/data/nextDayMetroZips';
import { DEFAULT_TAX_RATE, TAX_RATES_BY_STATE } from '@/config/constants';

export type DeliverySpeed = 'same-day' | 'next-day' | 'standard';

export interface ZipLookupResult {
  zip: string;
  area: string;
  speed: DeliverySpeed;
  headline: string;
  detail: string;
  cutoffPassed: boolean;
}

export interface CutoffCountdown {
  hours: number;
  minutes: number;
  seconds: number;
  passed: boolean;
  cutoffHour: number;
  cutoffLabel: string;
  isWeekend: boolean;
}

const NYC_RANGES: Array<{ start: number; end: number; area: string }> = [
  { start: 10001, end: 10282, area: 'Manhattan' },
  { start: 10301, end: 10314, area: 'Staten Island' },
  { start: 10451, end: 10475, area: 'the Bronx' },
  { start: 11004, end: 11005, area: 'Queens' },
  { start: 11101, end: 11109, area: 'Queens' },
  { start: 11201, end: 11256, area: 'Brooklyn' },
  { start: 11351, end: 11697, area: 'Queens' }, // includes Hillside / Jamaica 11432, Hollis 11423
];

const NYC_BOUNDS = {
  minLat: 40.49,
  maxLat: 40.92,
  minLng: -74.26,
  maxLng: -73.7,
};

export function normalizeZip(input: string): string {
  return input.replace(/\D/g, '').slice(0, 5);
}

export function isValidZip(zip: string): boolean {
  return /^\d{5}$/.test(zip);
}

export function getNyDateParts(now: Date = new Date()) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/New_York',
    weekday: 'short',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(now);

  const get = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value ?? '0';

  const weekday = get('weekday');
  const isWeekend = weekday === 'Sat' || weekday === 'Sun';
  return {
    weekday,
    isWeekend,
    hour: Number(get('hour')),
    minute: Number(get('minute')),
    second: Number(get('second')),
  };
}

export function getSameDayCutoffHour(now: Date = new Date()): number {
  return getNyDateParts(now).isWeekend ? 13 : 15;
}

export function getCutoffCountdown(now: Date = new Date()): CutoffCountdown {
  const { isWeekend, hour, minute, second } = getNyDateParts(now);
  const cutoffHour = getSameDayCutoffHour(now);
  const remaining =
    cutoffHour * 3600 - (hour * 3600 + minute * 60 + second);
  const passed = remaining <= 0;
  const abs = Math.abs(remaining);

  return {
    hours: Math.floor(abs / 3600),
    minutes: Math.floor((abs % 3600) / 60),
    seconds: abs % 60,
    passed,
    cutoffHour,
    cutoffLabel: isWeekend ? '1:00 PM EST' : '3:00 PM EST',
    isWeekend,
  };
}

function findNycArea(zipNum: number): string | null {
  const match = NYC_RANGES.find((range) => zipNum >= range.start && zipNum <= range.end);
  return match?.area ?? null;
}

export function isNycDeliveryZip(input: string): boolean {
  const zip = normalizeZip(input);
  if (!isValidZip(zip)) return false;
  return findNycArea(Number(zip)) !== null;
}

function normalizeStateName(state: string): string {
  return String(state || '')
    .trim()
    .toUpperCase()
    .replace(/\./g, '')
    .replace(/\s+/g, ' ');
}

/** Accept NJ, N.J., New Jersey. */
export function isNewJerseyState(state: string): boolean {
  const normalized = normalizeStateName(state);
  return normalized === 'NJ' || normalized === 'NEW JERSEY';
}

/** Accept CT, C.T., Connecticut. */
export function isConnecticutState(state: string): boolean {
  const normalized = normalizeStateName(state);
  return normalized === 'CT' || normalized === 'CONNECTICUT';
}

function stateMatchesZone(state: string, zoneState: MetroState): boolean {
  if (zoneState === 'NY') return isNewYorkState(state);
  if (zoneState === 'NJ') return isNewJerseyState(state);
  return isConnecticutState(state);
}

export function isNextDayDeliveryZip(input: string): boolean {
  const zip = normalizeZip(input);
  return isValidZip(zip) && Boolean(NEXT_DAY_ZIPS[zip]);
}

/** NYC same-day, or next-day to any ZIP within 50 miles of Queens. */
export function isDeliverableShippingAddress(state: string, zipCode: string): boolean {
  const zip = normalizeZip(zipCode);
  if (isNycDeliveryZip(zip)) return isNewYorkState(state);
  const zone = NEXT_DAY_ZIPS[zip];
  if (!zone) return false;
  return stateMatchesZone(state, zone.state);
}

/** Accept NY, N.Y., New York, and New York State. */
export function isNewYorkState(state: string): boolean {
  const normalized = normalizeStateName(state);
  return normalized === 'NY' || normalized === 'NEW YORK' || normalized === 'NEW YORK STATE';
}

export function normalizeShippingState(state: string): string {
  const trimmed = String(state || '').trim();
  if (isNewYorkState(trimmed)) return 'NY';
  if (isNewJerseyState(trimmed)) return 'NJ';
  if (isConnecticutState(trimmed)) return 'CT';
  return trimmed;
}

/**
 * Destination-based sales tax: the rate follows the SHIPPING address state.
 * Must stay in sync with backend orderPricingService.ts.
 * NY 8.875% (4% state + 4.5% city + 0.375% MCTD), NJ 6.625%, CT 6.35%, 0% elsewhere.
 */
export function getTaxRateForState(state?: string): number {
  if (!state) return DEFAULT_TAX_RATE;
  return TAX_RATES_BY_STATE[normalizeShippingState(state)] ?? DEFAULT_TAX_RATE;
}

export function lookupZip(input: string, now: Date = new Date()): ZipLookupResult | null {
  const zip = normalizeZip(input);
  if (!isValidZip(zip)) return null;

  const countdown = getCutoffCountdown(now);
  const nycArea = findNycArea(Number(zip));

  if (nycArea) {
    if (!countdown.passed) {
      return {
        zip,
        area: nycArea,
        speed: 'same-day',
        headline: `Same-day delivery in ${nycArea}`,
        detail: `Order by ${countdown.cutoffLabel} and we deliver before 11 PM tonight.`,
        cutoffPassed: false,
      };
    }
    return {
      zip,
      area: nycArea,
      speed: 'next-day',
      headline: `You're in ${nycArea} — next-day delivery`,
      detail: `Today's same-day cutoff (${countdown.cutoffLabel}) has passed. Order now for delivery tomorrow.`,
      cutoffPassed: true,
    };
  }

  const nearby = NEXT_DAY_ZIPS[zip];
  if (nearby) {
    return {
      zip,
      area: nearby.area,
      speed: 'next-day',
      headline: `Next-day delivery to ${nearby.area}`,
      detail:
        'Next-day delivery to every ZIP within 50 miles of Queens. Same-day is NYC only (all 5 boroughs).',
      cutoffPassed: countdown.passed,
    };
  }

  return {
    zip,
    area: 'the US',
    speed: 'standard',
    headline: 'Nationwide shipping opens soon',
    detail: 'We are delivering in NYC now. U.S. shipping launches in a few days. Free over $49 when it opens.',
    cutoffPassed: countdown.passed,
  };
}

export function isCoordinateInNyc(lat: number, lng: number): boolean {
  return (
    lat >= NYC_BOUNDS.minLat &&
    lat <= NYC_BOUNDS.maxLat &&
    lng >= NYC_BOUNDS.minLng &&
    lng <= NYC_BOUNDS.maxLng
  );
}

export const OUT_OF_AREA_DELIVERY_MESSAGE =
  'We currently deliver same-day in NYC and next-day to every ZIP within 50 miles of Queens. Nationwide shipping opens in a few days.';

export const LAST_ZIP_STORAGE_KEY = 'petshiwu_last_zip';
export const LAST_ZIP_EVENT = 'petshiwu:zip';

export function saveLastZip(zip: string): void {
  if (!isValidZip(zip)) return;
  try {
    localStorage.setItem(LAST_ZIP_STORAGE_KEY, zip);
  } catch {
    // Ignore private-mode storage failures
  }
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(LAST_ZIP_EVENT, { detail: zip }));
  }
}

export function padTime(value: number): string {
  return String(value).padStart(2, '0');
}

/** Compact remaining-time label for the sticky tonight bar. */
export function formatCountdownShort(countdown: CutoffCountdown): string {
  if (countdown.passed) return 'cutoff passed';
  if (countdown.hours > 0) {
    return `${countdown.hours}h ${padTime(countdown.minutes)}m left`;
  }
  return `${countdown.minutes}m ${padTime(countdown.seconds)}s left`;
}

/** One line for photo-search results: tonight ETA from a saved ZIP. */
export function tonightStatusLine(zip: string | null, now: Date = new Date()): string {
  const countdown = getCutoffCountdown(now);
  if (zip && isValidZip(zip)) {
    const result = lookupZip(zip, now);
    if (result?.speed === 'same-day' && !countdown.passed) {
      return `${result.headline} · ${formatCountdownShort(countdown)}`;
    }
    if (result) return result.headline;
  }
  if (!countdown.passed) {
    return `Enter ZIP to check delivery · ${formatCountdownShort(countdown)}`;
  }
  return 'Enter ZIP to check delivery';
}
