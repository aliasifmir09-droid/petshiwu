/** Google Merchant listings MPN must be 1–70 characters. */
export const GOOGLE_MPN_MAX_LENGTH = 70;

/** 8, 12, 13, or 14 digit identifiers Google accepts as GTIN. */
export function looksLikeGtin(sku?: string | null): boolean {
  return /^\d{8}$|^\d{12,14}$/.test(String(sku || '').trim());
}

/**
 * Returns a catalog SKU only when it is a valid Google MPN.
 * Long imported slugs and empty values are omitted instead of truncated.
 */
export function merchantMpn(sku?: string | null): string | undefined {
  const value = String(sku || '').trim();
  if (value.length < 1 || value.length > GOOGLE_MPN_MAX_LENGTH) return undefined;
  return value;
}

/** Product JSON-LD identifiers that pass Google Merchant listings checks. */
export function productSchemaIdentifiers(
  catalogSku: string | undefined | null,
  productId: string
): { sku: string; mpn?: string } {
  const mpn = merchantMpn(catalogSku);
  return mpn ? { sku: mpn, mpn } : { sku: String(productId) };
}
