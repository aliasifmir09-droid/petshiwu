import { mapSpeciesToPetType } from './neuralScan';

export interface VisualIdentification {
  productType: string;
  keywords: string[];
  petType: string | null;
  brand: string | null;
  description: string;
}

const PET_TYPES = new Set(['dog', 'cat', 'bird', 'fish', 'reptile', 'small-pet']);

function asString(value: unknown): string {
  if (typeof value === 'string') return value.trim();
  if (value == null) return '';
  return String(value).trim();
}

function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.map((item) => asString(item)).filter(Boolean).slice(0, 8);
}

export function parseVisualIdentification(raw: unknown): VisualIdentification | null {
  if (!raw || typeof raw !== 'object') return null;
  const data = raw as Record<string, unknown>;
  const productType = asString(data.productType).toLowerCase();
  if (!productType || productType === 'unknown') return null;

  const species = asString(data.petType).toLowerCase().replace(/\s+/g, '-');
  const mapped = mapSpeciesToPetType(species) || (PET_TYPES.has(species) ? species : null);
  const brandRaw = asString(data.brand);
  const brand =
    !brandRaw || brandRaw.toLowerCase() === 'null' || brandRaw.toLowerCase() === 'unknown'
      ? null
      : brandRaw.slice(0, 80);

  return {
    productType: productType.slice(0, 80),
    keywords: asStringArray(data.keywords),
    petType: mapped,
    brand,
    description: asString(data.description).slice(0, 240),
  };
}

export function visualSearchTerms(identified: VisualIdentification): string[] {
  const terms = [identified.productType, ...identified.keywords, identified.brand || '']
    .flatMap((term) => term.split(/[\s,/|]+/))
    .map((term) => term.replace(/[^\w+-]/g, '').toLowerCase())
    .filter((term) => term.length > 2);
  return [...new Set(terms)].slice(0, 8);
}

export function mimeFromDataUrl(image: string, fallback = 'image/jpeg'): string {
  const match = image.match(/^data:([^;]+);/i);
  const mime = (match?.[1] || fallback).toLowerCase();
  if (mime.includes('png')) return 'image/png';
  if (mime.includes('webp')) return 'image/webp';
  if (mime.includes('gif')) return 'image/gif';
  if (mime.includes('heic') || mime.includes('heif')) return 'image/heic';
  return 'image/jpeg';
}
