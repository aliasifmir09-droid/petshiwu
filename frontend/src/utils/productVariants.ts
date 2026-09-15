import { ProductVariant } from '@/types';

export type VariantKind = 'size' | 'flavor' | 'other';

export type VariantDimension = {
  key: string;
  label: string;
  kind: VariantKind;
  values: string[];
};

const SIZE_KEYS = new Set(['size', 'weight', 'count', 'pack', 'volume', 'quantity', 'bag']);
const FLAVOR_KEYS = new Set(['flavor', 'flavour', 'scent', 'color', 'colour', 'recipe', 'protein']);

export const canonicalAttrKey = (raw: string): string => {
  const colon = String(raw).indexOf(':');
  const base = (colon > 0 ? String(raw).slice(0, colon) : String(raw)).trim().toLowerCase();
  if (base === 'lb' || base === 'lbs') return 'weight';
  return base;
};

export const normalizeAttrValue = (value: string): string =>
  String(value ?? '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ');

export const collectVariantAttrs = (variant: ProductVariant): Record<string, string> => {
  const out: Record<string, string> = {};
  if (variant.attributes && typeof variant.attributes === 'object') {
    for (const [key, value] of Object.entries(variant.attributes)) {
      if (value == null || String(value).trim() === '') continue;
      out[canonicalAttrKey(key)] = String(value);
    }
  }
  if (variant.size && String(variant.size).trim()) {
    out.size = String(variant.size);
  }
  if (variant.weight != null && String(variant.weight).trim()) {
    out.weight = String(variant.weight);
  }
  return out;
};

export const parseWeightLbs = (str: string): number | null => {
  const text = String(str ?? '');
  const lb = text.match(/(\d+(?:\.\d+)?)\s*-?\s*(?:lb|lbs)\b/i);
  if (lb) return parseFloat(lb[1]);
  const oz = text.match(/(\d+(?:\.\d+)?)\s*(?:oz)\b/i);
  if (oz) return parseFloat(oz[1]) / 16;
  const kg = text.match(/(\d+(?:\.\d+)?)\s*(?:kg)\b/i);
  if (kg) return parseFloat(kg[1]) * 2.20462;
  return null;
};

const compareSizeAware = (a: string, b: string): number => {
  const numA = parseFloat(String(a).replace(/[^0-9.]/g, ''));
  const numB = parseFloat(String(b).replace(/[^0-9.]/g, ''));
  if (!Number.isNaN(numA) && !Number.isNaN(numB) && numA !== numB) return numA - numB;
  return String(a).localeCompare(String(b), undefined, { numeric: true, sensitivity: 'base' });
};

export const uniqueAttrValues = (variants: ProductVariant[], key: string): string[] => {
  const seen = new Map<string, string>();
  for (const variant of variants) {
    const value = collectVariantAttrs(variant)[key];
    if (!value) continue;
    const normalized = normalizeAttrValue(value);
    if (!seen.has(normalized)) seen.set(normalized, value);
  }
  return Array.from(seen.values()).sort(compareSizeAware);
};

const valueSetsEqual = (left: string[], right: string[]): boolean => {
  if (left.length !== right.length) return false;
  const rightSet = new Set(right.map(normalizeAttrValue));
  return left.every((value) => rightSet.has(normalizeAttrValue(value)));
};

const kindForKey = (key: string): VariantKind => {
  if (SIZE_KEYS.has(key)) return 'size';
  if (FLAVOR_KEYS.has(key)) return 'flavor';
  return 'other';
};

const labelForKey = (key: string, values: string[], keys: Set<string>): string => {
  if (key === 'size') return 'Size';
  if (key === 'weight') {
    if (keys.has('size')) return 'Weight';
    const bagSizes = values.length > 0 && values.every((value) => parseWeightLbs(value) != null);
    return bagSizes ? 'Size' : 'Weight';
  }
  return key.charAt(0).toUpperCase() + key.slice(1);
};

export const getVariantDimensions = (variants: ProductVariant[]): VariantDimension[] => {
  const keys = new Set<string>();
  for (const variant of variants) {
    Object.keys(collectVariantAttrs(variant)).forEach((key) => keys.add(key));
  }

  if (keys.has('size') && keys.has('weight')) {
    const sizes = uniqueAttrValues(variants, 'size');
    const weights = uniqueAttrValues(variants, 'weight');
    const pairsMatch = variants.every((variant) => {
      const attrs = collectVariantAttrs(variant);
      if (!attrs.size || !attrs.weight) return true;
      return normalizeAttrValue(attrs.size) === normalizeAttrValue(attrs.weight);
    });
    if (pairsMatch || valueSetsEqual(sizes, weights)) {
      keys.delete('weight');
    }
  }

  return Array.from(keys)
    .map((key) => {
      const values = uniqueAttrValues(variants, key);
      return {
        key,
        label: labelForKey(key, values, keys),
        kind: kindForKey(key),
        values,
      };
    })
    .filter((dimension) => dimension.values.length > 0)
    .sort((a, b) => {
      const rank = { size: 0, flavor: 1, other: 2 };
      return rank[a.kind] - rank[b.kind] || a.label.localeCompare(b.label);
    });
};

export const findVariantIndex = (
  variants: ProductVariant[],
  selected: Record<string, string>
): number => {
  const keys = Object.keys(selected).filter((key) => selected[key]);
  let bestIndex = 0;
  let bestScore = -1;
  variants.forEach((variant, index) => {
    const attrs = collectVariantAttrs(variant);
    let score = 0;
    for (const key of keys) {
      if (attrs[key] && normalizeAttrValue(attrs[key]) === normalizeAttrValue(selected[key])) {
        score += 1;
      }
    }
    if (score > bestScore) {
      bestScore = score;
      bestIndex = index;
    }
  });
  return bestIndex;
};

export const formatOptionLabel = (value: string, kind: VariantKind): string => {
  const text = String(value ?? '').trim();
  if (kind !== 'size') return text;
  const lbs = parseWeightLbs(text);
  if (lbs == null) return text;
  const rounded = Number.isInteger(lbs) ? String(lbs) : String(Number(lbs.toFixed(2)));
  return `${rounded} lb`;
};

export const pricePerLb = (price: number | null | undefined, value: string): number | null => {
  if (price == null || !(price > 0)) return null;
  const lbs = parseWeightLbs(value);
  if (lbs == null || lbs <= 0) return null;
  return price / lbs;
};

export const bestValueOption = (
  variants: ProductVariant[],
  dimension: VariantDimension,
  selected: Record<string, string>
): string | null => {
  if (dimension.kind !== 'size') return null;
  let best: { value: string; unit: number } | null = null;
  for (const value of dimension.values) {
    const index = findVariantIndex(variants, { ...selected, [dimension.key]: value });
    const variant = variants[index];
    if (!variant || variant.stock <= 0) continue;
    const unit = pricePerLb(variant.price, value);
    if (unit == null) continue;
    if (!best || unit < best.unit) best = { value, unit };
  }
  return best?.value ?? null;
};
