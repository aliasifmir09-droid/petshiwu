import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  loadPassport,
  savePassport,
  skipPassport,
} from '@/utils/petPassport';

const PETS = [
  { species: 'dog', emoji: '🐕', label: 'Dog' },
  { species: 'cat', emoji: '🐱', label: 'Cat' },
  { species: 'bird', emoji: '🐦', label: 'Bird' },
  { species: 'fish', emoji: '🐟', label: 'Fish' },
  { species: 'reptile', emoji: '🦎', label: 'Reptile' },
  { species: 'small-pet', emoji: '🐹', label: 'Small pet' },
];

const PetOnboarding = () => {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [species, setSpecies] = useState('');
  const [name, setName] = useState('');

  useEffect(() => {
    if (!loadPassport()) setOpen(true);
  }, []);

  if (!open) return null;

  const finish = () => {
    const trimmed = name.trim();
    if (!species || !trimmed) return;
    savePassport({
      name: trimmed.slice(0, 24),
      species,
      createdAt: new Date().toISOString(),
    });
    setOpen(false);
    navigate(`/products?petType=${encodeURIComponent(species)}`);
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-end sm:items-center justify-center bg-black/60 p-0 sm:p-4">
      <div className="w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl bg-white p-6 shadow-2xl">
        <p className="text-[11px] font-black uppercase tracking-[0.2em] text-blue-700">Day-one Pet OS</p>
        <h2 className="mt-1 text-2xl font-black text-gray-900">Who are we shopping for?</h2>
        <p className="mt-1 text-sm text-gray-500">
          10 seconds now. After launch, most people skip this — and the store stays generic forever.
        </p>

        <div className="mt-5 grid grid-cols-3 gap-2">
          {PETS.map((pet) => (
            <button
              key={pet.species}
              type="button"
              onClick={() => setSpecies(pet.species)}
              className={`rounded-2xl border px-2 py-3 text-center ${
                species === pet.species
                  ? 'border-blue-600 bg-blue-50'
                  : 'border-gray-200 hover:border-blue-200'
              }`}
            >
              <div className="text-2xl">{pet.emoji}</div>
              <div className="mt-1 text-xs font-bold text-gray-800">{pet.label}</div>
            </button>
          ))}
        </div>

        <label className="mt-4 block text-xs font-bold uppercase tracking-wide text-gray-500">
          Pet name
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Bella, Mochi, Noodle…"
            maxLength={24}
            className="mt-1 w-full rounded-xl border border-gray-300 px-4 py-3 text-base font-semibold text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
          />
        </label>

        <button
          type="button"
          onClick={finish}
          disabled={!species || !name.trim()}
          className="mt-4 w-full rounded-full bg-blue-700 py-3 text-sm font-black text-white disabled:opacity-40"
        >
          {name.trim() ? `Shop for ${name.trim()}` : 'Pick a pet to continue'}
        </button>
        <button
          type="button"
          onClick={() => {
            skipPassport();
            setOpen(false);
          }}
          className="mt-2 w-full py-2 text-sm font-semibold text-gray-500"
        >
          Skip for now
        </button>
      </div>
    </div>
  );
};

export default PetOnboarding;
