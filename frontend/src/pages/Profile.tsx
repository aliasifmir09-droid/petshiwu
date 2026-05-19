import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/stores/authStore';
import { authService } from '@/services/auth';
import { petService } from '@/services/pets';
import { Pet } from '@/types';
import { User, Mail, Phone, Lock, Save, PawPrint, Plus, Pencil, Trash2, X, ChevronDown, ChevronUp, Sparkles } from 'lucide-react';
import Toast from '@/components/Toast';
import { useToast } from '@/hooks/useToast';

// ─── Species config (full CSS strings — no dynamic Tailwind classes) ──────────
const SPECIES_CONFIG: Record<string, {
  label: string; emoji: string; shortLabel?: string;
  gradient: string; cardGradient: string; ring: string;
  textColor: string; tagClass: string;
}> = {
  dog: {
    label: 'Dog', emoji: '🐕',
    gradient:     'linear-gradient(135deg, #f59e0b 0%, #f97316 100%)',
    cardGradient: 'linear-gradient(135deg, #fef3c7 0%, #fed7aa 100%)',
    ring: '#f97316', textColor: '#92400e',
    tagClass: 'bg-orange-100 text-orange-700 border-orange-200',
  },
  cat: {
    label: 'Cat', emoji: '🐈',
    gradient:     'linear-gradient(135deg, #a78bfa 0%, #7c3aed 100%)',
    cardGradient: 'linear-gradient(135deg, #ede9fe 0%, #ddd6fe 100%)',
    ring: '#7c3aed', textColor: '#4c1d95',
    tagClass: 'bg-violet-100 text-violet-700 border-violet-200',
  },
  bird: {
    label: 'Bird', emoji: '🐦',
    gradient:     'linear-gradient(135deg, #38bdf8 0%, #0284c7 100%)',
    cardGradient: 'linear-gradient(135deg, #e0f2fe 0%, #bae6fd 100%)',
    ring: '#0284c7', textColor: '#075985',
    tagClass: 'bg-sky-100 text-sky-700 border-sky-200',
  },
  fish: {
    label: 'Fish', emoji: '🐠',
    gradient:     'linear-gradient(135deg, #2dd4bf 0%, #0891b2 100%)',
    cardGradient: 'linear-gradient(135deg, #ccfbf1 0%, #cffafe 100%)',
    ring: '#0891b2', textColor: '#164e63',
    tagClass: 'bg-teal-100 text-teal-700 border-teal-200',
  },
  reptile: {
    label: 'Reptile', emoji: '🦎',
    gradient:     'linear-gradient(135deg, #4ade80 0%, #059669 100%)',
    cardGradient: 'linear-gradient(135deg, #dcfce7 0%, #a7f3d0 100%)',
    ring: '#059669', textColor: '#064e3b',
    tagClass: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  },
  'small-animal': {
    label: 'Small Animal', shortLabel: 'Small', emoji: '🐹',
    gradient:     'linear-gradient(135deg, #f472b6 0%, #db2777 100%)',
    cardGradient: 'linear-gradient(135deg, #fce7f3 0%, #fbcfe8 100%)',
    ring: '#db2777', textColor: '#831843',
    tagClass: 'bg-pink-100 text-pink-700 border-pink-200',
  },
  other: {
    label: 'Other', emoji: '🐾',
    gradient:     'linear-gradient(135deg, #94a3b8 0%, #475569 100%)',
    cardGradient: 'linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%)',
    ring: '#475569', textColor: '#1e293b',
    tagClass: 'bg-slate-100 text-slate-600 border-slate-200',
  },
};

const ALLERGENS = [
  { label: 'Chicken', emoji: '🍗' }, { label: 'Beef',  emoji: '🥩' },
  { label: 'Fish',    emoji: '🐟' }, { label: 'Lamb',  emoji: '🐑' },
  { label: 'Grain',   emoji: '🌾' }, { label: 'Wheat', emoji: '🌾' },
  { label: 'Corn',    emoji: '🌽' }, { label: 'Soy',   emoji: '🫘' },
  { label: 'Dairy',   emoji: '🥛' }, { label: 'Eggs',  emoji: '🥚' },
];

const SIZES = [
  { value: 'small',  label: 'Small',   sub: '< 20 lbs' },
  { value: 'medium', label: 'Medium',  sub: '20–55 lbs' },
  { value: 'large',  label: 'Large',   sub: '55–100 lbs' },
  { value: 'xlarge', label: 'X-Large', sub: '100+ lbs' },
];

function getSp(species: string) {
  return SPECIES_CONFIG[species] || SPECIES_CONFIG.other;
}

function petAge(birthday?: string): string | null {
  if (!birthday) return null;
  const born = new Date(birthday);
  const now = new Date();
  const months = (now.getFullYear() - born.getFullYear()) * 12 + (now.getMonth() - born.getMonth());
  if (months < 1) return 'Newborn';
  if (months < 12) return `${months}mo old`;
  const y = Math.floor(months / 12), m = months % 12;
  return m ? `${y}y ${m}mo` : `${y} yr${y !== 1 ? 's' : ''} old`;
}

const EMPTY_FORM = {
  petName: '', species: '', breed: '', birthday: '',
  sex: '', isFixed: false, weight: '', size: '',
  allergies: [] as string[], notes: '',
};

// ─── Paw print SVG decoration ─────────────────────────────────────────────────
function PawDecor({ className = '' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 80 80" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
      <ellipse cx="30" cy="15" rx="9" ry="11" />
      <ellipse cx="50" cy="12" rx="7" ry="9" />
      <ellipse cx="14" cy="34" rx="7" ry="9" />
      <ellipse cx="64" cy="30" rx="6" ry="8" />
      <path d="M40 68 C20 68 10 50 14 36 C18 24 28 22 40 28 C52 22 62 24 66 36 C70 50 60 68 40 68Z" />
    </svg>
  );
}

// ─── Species Picker ───────────────────────────────────────────────────────────
function SpeciesPicker({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div className="grid grid-cols-4 sm:grid-cols-7 gap-3">
      {Object.entries(SPECIES_CONFIG).map(([key, sp]) => {
        const selected = value === key;
        return (
          <button
            key={key}
            type="button"
            onClick={() => onChange(selected ? '' : key)}
            className="relative flex flex-col items-center gap-2 p-3 rounded-2xl transition-all duration-200 focus:outline-none"
            style={{
              background: selected ? sp.gradient : '#f8fafc',
              border: `3px solid ${selected ? sp.ring : '#e2e8f0'}`,
              boxShadow: selected
                ? `0 8px 24px -4px ${sp.ring}55, 0 0 0 3px ${sp.ring}22`
                : '0 1px 4px rgba(0,0,0,0.06)',
              transform: selected ? 'scale(1.06) translateY(-2px)' : 'scale(1)',
            }}
          >
            <span className="text-3xl leading-none">{sp.emoji}</span>
            <span
              className="text-xs font-bold leading-tight text-center"
              style={{ color: selected ? '#fff' : '#64748b' }}
            >
              {sp.shortLabel || sp.label}
            </span>
            {selected && (
              <span className="absolute -top-1.5 -right-1.5 bg-white rounded-full w-5 h-5 flex items-center justify-center text-xs shadow-md"
                style={{ color: sp.ring }}>✓</span>
            )}
          </button>
        );
      })}
    </div>
  );
}

// ─── Pet Form ─────────────────────────────────────────────────────────────────
interface PetFormProps {
  initial?: typeof EMPTY_FORM;
  onSubmit: (data: typeof EMPTY_FORM) => void;
  onCancel: () => void;
  isPending: boolean;
  isEdit?: boolean;
}

function PetForm({ initial = EMPTY_FORM, onSubmit, onCancel, isPending, isEdit }: PetFormProps) {
  const [form, setForm] = useState(initial);
  const [showMore, setShowMore] = useState(
    !!(initial.sex || initial.isFixed || initial.weight || initial.size || initial.notes)
  );

  const set = (k: keyof typeof EMPTY_FORM, v: any) => setForm(f => ({ ...f, [k]: v }));

  const toggleAllergen = (label: string) => {
    const l = label.toLowerCase();
    set('allergies', form.allergies.includes(l) ? form.allergies.filter(x => x !== l) : [...form.allergies, l]);
  };

  const sp = form.species ? getSp(form.species) : null;

  return (
    <form onSubmit={e => { e.preventDefault(); if (!form.petName.trim() || !form.species) return; onSubmit(form); }} className="space-y-6">

      {/* Species */}
      <div>
        <label className="block text-sm font-bold text-gray-800 mb-3">
          What kind of pet? <span className="text-red-500">*</span>
        </label>
        <SpeciesPicker value={form.species} onChange={v => set('species', v)} />
      </div>

      {/* Name + Breed — appear after species chosen */}
      <div className={`grid grid-cols-1 sm:grid-cols-2 gap-4 transition-opacity duration-300 ${form.species ? 'opacity-100' : 'opacity-40 pointer-events-none'}`}>
        <div>
          <label className="block text-sm font-bold text-gray-800 mb-1.5">
            Pet's Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={form.petName}
            onChange={e => set('petName', e.target.value)}
            placeholder="e.g. Luna, Max, Noodle..."
            className="w-full rounded-xl border-2 border-gray-200 px-4 py-2.5 text-sm focus:outline-none focus:border-primary-400 transition-colors"
            style={sp ? { borderColor: form.petName ? sp.ring : undefined } : {}}
          />
        </div>
        <div>
          <label className="block text-sm font-bold text-gray-800 mb-1.5">
            Breed <span className="text-gray-400 font-normal text-xs">(optional)</span>
          </label>
          <input
            type="text"
            value={form.breed}
            onChange={e => set('breed', e.target.value)}
            placeholder={
              form.species === 'dog' ? 'e.g. Golden Retriever' :
              form.species === 'cat' ? 'e.g. Siamese' :
              form.species === 'bird' ? 'e.g. Parakeet' : 'Breed or mix'
            }
            className="w-full rounded-xl border-2 border-gray-200 px-4 py-2.5 text-sm focus:outline-none focus:border-primary-400 transition-colors"
          />
        </div>
      </div>

      {/* Birthday */}
      <div className={`transition-opacity duration-300 ${form.species ? 'opacity-100' : 'opacity-40 pointer-events-none'}`}>
        <label className="block text-sm font-bold text-gray-800 mb-1.5">
          🎂 Birthday <span className="text-gray-400 font-normal text-xs">(optional — we'll send birthday treats!)</span>
        </label>
        <input
          type="date"
          value={form.birthday}
          onChange={e => set('birthday', e.target.value)}
          max={new Date().toISOString().split('T')[0]}
          className="rounded-xl border-2 border-gray-200 px-4 py-2.5 text-sm focus:outline-none focus:border-primary-400 transition-colors w-full sm:w-52"
        />
      </div>

      {/* Allergies */}
      <div className={`transition-opacity duration-300 ${form.species ? 'opacity-100' : 'opacity-40 pointer-events-none'}`}>
        <label className="block text-sm font-bold text-gray-800 mb-1">
          🚫 Allergies / Ingredients to Avoid <span className="text-gray-400 font-normal text-xs">(optional)</span>
        </label>
        <p className="text-xs text-gray-500 mb-2.5">We'll flag any products that contain these ingredients.</p>
        <div className="flex flex-wrap gap-2">
          {ALLERGENS.map(({ label, emoji }) => {
            const active = form.allergies.includes(label.toLowerCase());
            return (
              <button
                key={label}
                type="button"
                onClick={() => toggleAllergen(label)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border-2 transition-all duration-150 ${
                  active
                    ? 'bg-red-500 border-red-500 text-white shadow-md scale-105'
                    : 'bg-white border-gray-200 text-gray-600 hover:border-red-300 hover:text-red-500'
                }`}
              >
                <span>{emoji}</span>{label}
                {active && <span className="ml-0.5 text-white/80">✕</span>}
              </button>
            );
          })}
        </div>
      </div>

      {/* More details toggle */}
      <button
        type="button"
        onClick={() => setShowMore(v => !v)}
        className="flex items-center gap-1.5 text-sm font-semibold text-primary-600 hover:text-primary-700"
      >
        {showMore ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
        {showMore ? 'Less details' : 'More details'} (sex, weight, size, notes)
      </button>

      {showMore && (
        <div className="space-y-5 bg-gray-50 rounded-2xl p-4 border border-gray-100">

          {/* Sex + Neutered */}
          <div className="flex flex-wrap gap-4 items-center">
            <div>
              <label className="block text-xs font-bold text-gray-600 mb-2 uppercase tracking-wide">Sex</label>
              <div className="flex gap-2">
                {[{ v: 'male', l: '♂ Male' }, { v: 'female', l: '♀ Female' }].map(({ v, l }) => (
                  <button key={v} type="button" onClick={() => set('sex', form.sex === v ? '' : v)}
                    className={`px-4 py-1.5 rounded-full text-sm font-semibold border-2 transition-all ${
                      form.sex === v
                        ? 'bg-primary-500 border-primary-500 text-white'
                        : 'bg-white border-gray-200 text-gray-600 hover:border-primary-300'
                    }`}
                  >{l}</button>
                ))}
              </div>
            </div>
            <div className="flex items-center gap-2 sm:mt-5">
              <input type="checkbox" id="isFixed" checked={form.isFixed}
                onChange={e => set('isFixed', e.target.checked)}
                className="w-4 h-4 accent-primary-600" />
              <label htmlFor="isFixed" className="text-sm text-gray-700 font-medium">Spayed / Neutered</label>
            </div>
          </div>

          {/* Weight + Size */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-600 mb-2 uppercase tracking-wide">Weight (lbs)</label>
              <input type="number" value={form.weight} onChange={e => set('weight', e.target.value)}
                min="0" max="300" placeholder="e.g. 45"
                className="w-full rounded-xl border-2 border-gray-200 px-4 py-2.5 text-sm focus:outline-none focus:border-primary-400 bg-white"
              />
            </div>
            {(form.species === 'dog' || form.species === 'cat') && (
              <div>
                <label className="block text-xs font-bold text-gray-600 mb-2 uppercase tracking-wide">Size</label>
                <div className="grid grid-cols-2 gap-1.5">
                  {SIZES.map(sz => (
                    <button key={sz.value} type="button" onClick={() => set('size', form.size === sz.value ? '' : sz.value)}
                      className={`flex flex-col items-start px-3 py-2 rounded-xl border-2 text-xs transition-all bg-white ${
                        form.size === sz.value
                          ? 'border-primary-500 bg-primary-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <span className="font-bold text-gray-800">{sz.label}</span>
                      <span className="text-gray-400">{sz.sub}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-bold text-gray-600 mb-2 uppercase tracking-wide">Notes</label>
            <textarea value={form.notes} onChange={e => set('notes', e.target.value)}
              placeholder="Health conditions, favorite things, anything else..."
              rows={2} maxLength={500}
              className="w-full rounded-xl border-2 border-gray-200 px-4 py-2.5 text-sm focus:outline-none focus:border-primary-400 resize-none bg-white"
            />
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-3">
        <button
          type="submit"
          disabled={isPending || !form.petName.trim() || !form.species}
          className="flex items-center gap-2 text-white px-7 py-2.5 rounded-xl font-bold text-sm disabled:opacity-50 transition-opacity shadow-lg"
          style={{ background: sp ? sp.gradient : 'linear-gradient(135deg,#0ea5e9,#0284c7)' }}
        >
          <Save size={15} />
          {isPending ? 'Saving...' : isEdit ? 'Save Changes' : `Add ${form.petName || 'Pet'}`}
        </button>
        <button type="button" onClick={onCancel}
          className="px-5 py-2.5 border-2 border-gray-200 rounded-xl font-semibold text-sm hover:bg-gray-50">
          Cancel
        </button>
      </div>
    </form>
  );
}

// ─── Pet Portrait Card ────────────────────────────────────────────────────────
interface PetCardProps { pet: Pet; onEdit: () => void; onDelete: () => void; }

function PetCard({ pet, onEdit, onDelete }: PetCardProps) {
  const sp = getSp(pet.species);
  const age = petAge(pet.birthday);
  const spLabel = SPECIES_CONFIG[pet.species]?.label || 'Other';

  return (
    <div
      className="rounded-3xl overflow-hidden transition-transform duration-200 hover:-translate-y-1"
      style={{ boxShadow: `0 8px 32px -4px ${sp.ring}33, 0 2px 8px rgba(0,0,0,0.08)` }}
    >
      {/* Gradient header */}
      <div className="relative h-28 flex items-center justify-center" style={{ background: sp.cardGradient }}>
        {/* Decorative paw prints */}
        <PawDecor className="absolute top-2 left-2 w-10 h-10 opacity-10" style={{ color: sp.ring } as any} />
        <PawDecor className="absolute bottom-1 right-3 w-7 h-7 opacity-10 rotate-45" style={{ color: sp.ring } as any} />

        {/* Floating emoji circle */}
        <div
          className="absolute -bottom-7 w-16 h-16 rounded-full flex items-center justify-center text-3xl shadow-lg border-4 border-white"
          style={{ background: sp.gradient }}
        >
          {sp.emoji}
        </div>

        {/* Action buttons */}
        <div className="absolute top-3 right-3 flex gap-1">
          <button onClick={onEdit}
            className="w-7 h-7 rounded-full bg-white/80 backdrop-blur-sm flex items-center justify-center text-gray-500 hover:text-gray-700 shadow-sm hover:shadow transition-all"
            title="Edit">
            <Pencil size={13} />
          </button>
          <button onClick={onDelete}
            className="w-7 h-7 rounded-full bg-white/80 backdrop-blur-sm flex items-center justify-center text-gray-500 hover:text-red-500 shadow-sm hover:shadow transition-all"
            title="Remove">
            <Trash2 size={13} />
          </button>
        </div>
      </div>

      {/* Card body */}
      <div className="bg-white px-5 pt-10 pb-5">
        <h4 className="text-xl font-extrabold text-gray-900 leading-tight text-center">{pet.petName}</h4>
        <p className="text-sm text-center mt-0.5 mb-4" style={{ color: sp.ring }}>
          {spLabel}{pet.breed ? ` · ${pet.breed}` : ''}
        </p>

        {/* Info chips */}
        <div className="flex flex-wrap justify-center gap-1.5 mb-3">
          {age && (
            <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${sp.tagClass}`}>
              🎂 {age}
            </span>
          )}
          {pet.sex && pet.sex !== 'unknown' && (
            <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${sp.tagClass}`}>
              {pet.sex === 'male' ? '♂' : '♀'} {pet.sex === 'male' ? 'Male' : 'Female'}
            </span>
          )}
          {pet.isFixed && (
            <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${sp.tagClass}`}>
              Neutered
            </span>
          )}
          {pet.weight && (
            <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${sp.tagClass}`}>
              {pet.weight} lbs
            </span>
          )}
          {pet.size && (
            <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${sp.tagClass} capitalize`}>
              {pet.size === 'xlarge' ? 'X-Large' : pet.size}
            </span>
          )}
        </div>

        {/* Allergens */}
        {pet.allergies && pet.allergies.length > 0 && (
          <div className="border-t border-gray-100 pt-3 mt-1">
            <p className="text-xs text-gray-400 text-center mb-1.5 font-semibold uppercase tracking-wide">Avoids</p>
            <div className="flex flex-wrap justify-center gap-1">
              {pet.allergies.map(a => {
                const found = ALLERGENS.find(x => x.label.toLowerCase() === a);
                return (
                  <span key={a} className="flex items-center gap-1 text-xs bg-red-50 text-red-600 border border-red-200 px-2 py-0.5 rounded-full font-semibold capitalize">
                    {found?.emoji} {a}
                  </span>
                );
              })}
            </div>
          </div>
        )}

        {pet.notes && (
          <p className="text-xs text-gray-400 italic text-center mt-3 leading-snug border-t border-gray-100 pt-3">
            {pet.notes}
          </p>
        )}
      </div>
    </div>
  );
}

// ─── Main Profile Page ────────────────────────────────────────────────────────
const Profile = () => {
  const { user, setUser } = useAuthStore();
  const queryClient = useQueryClient();
  const { toast, showToast, hideToast } = useToast();

  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [profileData, setProfileData] = useState({
    firstName: user?.firstName || '',
    lastName:  user?.lastName  || '',
    email:     user?.email     || '',
    phone:     user?.phone     || '',
  });
  const [passwordData, setPasswordData] = useState({
    currentPassword: '', newPassword: '', confirmPassword: '',
  });

  // Pet UI state
  const [showAddForm, setShowAddForm]     = useState(false);
  const [editingPetId, setEditingPetId]   = useState<string | null>(null);
  const [deletingPetId, setDeletingPetId] = useState<string | null>(null);

  // Pet data
  const { data: pets = [] } = useQuery({
    queryKey: ['myPets'],
    queryFn: petService.getMyPets,
    enabled: !!user,
  });

  const addPetMutation = useMutation({
    mutationFn: petService.addPet,
    onSuccess: (p) => { queryClient.invalidateQueries({ queryKey: ['myPets'] }); setShowAddForm(false); showToast(`${p.petName} joined your pet family! 🐾`, 'success'); },
    onError: (e: any) => showToast(e.response?.data?.message || 'Failed to add pet', 'error'),
  });

  const updatePetMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => petService.updatePet(id, data),
    onSuccess: (p) => { queryClient.invalidateQueries({ queryKey: ['myPets'] }); setEditingPetId(null); showToast(`${p.petName} updated!`, 'success'); },
    onError: (e: any) => showToast(e.response?.data?.message || 'Failed to update', 'error'),
  });

  const deletePetMutation = useMutation({
    mutationFn: petService.deletePet,
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['myPets'] }); setDeletingPetId(null); showToast('Removed from your pet family.', 'success'); },
    onError: (e: any) => showToast(e.response?.data?.message || 'Failed to remove', 'error'),
  });

  const updateProfileMutation = useMutation({
    mutationFn: authService.updateProfile,
    onSuccess: (u) => { setUser(u); setIsEditingProfile(false); showToast('Profile updated!', 'success'); },
    onError: (e: any) => showToast(e.response?.data?.message || 'Update failed', 'error'),
  });

  const updatePasswordMutation = useMutation({
    mutationFn: ({ currentPassword, newPassword }: { currentPassword: string; newPassword: string }) =>
      authService.updatePassword(currentPassword, newPassword),
    onSuccess: () => { setIsChangingPassword(false); setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' }); showToast('Password updated!', 'success'); },
    onError: (e: any) => showToast(e.response?.data?.message || 'Update failed', 'error'),
  });

  const petToForm = (pet: Pet) => ({
    petName: pet.petName, species: pet.species, breed: pet.breed || '',
    birthday: pet.birthday || '', sex: pet.sex || '', isFixed: pet.isFixed || false,
    weight: pet.weight ? String(pet.weight) : '', size: pet.size || '',
    allergies: pet.allergies || [], notes: pet.notes || '',
  });

  const formToPetData = (form: typeof EMPTY_FORM) => ({
    petName: form.petName, species: form.species,
    breed: form.breed || undefined, birthday: form.birthday || undefined,
    sex: (form.sex as any) || undefined, isFixed: form.isFixed || undefined,
    weight: form.weight ? Number(form.weight) : undefined,
    size: (form.size as any) || undefined,
    allergies: form.allergies.length ? form.allergies : undefined,
    notes: form.notes || undefined,
  });

  return (
    <div className="container mx-auto px-4 lg:px-8 py-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">My Profile</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* ── Summary Card ──────────────────────────────────────────────── */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-md p-6">
              <div className="flex flex-col items-center text-center">
                <div className="w-24 h-24 rounded-full flex items-center justify-center mb-4"
                  style={{ background: 'linear-gradient(135deg, #e0f2fe, #bae6fd)' }}>
                  <User size={48} className="text-primary-600" />
                </div>
                <h2 className="text-xl font-bold mb-1">{user?.firstName} {user?.lastName}</h2>
                <p className="text-gray-500 text-sm mb-2">{user?.email}</p>
                <span className="inline-block px-3 py-1 bg-primary-100 text-primary-700 rounded-full text-xs font-bold">
                  {user?.role === 'admin' ? 'Administrator' : 'Customer'}
                </span>
              </div>
              <div className="mt-5 pt-5 border-t space-y-2.5">
                <div className="flex items-center gap-2.5 text-sm text-gray-600">
                  <Mail size={15} className="text-gray-400 shrink-0" />{user?.email}
                </div>
                {user?.phone && (
                  <div className="flex items-center gap-2.5 text-sm text-gray-600">
                    <Phone size={15} className="text-gray-400 shrink-0" />{user.phone}
                  </div>
                )}
                {pets.length > 0 && (
                  <div className="flex items-center gap-2.5 text-sm text-gray-600">
                    <PawPrint size={15} className="text-gray-400 shrink-0" />
                    {pets.length} pet{pets.length !== 1 ? 's' : ''} in your family
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ── Right Column ──────────────────────────────────────────────── */}
          <div className="lg:col-span-2 space-y-6">

            {/* Personal Info */}
            <div className="bg-white rounded-2xl shadow-md p-6">
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-lg font-bold">Personal Information</h3>
                {!isEditingProfile && (
                  <button onClick={() => setIsEditingProfile(true)} className="text-primary-600 hover:text-primary-700 text-sm font-semibold">Edit</button>
                )}
              </div>
              {!isEditingProfile ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div><p className="text-xs text-gray-500 font-medium mb-0.5">First Name</p><p className="font-medium text-gray-900">{user?.firstName}</p></div>
                    <div><p className="text-xs text-gray-500 font-medium mb-0.5">Last Name</p><p className="font-medium text-gray-900">{user?.lastName}</p></div>
                  </div>
                  <div><p className="text-xs text-gray-500 font-medium mb-0.5">Email</p><p className="font-medium text-gray-900">{user?.email}</p></div>
                  <div><p className="text-xs text-gray-500 font-medium mb-0.5">Phone</p><p className="font-medium text-gray-900">{user?.phone || '—'}</p></div>
                </div>
              ) : (
                <form onSubmit={e => { e.preventDefault(); updateProfileMutation.mutate(profileData); }} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div><label className="block text-sm font-medium mb-1.5">First Name *</label>
                      <input type="text" required value={profileData.firstName} onChange={e => setProfileData({ ...profileData, firstName: e.target.value })} className="w-full border-2 border-gray-200 rounded-xl px-4 py-2 focus:outline-none focus:border-primary-400 text-sm" /></div>
                    <div><label className="block text-sm font-medium mb-1.5">Last Name *</label>
                      <input type="text" required value={profileData.lastName} onChange={e => setProfileData({ ...profileData, lastName: e.target.value })} className="w-full border-2 border-gray-200 rounded-xl px-4 py-2 focus:outline-none focus:border-primary-400 text-sm" /></div>
                  </div>
                  <div><label className="block text-sm font-medium mb-1.5">Email *</label>
                    <input type="email" required value={profileData.email} onChange={e => setProfileData({ ...profileData, email: e.target.value })} className="w-full border-2 border-gray-200 rounded-xl px-4 py-2 focus:outline-none focus:border-primary-400 text-sm" /></div>
                  <div><label className="block text-sm font-medium mb-1.5">Phone</label>
                    <input type="tel" value={profileData.phone} onChange={e => setProfileData({ ...profileData, phone: e.target.value })} className="w-full border-2 border-gray-200 rounded-xl px-4 py-2 focus:outline-none focus:border-primary-400 text-sm" /></div>
                  <div className="flex gap-3 pt-1">
                    <button type="submit" disabled={updateProfileMutation.isPending} className="flex items-center gap-2 bg-primary-600 text-white px-6 py-2 rounded-xl font-semibold text-sm hover:bg-primary-700 disabled:opacity-50">
                      <Save size={15} />{updateProfileMutation.isPending ? 'Saving...' : 'Save Changes'}</button>
                    <button type="button" onClick={() => { setProfileData({ firstName: user?.firstName||'', lastName: user?.lastName||'', email: user?.email||'', phone: user?.phone||'' }); setIsEditingProfile(false); }} className="px-5 py-2 border-2 border-gray-200 rounded-xl text-sm font-semibold hover:bg-gray-50">Cancel</button>
                  </div>
                </form>
              )}
            </div>

            {/* ── My Pet Family ──────────────────────────────────────────── */}
            <div className="bg-white rounded-2xl shadow-md overflow-hidden">
              {/* Section header */}
              <div className="relative px-6 py-5 overflow-hidden"
                style={{ background: 'linear-gradient(135deg, #fef3c7 0%, #fce7f3 50%, #ede9fe 100%)' }}>
                <PawDecor className="absolute -right-2 -top-2 w-20 h-20 opacity-10 text-amber-700" />
                <PawDecor className="absolute right-16 top-4 w-10 h-10 opacity-[0.07] text-pink-700 rotate-12" />
                <PawDecor className="absolute right-8 bottom-0 w-8 h-8 opacity-[0.07] text-violet-700 -rotate-12" />
                <div className="relative flex items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <PawPrint size={22} className="text-amber-600" />
                      <h3 className="text-xl font-extrabold text-gray-900">My Pet Family</h3>
                      {pets.length > 0 && (
                        <span className="bg-amber-200 text-amber-800 text-xs font-bold px-2 py-0.5 rounded-full">{pets.length}</span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 max-w-xs">
                      Add your pets to unlock personalized recommendations, birthday surprises, and ingredient alerts.
                    </p>
                  </div>
                  {!showAddForm && pets.length > 0 && (
                    <button
                      onClick={() => { setShowAddForm(true); setEditingPetId(null); }}
                      className="shrink-0 flex items-center gap-1.5 text-white text-sm font-bold px-4 py-2 rounded-xl shadow-md transition-opacity hover:opacity-90"
                      style={{ background: 'linear-gradient(135deg, #f59e0b, #f97316)' }}
                    >
                      <Plus size={15} /> Add Pet
                    </button>
                  )}
                </div>
              </div>

              <div className="p-6">
                {/* Add form */}
                {showAddForm && (
                  <div className="mb-6 rounded-2xl border-2 border-primary-100 bg-primary-50/30 p-5">
                    <div className="flex items-center justify-between mb-5">
                      <div className="flex items-center gap-2">
                        <Sparkles size={18} className="text-primary-500" />
                        <h4 className="font-extrabold text-gray-800">Add a New Pet</h4>
                      </div>
                      <button onClick={() => setShowAddForm(false)} className="text-gray-400 hover:text-gray-600 w-7 h-7 flex items-center justify-center rounded-full hover:bg-gray-100"><X size={16} /></button>
                    </div>
                    <PetForm
                      onSubmit={form => addPetMutation.mutate(formToPetData(form) as any)}
                      onCancel={() => setShowAddForm(false)}
                      isPending={addPetMutation.isPending}
                    />
                  </div>
                )}

                {/* Empty state */}
                {pets.length === 0 && !showAddForm ? (
                  <div className="text-center py-12 px-4">
                    <div className="flex justify-center gap-2 text-5xl mb-5">
                      <span className="animate-bounce" style={{ animationDelay: '0ms' }}>🐕</span>
                      <span className="animate-bounce" style={{ animationDelay: '150ms' }}>🐈</span>
                      <span className="animate-bounce" style={{ animationDelay: '300ms' }}>🐦</span>
                    </div>
                    <h4 className="text-xl font-extrabold text-gray-800 mb-2">Introduce your pets!</h4>
                    <p className="text-gray-500 text-sm mb-6 max-w-xs mx-auto">
                      Tell us about your pets and we'll make every visit to Petshiwu feel like it was made just for them.
                    </p>
                    <button
                      onClick={() => setShowAddForm(true)}
                      className="inline-flex items-center gap-2 text-white font-bold px-7 py-3 rounded-xl shadow-lg text-sm transition-opacity hover:opacity-90"
                      style={{ background: 'linear-gradient(135deg, #f59e0b, #f97316)' }}
                    >
                      <PawPrint size={17} /> Meet Your First Pet
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    {pets.map(pet => (
                      <div key={pet._id}>
                        {editingPetId === pet._id ? (
                          <div className="rounded-2xl border-2 border-primary-200 bg-primary-50/30 p-4">
                            <div className="flex items-center justify-between mb-4">
                              <h4 className="font-bold text-gray-800 text-sm">Edit {pet.petName}</h4>
                              <button onClick={() => setEditingPetId(null)} className="text-gray-400 hover:text-gray-600"><X size={16} /></button>
                            </div>
                            <PetForm
                              initial={petToForm(pet)}
                              onSubmit={form => updatePetMutation.mutate({ id: pet._id, data: formToPetData(form) })}
                              onCancel={() => setEditingPetId(null)}
                              isPending={updatePetMutation.isPending}
                              isEdit
                            />
                          </div>
                        ) : deletingPetId === pet._id ? (
                          <div className="rounded-2xl border-2 border-red-200 bg-red-50 p-5 flex flex-col gap-4 items-center text-center">
                            <span className="text-4xl">{getSp(pet.species).emoji}</span>
                            <p className="text-sm font-semibold text-gray-800">Remove <strong>{pet.petName}</strong> from your family?</p>
                            <div className="flex gap-2 w-full">
                              <button onClick={() => deletePetMutation.mutate(pet._id)} disabled={deletePetMutation.isPending}
                                className="flex-1 bg-red-500 text-white py-2 rounded-xl text-sm font-bold hover:bg-red-600 disabled:opacity-50">
                                {deletePetMutation.isPending ? 'Removing...' : 'Yes, Remove'}
                              </button>
                              <button onClick={() => setDeletingPetId(null)}
                                className="flex-1 border-2 border-gray-200 py-2 rounded-xl text-sm font-semibold hover:bg-white">
                                Cancel
                              </button>
                            </div>
                          </div>
                        ) : (
                          <PetCard
                            pet={pet}
                            onEdit={() => { setEditingPetId(pet._id); setShowAddForm(false); }}
                            onDelete={() => setDeletingPetId(pet._id)}
                          />
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Password */}
            <div className="bg-white rounded-2xl shadow-md p-6">
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-lg font-bold">Password &amp; Security</h3>
                {!isChangingPassword && (
                  <button onClick={() => setIsChangingPassword(true)} className="text-primary-600 text-sm font-semibold hover:text-primary-700">Change Password</button>
                )}
              </div>
              {!isChangingPassword ? (
                <div className="flex items-center gap-3 text-gray-500"><Lock size={18} /><span>••••••••</span></div>
              ) : (
                <form onSubmit={e => { e.preventDefault(); if (passwordData.newPassword !== passwordData.confirmPassword) { showToast("Passwords don't match", 'error'); return; } if (passwordData.newPassword.length < 8) { showToast('Min 8 characters', 'error'); return; } updatePasswordMutation.mutate({ currentPassword: passwordData.currentPassword, newPassword: passwordData.newPassword }); }} className="space-y-4">
                  {[['Current Password', 'currentPassword'], ['New Password', 'newPassword'], ['Confirm New Password', 'confirmPassword']].map(([label, key]) => (
                    <div key={key}><label className="block text-sm font-medium mb-1.5">{label} *</label>
                      <input type="password" required value={passwordData[key as keyof typeof passwordData]}
                        onChange={e => setPasswordData({ ...passwordData, [key]: e.target.value })}
                        minLength={key !== 'currentPassword' ? 8 : undefined}
                        className="w-full border-2 border-gray-200 rounded-xl px-4 py-2 focus:outline-none focus:border-primary-400 text-sm" /></div>
                  ))}
                  <p className="text-xs text-gray-500">New password must be at least 8 characters.</p>
                  <div className="flex gap-3">
                    <button type="submit" disabled={updatePasswordMutation.isPending} className="flex items-center gap-2 bg-primary-600 text-white px-6 py-2 rounded-xl font-semibold text-sm hover:bg-primary-700 disabled:opacity-50">
                      <Lock size={15} />{updatePasswordMutation.isPending ? 'Updating...' : 'Update Password'}</button>
                    <button type="button" onClick={() => { setIsChangingPassword(false); setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' }); }} className="px-5 py-2 border-2 border-gray-200 rounded-xl text-sm font-semibold hover:bg-gray-50">Cancel</button>
                  </div>
                </form>
              )}
            </div>

            {/* Account Info */}
            <div className="bg-white rounded-2xl shadow-md p-6">
              <h3 className="text-lg font-bold mb-4">Account Information</h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Account Type</span>
                  <span className="font-semibold">{user?.role === 'admin' ? 'Administrator' : 'Customer'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Member Since</span>
                  <span className="font-semibold">{user?.createdAt ? new Date(user.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : '—'}</span>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>

      {toast.isVisible && <Toast message={toast.message} type={toast.type} onClose={hideToast} />}
    </div>
  );
};

export default Profile;
