/**
 * Catalog strings are stored both decoded ("Hill's") and HTML-encoded
 * ("Hill&#039;s"). Shoppers type apostrophes. Match all three.
 */

export function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export function decodeHtmlEntities(text: string): string {
  return String(text || '')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&apos;/gi, "'")
    .replace(/&#0*39;/g, "'")
    .replace(/&#x0*27;/gi, "'")
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)))
    .trim();
}

/** Optional apostrophe or HTML entity between characters. */
export const APOSTROPHE_CLASS = "(?:['\u2019]|&(?:#0*39|#x0*27|apos);)?";

export function catalogFlexPattern(term: string): string {
  const stripped = decodeHtmlEntities(term)
    .replace(/['\u2019]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
  if (!stripped) return '';
  return stripped
    .split('')
    .map((char) => (char === ' ' ? '\\s+' : escapeRegex(char)))
    .join(APOSTROPHE_CLASS);
}

export function brandMatchClauses(brand: string): Record<string, unknown>[] {
  const decoded = decodeHtmlEntities(brand);
  if (!decoded) return [];
  const encodedApos = decoded.replace(/'/g, '&#039;');
  const encodedApos39 = decoded.replace(/'/g, '&#39;');
  const encodedAposNamed = decoded.replace(/'/g, '&apos;');
  const flex = catalogFlexPattern(decoded);
  const clauses: Record<string, unknown>[] = [
    { brand: decoded },
    { brand: encodedApos },
    { brand: encodedApos39 },
    { brand: encodedAposNamed },
    { brand: new RegExp(`^${escapeRegex(decoded)}\\b`, 'i') },
    { brand: new RegExp(`^${escapeRegex(encodedApos)}`, 'i') },
  ];
  if (flex) {
    clauses.push({ brand: new RegExp(`^${flex}`, 'i') });
  }
  return clauses;
}

export function brandMatchQuery(brand: string): Record<string, unknown> {
  const clauses = brandMatchClauses(brand);
  if (clauses.length === 1) return clauses[0];
  return { $or: clauses };
}

export function anyBrandMatchQuery(brands: string[]): Record<string, unknown> {
  return { $or: brands.flatMap((brand) => brandMatchClauses(brand)) };
}

export const FEATURED_FALLBACK_BRANDS = [
  'Purina',
  'Blue Buffalo',
  "Hill's Science Diet",
  'Royal Canin',
  'Wellness',
  'Iams',
  'Pedigree',
  'NUTRO',
  "Nature's Recipe",
];
