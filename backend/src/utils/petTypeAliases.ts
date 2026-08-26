/**
 * Pet type slugs used on URLs vs Mongo.
 * Storefront canonical path is /small-animal. Catalog records use small-pet
 * (and a few still have "small pet" with a space). Product queries must match all of them.
 */
export function petTypeQueryValues(petType: string): string[] {
  const normalized = String(petType || '')
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-');
  if (!normalized) return [];

  const values = new Set<string>([normalized, normalized.replace(/-/g, ' ')]);
  if (normalized === 'small-pet' || normalized === 'small-animal') {
    values.add('small-pet');
    values.add('small pet');
    values.add('small-animal');
    values.add('small animal');
  }
  return [...values];
}
