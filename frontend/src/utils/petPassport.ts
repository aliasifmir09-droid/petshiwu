export const PASSPORT_KEY = 'petshiwu_passport';

export interface PetPassport {
  name: string;
  species: string;
  breed?: string;
  skipped?: boolean;
  createdAt: string;
}

const SPECIES = ['dog', 'cat', 'bird', 'fish', 'reptile', 'small-pet'] as const;

export function isKnownSpecies(value: string): boolean {
  return (SPECIES as readonly string[]).includes(value);
}

export function loadPassport(): PetPassport | null {
  try {
    const raw = localStorage.getItem(PASSPORT_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as PetPassport;
    if (!parsed || typeof parsed !== 'object') return null;
    return parsed;
  } catch {
    return null;
  }
}

export function savePassport(passport: PetPassport): void {
  localStorage.setItem(PASSPORT_KEY, JSON.stringify(passport));
}

export function skipPassport(): void {
  savePassport({
    name: '',
    species: '',
    skipped: true,
    createdAt: new Date().toISOString(),
  });
}

export function hasActivePassport(passport: PetPassport | null): boolean {
  return Boolean(passport && !passport.skipped && passport.name && passport.species);
}

export function shopPathForPassport(passport: PetPassport | null): string {
  if (!hasActivePassport(passport) || !passport) return '/products';
  return `/products?petType=${encodeURIComponent(passport.species)}`;
}
