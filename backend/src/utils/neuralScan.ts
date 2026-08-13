export type NeuralSpecies =
  | 'dog'
  | 'cat'
  | 'bird'
  | 'fish'
  | 'reptile'
  | 'small-pet'
  | 'unknown';

export type NeuralSubject = 'pet' | 'product' | 'unknown';

export interface NeuralTwin {
  subject: NeuralSubject;
  species: NeuralSpecies;
  petType: string | null;
  breed: string;
  breedConfidence: number;
  lifeStage: string;
  sizeClass: string;
  coat: string;
  estimatedWeightLbs: number | null;
  traits: string[];
  healthWatch: string[];
  careFocus: string[];
  shopQueries: string[];
  summary: string;
  dailyCalories: number | null;
}

const SPECIES_TO_PET_TYPE: Record<string, string> = {
  dog: 'dog',
  cat: 'cat',
  bird: 'bird',
  fish: 'fish',
  reptile: 'reptile',
  'small-pet': 'small-pet',
  'small-animal': 'small-pet',
};

const DEFAULT_QUERIES: Record<string, string[]> = {
  dog: ['dog food', 'dog treats', 'joint supplement', 'dog toys'],
  cat: ['cat food', 'cat litter', 'cat treats', 'cat toys'],
  bird: ['bird food', 'bird cage', 'bird toys'],
  fish: ['fish food', 'aquarium', 'water conditioner'],
  reptile: ['reptile food', 'uvb', 'reptile substrate'],
  'small-pet': ['small pet food', 'hay', 'chew toys'],
};

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

const asStringArray = (value: unknown, fallback: string[] = []): string[] => {
  if (!Array.isArray(value)) return fallback;
  return value.map((item) => String(item).trim()).filter(Boolean).slice(0, 6);
};

export function mapSpeciesToPetType(species: string): string | null {
  return SPECIES_TO_PET_TYPE[species] || null;
}

export function estimateDailyCalories(
  species: NeuralSpecies,
  weightLbs: number | null,
  lifeStage: string
): number | null {
  if (!weightLbs || weightLbs < 1 || weightLbs > 250) return null;
  if (species !== 'dog' && species !== 'cat') return null;
  const kg = weightLbs / 2.2046;
  const rer = 70 * Math.pow(kg, 0.75);
  const stage = lifeStage.toLowerCase();
  let multiplier = species === 'cat' ? 1.2 : 1.6;
  if (stage.includes('puppy') || stage.includes('kitten')) multiplier = species === 'cat' ? 2.5 : 2.0;
  if (stage.includes('senior')) multiplier = species === 'cat' ? 1.1 : 1.4;
  return Math.round(rer * multiplier);
}

export function parseNeuralTwin(raw: unknown): NeuralTwin | null {
  if (!raw || typeof raw !== 'object') return null;
  const data = raw as Record<string, unknown>;
  const subjectRaw = String(data.subject || 'unknown');
  const subject: NeuralSubject =
    subjectRaw === 'pet' || subjectRaw === 'product' ? subjectRaw : 'unknown';
  const speciesRaw = String(data.species || 'unknown').toLowerCase().replace(/\s+/g, '-');
  const species: NeuralSpecies =
    speciesRaw === 'dog' ||
    speciesRaw === 'cat' ||
    speciesRaw === 'bird' ||
    speciesRaw === 'fish' ||
    speciesRaw === 'reptile' ||
    speciesRaw === 'small-pet' ||
    speciesRaw === 'small-animal'
      ? (speciesRaw === 'small-animal' ? 'small-pet' : speciesRaw)
      : 'unknown';

  const weight =
    typeof data.estimatedWeightLbs === 'number'
      ? data.estimatedWeightLbs
      : Number(data.estimatedWeightLbs);
  const estimatedWeightLbs = Number.isFinite(weight) && weight > 0 ? Math.round(weight) : null;
  const lifeStage = String(data.lifeStage || 'unknown');
  const petType = mapSpeciesToPetType(species);
  const shopQueries = asStringArray(data.shopQueries, DEFAULT_QUERIES[species] || ['pet food']);

  return {
    subject,
    species,
    petType,
    breed: String(data.breed || 'Unknown mix').slice(0, 80),
    breedConfidence: clamp(Number(data.breedConfidence) || 0, 0, 100),
    lifeStage,
    sizeClass: String(data.sizeClass || 'unknown'),
    coat: String(data.coat || 'unknown'),
    estimatedWeightLbs,
    traits: asStringArray(data.traits),
    healthWatch: asStringArray(data.healthWatch),
    careFocus: asStringArray(data.careFocus),
    shopQueries: shopQueries.length ? shopQueries : (DEFAULT_QUERIES[species] || ['pet food']),
    summary: String(data.summary || 'Neural scan complete.').slice(0, 240),
    dailyCalories: estimateDailyCalories(species, estimatedWeightLbs, lifeStage),
  };
}

export function extractJsonObject(text: string): unknown | null {
  const match = String(text || '').match(/\{[\s\S]*\}/);
  if (!match) return null;
  try {
    return JSON.parse(match[0]);
  } catch {
    return null;
  }
}
