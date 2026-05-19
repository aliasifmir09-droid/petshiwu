import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/stores/authStore';
import { authService } from '@/services/auth';
import { petService } from '@/services/pets';
import { Pet } from '@/types';
import { User, Mail, Phone, Lock, Save, PawPrint, Plus, Pencil, Trash2, X, ChevronDown, ChevronUp } from 'lucide-react';
import Toast from '@/components/Toast';
import { useToast } from '@/hooks/useToast';

// ─── Species config — sweet pastel palette ────────────────────────────────────
const SPECIES_CONFIG: Record<string, {
  label: string; shortLabel?: string; emoji: string;
  accent: string;
  headerGrad: string;
  border: string;
  cardShadow: string;
  orbGrad: string;
  orbShadow: string;
  chipBg: string; chipColor: string; chipBorder: string;
  tileSel: string; tileSelBorder: string;
}> = {
  dog: {
    label: 'Dog', emoji: '🐕', accent: '#b45309',
    headerGrad:   'linear-gradient(135deg, #fffbeb 0%, #fef3c7 60%, #fed7aa 100%)',
    border:       '#fde68a',
    cardShadow:   '0 8px 32px rgba(245,158,11,.18), 0 2px 8px rgba(0,0,0,.05)',
    orbGrad:      'linear-gradient(135deg, #fef9c3, #fde68a)',
    orbShadow:    '0 4px 20px rgba(245,158,11,.35)',
    chipBg: '#fffbeb', chipColor: '#b45309', chipBorder: '#fde68a',
    tileSel: 'linear-gradient(135deg, #fef3c7, #fed7aa)', tileSelBorder: '#f59e0b',
  },
  cat: {
    label: 'Cat', emoji: '🐈', accent: '#6d28d9',
    headerGrad:   'linear-gradient(135deg, #faf5ff 0%, #f5f3ff 60%, #ede9fe 100%)',
    border:       '#ddd6fe',
    cardShadow:   '0 8px 32px rgba(139,92,246,.18), 0 2px 8px rgba(0,0,0,.05)',
    orbGrad:      'linear-gradient(135deg, #f5f3ff, #ddd6fe)',
    orbShadow:    '0 4px 20px rgba(139,92,246,.35)',
    chipBg: '#faf5ff', chipColor: '#6d28d9', chipBorder: '#ddd6fe',
    tileSel: 'linear-gradient(135deg, #f5f3ff, #ede9fe)', tileSelBorder: '#8b5cf6',
  },
  bird: {
    label: 'Bird', emoji: '🐦', accent: '#0369a1',
    headerGrad:   'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 60%, #bae6fd 100%)',
    border:       '#bae6fd',
    cardShadow:   '0 8px 32px rgba(56,189,248,.18), 0 2px 8px rgba(0,0,0,.05)',
    orbGrad:      'linear-gradient(135deg, #f0f9ff, #bae6fd)',
    orbShadow:    '0 4px 20px rgba(56,189,248,.35)',
    chipBg: '#f0f9ff', chipColor: '#0369a1', chipBorder: '#bae6fd',
    tileSel: 'linear-gradient(135deg, #e0f2fe, #bae6fd)', tileSelBorder: '#38bdf8',
  },
  fish: {
    label: 'Fish', emoji: '🐠', accent: '#0f766e',
    headerGrad:   'linear-gradient(135deg, #f0fdfa 0%, #ccfbf1 60%, #99f6e4 100%)',
    border:       '#99f6e4',
    cardShadow:   '0 8px 32px rgba(45,212,191,.18), 0 2px 8px rgba(0,0,0,.05)',
    orbGrad:      'linear-gradient(135deg, #f0fdfa, #99f6e4)',
    orbShadow:    '0 4px 20px rgba(45,212,191,.35)',
    chipBg: '#f0fdfa', chipColor: '#0f766e', chipBorder: '#99f6e4',
    tileSel: 'linear-gradient(135deg, #ccfbf1, #99f6e4)', tileSelBorder: '#2dd4bf',
  },
  reptile: {
    label: 'Reptile', emoji: '🦎', accent: '#15803d',
    headerGrad:   'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 60%, #bbf7d0 100%)',
    border:       '#bbf7d0',
    cardShadow:   '0 8px 32px rgba(74,222,128,.18), 0 2px 8px rgba(0,0,0,.05)',
    orbGrad:      'linear-gradient(135deg, #f0fdf4, #bbf7d0)',
    orbShadow:    '0 4px 20px rgba(74,222,128,.35)',
    chipBg: '#f0fdf4', chipColor: '#15803d', chipBorder: '#bbf7d0',
    tileSel: 'linear-gradient(135deg, #dcfce7, #bbf7d0)', tileSelBorder: '#4ade80',
  },
  'small-animal': {
    label: 'Small Animal', shortLabel: 'Small', emoji: '🐹', accent: '#be185d',
    headerGrad:   'linear-gradient(135deg, #fff1f5 0%, #fce7f3 60%, #fbcfe8 100%)',
    border:       '#fbcfe8',
    cardShadow:   '0 8px 32px rgba(244,114,182,.18), 0 2px 8px rgba(0,0,0,.05)',
    orbGrad:      'linear-gradient(135deg, #fff1f5, #fbcfe8)',
    orbShadow:    '0 4px 20px rgba(244,114,182,.35)',
    chipBg: '#fff1f5', chipColor: '#be185d', chipBorder: '#fbcfe8',
    tileSel: 'linear-gradient(135deg, #fce7f3, #fbcfe8)', tileSelBorder: '#f472b6',
  },
  other: {
    label: 'Other', emoji: '🐾', accent: '#475569',
    headerGrad:   'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 60%, #e2e8f0 100%)',
    border:       '#e2e8f0',
    cardShadow:   '0 8px 32px rgba(148,163,184,.15), 0 2px 8px rgba(0,0,0,.04)',
    orbGrad:      'linear-gradient(135deg, #f8fafc, #e2e8f0)',
    orbShadow:    '0 4px 12px rgba(148,163,184,.25)',
    chipBg: '#f8fafc', chipColor: '#475569', chipBorder: '#e2e8f0',
    tileSel: 'linear-gradient(135deg, #f1f5f9, #e2e8f0)', tileSelBorder: '#94a3b8',
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

function getSp(s: string) { return SPECIES_CONFIG[s] || SPECIES_CONFIG.other; }

function petAge(birthday?: string): string | null {
  if (!birthday) return null;
  const born = new Date(birthday), now = new Date();
  const m = (now.getFullYear() - born.getFullYear()) * 12 + (now.getMonth() - born.getMonth());
  if (m < 1) return 'Newborn';
  if (m < 12) return `${m}mo`;
  const y = Math.floor(m / 12), r = m % 12;
  return r ? `${y}y ${r}mo` : `${y}yr`;
}

const EMPTY_FORM = {
  petName: '', species: '', breed: '', birthday: '',
  sex: '', isFixed: false, weight: '', size: '',
  allergies: [] as string[], notes: '',
};

// ─── Species Picker ───────────────────────────────────────────────────────────
function SpeciesPicker({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
      {Object.entries(SPECIES_CONFIG).map(([key, sp]) => {
        const sel = value === key;
        return (
          <button key={key} type="button" onClick={() => onChange(sel ? '' : key)}
            className="relative flex flex-col items-center gap-1.5 py-3 px-1 rounded-2xl transition-all duration-200 focus:outline-none"
            style={{
              background:  sel ? sp.tileSel : '#fafafa',
              border:     `2px solid ${sel ? sp.tileSelBorder : '#e8e8e8'}`,
              boxShadow:   sel ? `0 4px 16px ${sp.tileSelBorder}33, 0 1px 4px rgba(0,0,0,.06)` : 'none',
              transform:   sel ? 'scale(1.06) translateY(-2px)' : 'scale(1)',
            }}
          >
            <span className="text-2xl leading-none">{sp.emoji}</span>
            <span className="text-[10px] font-bold leading-tight text-center"
              style={{ color: sel ? sp.accent : '#9ca3af' }}>
              {sp.shortLabel || sp.label}
            </span>
            {sel && (
              <span className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full flex items-center justify-center text-[8px] font-black text-white"
                style={{ background: sp.accent }}>✓</span>
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
  onSubmit: (d: typeof EMPTY_FORM) => void;
  onCancel: () => void;
  isPending: boolean;
  isEdit?: boolean;
}

function PetForm({ initial = EMPTY_FORM, onSubmit, onCancel, isPending, isEdit }: PetFormProps) {
  const [form, setForm] = useState(initial);
  const [showMore, setShowMore] = useState(!!(initial.sex || initial.isFixed || initial.weight || initial.size || initial.notes));
  const set = (k: keyof typeof EMPTY_FORM, v: any) => setForm(f => ({ ...f, [k]: v }));
  const sp = form.species ? getSp(form.species) : null;

  const inputCls = "w-full rounded-xl px-4 py-2.5 text-sm text-gray-700 bg-white border-2 border-gray-200 focus:outline-none focus:border-amber-300 transition-colors placeholder-gray-300";

  return (
    <form onSubmit={e => { e.preventDefault(); if (!form.petName.trim() || !form.species) return; onSubmit(form); }} className="space-y-5">

      <div>
        <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-3">
          Species <span className="text-rose-400">*</span>
        </label>
        <SpeciesPicker value={form.species} onChange={v => set('species', v)} />
      </div>

      <div className={`grid grid-cols-1 sm:grid-cols-2 gap-4 transition-opacity ${form.species ? 'opacity-100' : 'opacity-40 pointer-events-none'}`}>
        <div>
          <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-1.5">
            Name <span className="text-rose-400">*</span>
          </label>
          <input type="text" value={form.petName} onChange={e => set('petName', e.target.value)}
            placeholder="Luna, Max, Noodle..." className={inputCls} />
        </div>
        <div>
          <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-1.5">
            Breed <span className="text-gray-300 normal-case tracking-normal font-normal">(optional)</span>
          </label>
          <input type="text" value={form.breed} onChange={e => set('breed', e.target.value)}
            placeholder={form.species === 'dog' ? 'Golden Retriever...' : form.species === 'cat' ? 'Siamese...' : 'Any breed'}
            className={inputCls} />
        </div>
      </div>

      <div className={`transition-opacity ${form.species ? 'opacity-100' : 'opacity-40 pointer-events-none'}`}>
        <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-1.5">
          🎂 Birthday <span className="text-gray-300 normal-case tracking-normal font-normal">(optional — we'll send treats!)</span>
        </label>
        <input type="date" value={form.birthday} onChange={e => set('birthday', e.target.value)}
          max={new Date().toISOString().split('T')[0]}
          className={`${inputCls} w-full sm:w-52`} />
      </div>

      <div className={`transition-opacity ${form.species ? 'opacity-100' : 'opacity-40 pointer-events-none'}`}>
        <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-1">🚫 Ingredients to Avoid</label>
        <p className="text-xs text-gray-400 mb-2.5">We'll flag any products containing these.</p>
        <div className="flex flex-wrap gap-2">
          {ALLERGENS.map(({ label, emoji }) => {
            const active = form.allergies.includes(label.toLowerCase());
            return (
              <button key={label} type="button"
                onClick={() => set('allergies', active
                  ? form.allergies.filter(x => x !== label.toLowerCase())
                  : [...form.allergies, label.toLowerCase()])}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border-2 transition-all duration-150"
                style={active
                  ? { background: '#fff1f2', borderColor: '#fca5a5', color: '#be123c' }
                  : { background: 'white', borderColor: '#e2e8f0', color: '#9ca3af' }}
              >
                {emoji} {label}{active && <span className="opacity-60 ml-0.5">✕</span>}
              </button>
            );
          })}
        </div>
      </div>

      <button type="button" onClick={() => setShowMore(v => !v)}
        className="flex items-center gap-1.5 text-xs font-black text-gray-400 hover:text-gray-600 uppercase tracking-widest transition-colors">
        {showMore ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
        {showMore ? 'Less' : 'More'} details
      </button>

      {showMore && (
        <div className="space-y-4 rounded-2xl p-4"
          style={{ background: sp?.chipBg || '#fffbf5', border: `1.5px solid ${sp?.chipBorder || '#fde68a'}88` }}>
          <div className="flex flex-wrap gap-4 items-center">
            <div>
              <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Sex</label>
              <div className="flex gap-2">
                {[{ v: 'male', l: '♂ Male' }, { v: 'female', l: '♀ Female' }].map(({ v, l }) => (
                  <button key={v} type="button" onClick={() => set('sex', form.sex === v ? '' : v)}
                    className="px-4 py-1.5 rounded-full text-xs font-bold border-2 transition-all"
                    style={form.sex === v
                      ? { background: sp?.chipBg || '#fffbeb', borderColor: sp?.tileSelBorder || '#f59e0b', color: sp?.accent || '#b45309' }
                      : { background: 'white', borderColor: '#e2e8f0', color: '#9ca3af' }}
                  >{l}</button>
                ))}
              </div>
            </div>
            <div className="flex items-center gap-2 sm:mt-5">
              <input type="checkbox" id="isFixed" checked={form.isFixed} onChange={e => set('isFixed', e.target.checked)} className="w-4 h-4 accent-amber-400" />
              <label htmlFor="isFixed" className="text-xs text-gray-500 font-bold">Spayed / Neutered</label>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-1.5">Weight (lbs)</label>
              <input type="number" value={form.weight} onChange={e => set('weight', e.target.value)} min="0" max="300" placeholder="e.g. 45" className={inputCls} />
            </div>
            {(form.species === 'dog' || form.species === 'cat') && (
              <div>
                <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-1.5">Size</label>
                <div className="grid grid-cols-2 gap-1.5">
                  {SIZES.map(sz => (
                    <button key={sz.value} type="button" onClick={() => set('size', form.size === sz.value ? '' : sz.value)}
                      className="flex flex-col items-start px-3 py-2 rounded-xl border-2 text-xs transition-all"
                      style={form.size === sz.value
                        ? { background: sp?.chipBg || '#fffbeb', borderColor: sp?.tileSelBorder || '#f59e0b', color: sp?.accent || '#b45309' }
                        : { background: 'white', borderColor: '#e2e8f0', color: '#9ca3af' }}
                    >
                      <span className="font-black">{sz.label}</span>
                      <span className="text-gray-300">{sz.sub}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
          <div>
            <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-1.5">Notes</label>
            <textarea value={form.notes} onChange={e => set('notes', e.target.value)}
              placeholder="Health conditions, favourite things..." rows={2} maxLength={500}
              className={`${inputCls} resize-none`} />
          </div>
        </div>
      )}

      <div className="flex gap-3 pt-1">
        <button type="submit" disabled={isPending || !form.petName.trim() || !form.species}
          className="flex items-center gap-2 px-7 py-2.5 rounded-xl font-black text-sm disabled:opacity-40 transition-all hover:scale-105 active:scale-95"
          style={{
            background:  sp ? sp.tileSel : 'linear-gradient(135deg,#fef3c7,#fed7aa)',
            color:       sp ? sp.accent  : '#b45309',
            border:     `2px solid ${sp ? sp.tileSelBorder : '#f59e0b'}88`,
            boxShadow:  `0 4px 16px ${sp ? sp.tileSelBorder : '#f59e0b'}33`,
          }}
        >
          🐾 {isPending ? 'Saving...' : isEdit ? 'Save Changes' : `Add ${form.petName || 'Pet'}`}
        </button>
        <button type="button" onClick={onCancel}
          className="px-5 py-2.5 rounded-xl font-bold text-sm text-gray-400 hover:text-gray-600 bg-white border-2 border-gray-200 hover:border-gray-300 transition-all">
          Cancel
        </button>
      </div>
    </form>
  );
}

// ─── Sweet Pet Card ───────────────────────────────────────────────────────────
interface PetCardProps { pet: Pet; onEdit: () => void; onDelete: () => void; }

function PetCard({ pet, onEdit, onDelete }: PetCardProps) {
  const sp = getSp(pet.species);
  const age = petAge(pet.birthday);
  const spLabel = SPECIES_CONFIG[pet.species]?.label || 'Other';

  return (
    <div className="rounded-3xl overflow-hidden transition-all duration-300 hover:-translate-y-1.5 cursor-default"
      style={{ background: 'white', border: `2px solid ${sp.border}`, boxShadow: sp.cardShadow }}>

      {/* Pastel header */}
      <div className="relative h-28 overflow-hidden" style={{ background: sp.headerGrad }}>
        {/* Soft decorations */}
        <span className="absolute text-3xl opacity-[0.12]" style={{ top: 4, right: 8 }}>✨</span>
        <span className="absolute text-xl opacity-[0.1]"  style={{ top: 16, left: 12 }}>🐾</span>
        <span className="absolute text-base opacity-[0.08]" style={{ bottom: 10, right: 40 }}>💕</span>

        {/* Emoji orb — overlaps header/body boundary */}
        <div className="absolute left-1/2 -translate-x-1/2" style={{ bottom: -26 }}>
          <div className="w-14 h-14 rounded-full flex items-center justify-center text-3xl border-4 border-white"
            style={{ background: sp.orbGrad, boxShadow: sp.orbShadow }}>
            {sp.emoji}
          </div>
        </div>

        {/* Action buttons */}
        <div className="absolute top-2.5 right-2.5 flex gap-1">
          {[{ fn: onEdit, icon: <Pencil size={11} />, label: 'Edit' }, { fn: onDelete, icon: <Trash2 size={11} />, label: 'Remove' }]
            .map(({ fn, icon, label }) => (
              <button key={label} onClick={fn} title={label}
                className="w-7 h-7 rounded-full flex items-center justify-center transition-all hover:scale-110"
                style={{ background: 'rgba(255,255,255,.75)', border: '1.5px solid rgba(255,255,255,.9)', color: sp.accent, backdropFilter: 'blur(4px)' }}>
                {icon}
              </button>
            ))}
        </div>
      </div>

      {/* Card body */}
      <div className="px-5 pt-9 pb-5 text-center">
        <h4 className="text-lg font-black text-gray-800 leading-tight">{pet.petName}</h4>
        <p className="text-xs font-bold mt-0.5 mb-3" style={{ color: sp.accent }}>
          {spLabel}{pet.breed ? ` · ${pet.breed}` : ''}
        </p>

        {/* Stat chips */}
        <div className="flex flex-wrap justify-center gap-1.5 mb-3">
          {age && (
            <span className="text-[11px] font-bold px-2.5 py-1 rounded-full border"
              style={{ background: sp.chipBg, color: sp.chipColor, borderColor: sp.chipBorder }}>🎂 {age}</span>
          )}
          {pet.sex && pet.sex !== 'unknown' && (
            <span className="text-[11px] font-bold px-2.5 py-1 rounded-full border"
              style={{ background: sp.chipBg, color: sp.chipColor, borderColor: sp.chipBorder }}>
              {pet.sex === 'male' ? '♂ Male' : '♀ Female'}
            </span>
          )}
          {pet.isFixed && (
            <span className="text-[11px] font-bold px-2.5 py-1 rounded-full border"
              style={{ background: sp.chipBg, color: sp.chipColor, borderColor: sp.chipBorder }}>Fixed</span>
          )}
          {pet.weight && (
            <span className="text-[11px] font-bold px-2.5 py-1 rounded-full border"
              style={{ background: sp.chipBg, color: sp.chipColor, borderColor: sp.chipBorder }}>{pet.weight} lbs</span>
          )}
          {pet.size && (
            <span className="text-[11px] font-bold px-2.5 py-1 rounded-full border capitalize"
              style={{ background: sp.chipBg, color: sp.chipColor, borderColor: sp.chipBorder }}>
              {pet.size === 'xlarge' ? 'X-Large' : pet.size}
            </span>
          )}
        </div>

        {/* Allergens */}
        {pet.allergies && pet.allergies.length > 0 && (
          <div className="border-t pt-3 mt-1" style={{ borderColor: sp.border }}>
            <p className="text-[9px] font-black uppercase tracking-widest text-gray-300 mb-2">No-go ingredients</p>
            <div className="flex flex-wrap justify-center gap-1">
              {pet.allergies.map(a => {
                const found = ALLERGENS.find(x => x.label.toLowerCase() === a);
                return (
                  <span key={a} className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full capitalize"
                    style={{ background: '#fff1f2', color: '#be123c', border: '1.5px solid #fecdd3' }}>
                    {found?.emoji} {a}
                  </span>
                );
              })}
            </div>
          </div>
        )}

        {pet.notes && (
          <p className="text-[11px] italic text-gray-400 text-center mt-3 pt-3 border-t leading-snug"
            style={{ borderColor: sp.border }}>{pet.notes}</p>
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
  const [profileData, setProfileData] = useState({ firstName: user?.firstName || '', lastName: user?.lastName || '', email: user?.email || '', phone: user?.phone || '' });
  const [passwordData, setPasswordData] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingPetId, setEditingPetId] = useState<string | null>(null);
  const [deletingPetId, setDeletingPetId] = useState<string | null>(null);

  const { data: pets = [] } = useQuery({ queryKey: ['myPets'], queryFn: petService.getMyPets, enabled: !!user });

  const addPetMutation = useMutation({
    mutationFn: petService.addPet,
    onSuccess: p => { queryClient.invalidateQueries({ queryKey: ['myPets'] }); setShowAddForm(false); showToast(`${p.petName} added! 🐾`, 'success'); },
    onError: (e: any) => showToast(e.response?.data?.message || 'Failed to add pet', 'error'),
  });
  const updatePetMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => petService.updatePet(id, data),
    onSuccess: p => { queryClient.invalidateQueries({ queryKey: ['myPets'] }); setEditingPetId(null); showToast(`${p.petName} updated! 💕`, 'success'); },
    onError: (e: any) => showToast(e.response?.data?.message || 'Failed to update', 'error'),
  });
  const deletePetMutation = useMutation({
    mutationFn: petService.deletePet,
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['myPets'] }); setDeletingPetId(null); showToast('Removed.', 'success'); },
    onError: (e: any) => showToast(e.response?.data?.message || 'Failed', 'error'),
  });
  const updateProfileMutation = useMutation({
    mutationFn: authService.updateProfile,
    onSuccess: u => { setUser(u); setIsEditingProfile(false); showToast('Profile updated!', 'success'); },
    onError: (e: any) => showToast(e.response?.data?.message || 'Update failed', 'error'),
  });
  const updatePasswordMutation = useMutation({
    mutationFn: ({ currentPassword, newPassword }: { currentPassword: string; newPassword: string }) => authService.updatePassword(currentPassword, newPassword),
    onSuccess: () => { setIsChangingPassword(false); setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' }); showToast('Password updated!', 'success'); },
    onError: (e: any) => showToast(e.response?.data?.message || 'Update failed', 'error'),
  });

  const petToForm = (pet: Pet) => ({
    petName: pet.petName, species: pet.species, breed: pet.breed || '', birthday: pet.birthday || '',
    sex: pet.sex || '', isFixed: pet.isFixed || false, weight: pet.weight ? String(pet.weight) : '',
    size: pet.size || '', allergies: pet.allergies || [], notes: pet.notes || '',
  });
  const formToPetData = (form: typeof EMPTY_FORM) => ({
    petName: form.petName, species: form.species,
    breed: form.breed || undefined, birthday: form.birthday || undefined,
    sex: (form.sex as any) || undefined, isFixed: form.isFixed || undefined,
    weight: form.weight ? Number(form.weight) : undefined, size: (form.size as any) || undefined,
    allergies: form.allergies.length ? form.allergies : undefined, notes: form.notes || undefined,
  });

  const inputCls = "w-full border-2 border-gray-200 rounded-xl px-4 py-2 focus:outline-none focus:border-primary-400 text-sm";

  return (
    <div className="container mx-auto px-4 lg:px-8 py-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">My Profile</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Summary sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-md p-6">
              <div className="flex flex-col items-center text-center">
                <div className="w-24 h-24 rounded-full flex items-center justify-center mb-4"
                  style={{ background: 'linear-gradient(135deg,#e0f2fe,#bae6fd)' }}>
                  <User size={48} className="text-primary-600" />
                </div>
                <h2 className="text-xl font-bold mb-1">{user?.firstName} {user?.lastName}</h2>
                <p className="text-gray-500 text-sm mb-2">{user?.email}</p>
                <span className="px-3 py-1 bg-primary-100 text-primary-700 rounded-full text-xs font-bold">
                  {user?.role === 'admin' ? 'Administrator' : 'Customer'}
                </span>
              </div>
              <div className="mt-5 pt-5 border-t space-y-2.5">
                <div className="flex items-center gap-2.5 text-sm text-gray-600">
                  <Mail size={14} className="text-gray-400 shrink-0" />{user?.email}
                </div>
                {user?.phone && (
                  <div className="flex items-center gap-2.5 text-sm text-gray-600">
                    <Phone size={14} className="text-gray-400 shrink-0" />{user.phone}
                  </div>
                )}
                {pets.length > 0 && (
                  <div className="flex items-center gap-2.5 text-sm text-gray-600">
                    <PawPrint size={14} className="text-gray-400 shrink-0" />
                    {pets.length} pet{pets.length !== 1 ? 's' : ''} in your family
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="lg:col-span-2 space-y-6">
            {/* Personal Info */}
            <div className="bg-white rounded-2xl shadow-md p-6">
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-lg font-bold">Personal Information</h3>
                {!isEditingProfile && (
                  <button onClick={() => setIsEditingProfile(true)} className="text-primary-600 text-sm font-semibold hover:text-primary-700">Edit</button>
                )}
              </div>
              {!isEditingProfile ? (
                <div className="space-y-3 text-sm">
                  <div className="grid grid-cols-2 gap-4">
                    <div><p className="text-xs text-gray-400 mb-0.5 font-medium">First Name</p><p className="font-semibold">{user?.firstName}</p></div>
                    <div><p className="text-xs text-gray-400 mb-0.5 font-medium">Last Name</p><p className="font-semibold">{user?.lastName}</p></div>
                  </div>
                  <div><p className="text-xs text-gray-400 mb-0.5 font-medium">Email</p><p className="font-semibold">{user?.email}</p></div>
                  <div><p className="text-xs text-gray-400 mb-0.5 font-medium">Phone</p><p className="font-semibold">{user?.phone || '—'}</p></div>
                </div>
              ) : (
                <form onSubmit={e => { e.preventDefault(); updateProfileMutation.mutate(profileData); }} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div><label className="block text-sm font-medium mb-1.5">First Name *</label>
                      <input type="text" required value={profileData.firstName} onChange={e => setProfileData({ ...profileData, firstName: e.target.value })} className={inputCls} /></div>
                    <div><label className="block text-sm font-medium mb-1.5">Last Name *</label>
                      <input type="text" required value={profileData.lastName} onChange={e => setProfileData({ ...profileData, lastName: e.target.value })} className={inputCls} /></div>
                  </div>
                  <div><label className="block text-sm font-medium mb-1.5">Email *</label>
                    <input type="email" required value={profileData.email} onChange={e => setProfileData({ ...profileData, email: e.target.value })} className={inputCls} /></div>
                  <div><label className="block text-sm font-medium mb-1.5">Phone</label>
                    <input type="tel" value={profileData.phone} onChange={e => setProfileData({ ...profileData, phone: e.target.value })} className={inputCls} /></div>
                  <div className="flex gap-3 pt-1">
                    <button type="submit" disabled={updateProfileMutation.isPending}
                      className="flex items-center gap-2 bg-primary-600 text-white px-6 py-2 rounded-xl font-semibold text-sm hover:bg-primary-700 disabled:opacity-50">
                      <Save size={14} />{updateProfileMutation.isPending ? 'Saving...' : 'Save'}
                    </button>
                    <button type="button" onClick={() => { setProfileData({ firstName: user?.firstName || '', lastName: user?.lastName || '', email: user?.email || '', phone: user?.phone || '' }); setIsEditingProfile(false); }}
                      className="px-5 py-2 border-2 border-gray-200 rounded-xl text-sm font-semibold hover:bg-gray-50">Cancel</button>
                  </div>
                </form>
              )}
            </div>

            {/* ── Sweet Pet Family section ──────────────────────────────── */}
            <div className="rounded-2xl overflow-hidden"
              style={{ background: 'white', border: '1px solid #f0e9d9', boxShadow: '0 4px 24px rgba(245,158,11,.07), 0 1px 4px rgba(0,0,0,.04)' }}>

              {/* Warm pastel header */}
              <div className="relative px-6 py-6 overflow-hidden"
                style={{ background: 'linear-gradient(135deg, #fff7ed 0%, #fdf4ff 55%, #eff6ff 100%)', borderBottom: '1px solid #f0e9d9' }}>
                {/* Watermark decorations */}
                <span className="absolute text-7xl opacity-[0.06]" style={{ top: -14, right: -8 }}>🐾</span>
                <span className="absolute text-4xl opacity-[0.05]" style={{ top: 14, right: 92 }}>🐾</span>
                <span className="absolute text-3xl opacity-[0.08]" style={{ bottom: -4, left: 18 }}>✨</span>

                <div className="relative flex items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2.5 mb-1.5">
                      <div className="w-9 h-9 rounded-2xl flex items-center justify-center text-lg"
                        style={{ background: 'linear-gradient(135deg,#fde68a,#fca5a5)', boxShadow: '0 4px 12px rgba(245,158,11,.22)' }}>
                        🐾
                      </div>
                      <h3 className="text-lg font-black text-gray-800">My Pet Family</h3>
                      {pets.length > 0 && (
                        <span className="text-xs font-black px-2.5 py-0.5 rounded-full"
                          style={{ background: '#fef3c7', color: '#92400e', border: '1.5px solid #fde68a' }}>
                          {pets.length}
                        </span>
                      )}
                      <span className="text-lg">💕</span>
                    </div>
                    <p className="text-xs font-medium text-gray-400">
                      Personalized picks, birthday surprises & ingredient alerts — all for your pets.
                    </p>
                  </div>
                  {!showAddForm && pets.length > 0 && (
                    <button onClick={() => { setShowAddForm(true); setEditingPetId(null); }}
                      className="shrink-0 flex items-center gap-1.5 text-xs font-black px-4 py-2 rounded-xl transition-all hover:scale-105 active:scale-95"
                      style={{ background: 'linear-gradient(135deg,#fef3c7,#fed7aa)', color: '#b45309', border: '2px solid #f59e0b55', boxShadow: '0 4px 12px rgba(245,158,11,.2)' }}>
                      <Plus size={13} /> Add Pet
                    </button>
                  )}
                </div>
              </div>

              <div className="p-6">
                {/* Add form */}
                {showAddForm && (
                  <div className="mb-6 rounded-2xl p-5"
                    style={{ background: '#fffbf5', border: '2px solid #fde68a66', boxShadow: '0 4px 16px rgba(245,158,11,.07)' }}>
                    <div className="flex items-center justify-between mb-5">
                      <div className="flex items-center gap-2">
                        <span className="text-base">🐾</span>
                        <h4 className="font-black text-gray-700 text-sm">New Pet Profile</h4>
                      </div>
                      <button onClick={() => setShowAddForm(false)}
                        className="w-7 h-7 rounded-full flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-all">
                        <X size={14} />
                      </button>
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
                  <div className="text-center py-14 px-4">
                    <div className="flex justify-center gap-3 mb-6">
                      {(['dog', 'cat', 'bird'] as const).map((sp, i) => (
                        <div key={sp} className="w-16 h-16 rounded-3xl flex items-center justify-center text-3xl border-2 animate-bounce"
                          style={{
                            background:  SPECIES_CONFIG[sp].headerGrad,
                            borderColor: SPECIES_CONFIG[sp].border,
                            boxShadow:   SPECIES_CONFIG[sp].cardShadow,
                            animationDelay: `${i * 0.15}s`,
                          }}>
                          {SPECIES_CONFIG[sp].emoji}
                        </div>
                      ))}
                    </div>
                    <h4 className="text-xl font-black text-gray-800 mb-2">Introduce your pets! 🐾</h4>
                    <p className="text-sm text-gray-400 mb-7 max-w-xs mx-auto">
                      Tell us about your pets and every visit to Petshiwu will feel made just for them.
                    </p>
                    <button onClick={() => setShowAddForm(true)}
                      className="inline-flex items-center gap-2 font-black text-sm px-8 py-3 rounded-2xl transition-all hover:scale-105 active:scale-95"
                      style={{ background: 'linear-gradient(135deg,#fef3c7,#fed7aa,#fca5a5)', color: '#92400e', border: '2px solid #fde68a', boxShadow: '0 6px 20px rgba(245,158,11,.2)' }}>
                      🐾 Add Your First Pet
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    {pets.map(pet => (
                      <div key={pet._id}>
                        {editingPetId === pet._id ? (
                          <div className="rounded-2xl p-4"
                            style={{ background: getSp(pet.species).chipBg, border: `2px solid ${getSp(pet.species).border}`, boxShadow: getSp(pet.species).cardShadow }}>
                            <div className="flex items-center justify-between mb-4">
                              <h4 className="font-black text-sm" style={{ color: getSp(pet.species).accent }}>
                                {getSp(pet.species).emoji} Edit {pet.petName}
                              </h4>
                              <button onClick={() => setEditingPetId(null)} className="text-gray-400 hover:text-gray-600"><X size={14} /></button>
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
                          <div className="rounded-2xl p-5 text-center"
                            style={{ background: '#fff1f2', border: '2px solid #fecdd3', boxShadow: '0 4px 16px rgba(244,63,94,.08)' }}>
                            <span className="text-4xl block mb-3">{getSp(pet.species).emoji}</span>
                            <p className="text-sm font-bold text-gray-700 mb-1">
                              Remove <span className="text-rose-500">{pet.petName}</span>?
                            </p>
                            <p className="text-xs text-gray-400 mb-4">This can't be undone.</p>
                            <div className="flex gap-2">
                              <button onClick={() => deletePetMutation.mutate(pet._id)} disabled={deletePetMutation.isPending}
                                className="flex-1 py-2 rounded-xl text-sm font-black disabled:opacity-50"
                                style={{ background: '#fff1f2', color: '#be123c', border: '2px solid #fecdd3' }}>
                                {deletePetMutation.isPending ? 'Removing...' : 'Yes, Remove'}
                              </button>
                              <button onClick={() => setDeletingPetId(null)}
                                className="flex-1 py-2 rounded-xl text-sm font-bold text-gray-500 hover:text-gray-700 bg-white border-2 border-gray-200">
                                Keep
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
                <form onSubmit={e => {
                  e.preventDefault();
                  if (passwordData.newPassword !== passwordData.confirmPassword) { showToast("Passwords don't match", 'error'); return; }
                  if (passwordData.newPassword.length < 8) { showToast('Min 8 characters', 'error'); return; }
                  updatePasswordMutation.mutate({ currentPassword: passwordData.currentPassword, newPassword: passwordData.newPassword });
                }} className="space-y-4">
                  {[['Current Password', 'currentPassword'], ['New Password', 'newPassword'], ['Confirm New Password', 'confirmPassword']].map(([label, key]) => (
                    <div key={key}>
                      <label className="block text-sm font-medium mb-1.5">{label} *</label>
                      <input type="password" required
                        value={passwordData[key as keyof typeof passwordData]}
                        onChange={e => setPasswordData({ ...passwordData, [key]: e.target.value })}
                        minLength={key !== 'currentPassword' ? 8 : undefined}
                        className={inputCls} />
                    </div>
                  ))}
                  <p className="text-xs text-gray-500">At least 8 characters.</p>
                  <div className="flex gap-3">
                    <button type="submit" disabled={updatePasswordMutation.isPending}
                      className="flex items-center gap-2 bg-primary-600 text-white px-6 py-2 rounded-xl font-semibold text-sm hover:bg-primary-700 disabled:opacity-50">
                      <Lock size={14} />{updatePasswordMutation.isPending ? 'Updating...' : 'Update Password'}
                    </button>
                    <button type="button" onClick={() => { setIsChangingPassword(false); setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' }); }}
                      className="px-5 py-2 border-2 border-gray-200 rounded-xl text-sm font-semibold hover:bg-gray-50">Cancel</button>
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
                  <span className="font-semibold">
                    {user?.createdAt ? new Date(user.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : '—'}
                  </span>
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
