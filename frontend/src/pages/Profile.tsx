import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/stores/authStore';
import { authService } from '@/services/auth';
import { petService } from '@/services/pets';
import { Pet } from '@/types';
import { User, Mail, Phone, Lock, Save, PawPrint, Plus, Pencil, Trash2, X, ChevronDown, ChevronUp, Zap } from 'lucide-react';
import Toast from '@/components/Toast';
import { useToast } from '@/hooks/useToast';

// ─── Species config — digital neon palette ────────────────────────────────────
const SPECIES_CONFIG: Record<string, {
  label: string; shortLabel?: string; emoji: string;
  neon: string;           // neon accent color
  darkGrad: string;       // dark gradient for card header
  glowShadow: string;     // box-shadow glow string
  orbGrad: string;        // emoji orb gradient
  chipStyle: string;      // chip inline style string (for tag bg+text)
  tileGrad: string;       // selected tile gradient
}> = {
  dog: {
    label: 'Dog', emoji: '🐕', neon: '#fb923c',
    darkGrad:   'linear-gradient(135deg, #1c0900 0%, #431407 100%)',
    glowShadow: '0 0 0 1px #fb923c44, 0 8px 32px rgba(251,146,60,.35)',
    orbGrad:    'radial-gradient(circle at 35% 35%, #fed7aa, #f97316)',
    chipStyle:  'background:#431407;color:#fb923c;border:1.5px solid #fb923c55',
    tileGrad:   'linear-gradient(135deg, #431407, #7c2d12)',
  },
  cat: {
    label: 'Cat', emoji: '🐈', neon: '#c084fc',
    darkGrad:   'linear-gradient(135deg, #150028 0%, #3b0764 100%)',
    glowShadow: '0 0 0 1px #c084fc44, 0 8px 32px rgba(192,132,252,.35)',
    orbGrad:    'radial-gradient(circle at 35% 35%, #e9d5ff, #9333ea)',
    chipStyle:  'background:#3b0764;color:#c084fc;border:1.5px solid #c084fc55',
    tileGrad:   'linear-gradient(135deg, #3b0764, #581c87)',
  },
  bird: {
    label: 'Bird', emoji: '🐦', neon: '#38bdf8',
    darkGrad:   'linear-gradient(135deg, #001829 0%, #0c2a5e 100%)',
    glowShadow: '0 0 0 1px #38bdf844, 0 8px 32px rgba(56,189,248,.35)',
    orbGrad:    'radial-gradient(circle at 35% 35%, #bae6fd, #0284c7)',
    chipStyle:  'background:#0c2a5e;color:#38bdf8;border:1.5px solid #38bdf855',
    tileGrad:   'linear-gradient(135deg, #0c2a5e, #1e3a8a)',
  },
  fish: {
    label: 'Fish', emoji: '🐠', neon: '#2dd4bf',
    darkGrad:   'linear-gradient(135deg, #001a18 0%, #0d2f2b 100%)',
    glowShadow: '0 0 0 1px #2dd4bf44, 0 8px 32px rgba(45,212,191,.35)',
    orbGrad:    'radial-gradient(circle at 35% 35%, #99f6e4, #0f766e)',
    chipStyle:  'background:#0d2f2b;color:#2dd4bf;border:1.5px solid #2dd4bf55',
    tileGrad:   'linear-gradient(135deg, #0d2f2b, #134e4a)',
  },
  reptile: {
    label: 'Reptile', emoji: '🦎', neon: '#4ade80',
    darkGrad:   'linear-gradient(135deg, #001a0a 0%, #052e16 100%)',
    glowShadow: '0 0 0 1px #4ade8044, 0 8px 32px rgba(74,222,128,.35)',
    orbGrad:    'radial-gradient(circle at 35% 35%, #bbf7d0, #16a34a)',
    chipStyle:  'background:#052e16;color:#4ade80;border:1.5px solid #4ade8055',
    tileGrad:   'linear-gradient(135deg, #052e16, #14532d)',
  },
  'small-animal': {
    label: 'Small Animal', shortLabel: 'Small', emoji: '🐹', neon: '#f472b6',
    darkGrad:   'linear-gradient(135deg, #1a0010 0%, #500724 100%)',
    glowShadow: '0 0 0 1px #f472b644, 0 8px 32px rgba(244,114,182,.35)',
    orbGrad:    'radial-gradient(circle at 35% 35%, #fbcfe8, #be185d)',
    chipStyle:  'background:#500724;color:#f472b6;border:1.5px solid #f472b655',
    tileGrad:   'linear-gradient(135deg, #500724, #881337)',
  },
  other: {
    label: 'Other', emoji: '🐾', neon: '#94a3b8',
    darkGrad:   'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
    glowShadow: '0 0 0 1px #94a3b844, 0 8px 32px rgba(148,163,184,.25)',
    orbGrad:    'radial-gradient(circle at 35% 35%, #e2e8f0, #475569)',
    chipStyle:  'background:#1e293b;color:#94a3b8;border:1.5px solid #94a3b855',
    tileGrad:   'linear-gradient(135deg, #1e293b, #334155)',
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
    <div className="grid grid-cols-4 sm:grid-cols-7 gap-2.5">
      {Object.entries(SPECIES_CONFIG).map(([key, sp]) => {
        const sel = value === key;
        return (
          <button key={key} type="button" onClick={() => onChange(sel ? '' : key)}
            className="relative flex flex-col items-center gap-1.5 py-3 px-1 rounded-2xl transition-all duration-200 focus:outline-none"
            style={{
              background:  sel ? sp.tileGrad : '#0f172a',
              border:     `2px solid ${sel ? sp.neon : '#1e293b'}`,
              boxShadow:   sel ? `0 0 16px ${sp.neon}55, 0 0 4px ${sp.neon}33` : 'none',
              transform:   sel ? 'scale(1.06) translateY(-2px)' : 'scale(1)',
            }}
          >
            <span className="text-2xl leading-none">{sp.emoji}</span>
            <span className="text-[10px] font-bold leading-tight text-center"
              style={{ color: sel ? sp.neon : '#64748b' }}>
              {sp.shortLabel || sp.label}
            </span>
            {sel && (
              <span className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-black"
                style={{ background: sp.neon, color: '#000' }}>✓</span>
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

  const inputCls = "w-full rounded-xl px-4 py-2.5 text-sm text-gray-100 bg-[#0f172a] border-2 focus:outline-none transition-colors placeholder-slate-600";

  return (
    <form onSubmit={e => { e.preventDefault(); if (!form.petName.trim() || !form.species) return; onSubmit(form); }} className="space-y-5">

      <div>
        <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-3">Species <span className="text-red-400">*</span></label>
        <SpeciesPicker value={form.species} onChange={v => set('species', v)} />
      </div>

      <div className={`grid grid-cols-1 sm:grid-cols-2 gap-4 transition-opacity ${form.species ? 'opacity-100' : 'opacity-30 pointer-events-none'}`}>
        <div>
          <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-1.5">Name <span className="text-red-400">*</span></label>
          <input type="text" value={form.petName} onChange={e => set('petName', e.target.value)}
            placeholder="Luna, Max, Noodle..."
            className={inputCls}
            style={{ borderColor: sp && form.petName ? sp.neon + '88' : '#1e293b',
              boxShadow: sp && form.petName ? `0 0 8px ${sp.neon}22` : 'none' }}
          />
        </div>
        <div>
          <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-1.5">Breed <span className="text-slate-600 normal-case tracking-normal font-normal">(optional)</span></label>
          <input type="text" value={form.breed} onChange={e => set('breed', e.target.value)}
            placeholder={form.species === 'dog' ? 'Golden Retriever...' : form.species === 'cat' ? 'Siamese...' : 'Any breed'}
            className={inputCls} style={{ borderColor: '#1e293b' }}
          />
        </div>
      </div>

      <div className={`transition-opacity ${form.species ? 'opacity-100' : 'opacity-30 pointer-events-none'}`}>
        <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-1.5">🎂 Birthday <span className="text-slate-600 normal-case tracking-normal font-normal">(optional — birthday treats!)</span></label>
        <input type="date" value={form.birthday} onChange={e => set('birthday', e.target.value)}
          max={new Date().toISOString().split('T')[0]}
          className={`${inputCls} w-full sm:w-52`} style={{ borderColor: '#1e293b', colorScheme: 'dark' }}
        />
      </div>

      <div className={`transition-opacity ${form.species ? 'opacity-100' : 'opacity-30 pointer-events-none'}`}>
        <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-1">🚫 Ingredients to Avoid</label>
        <p className="text-xs text-slate-600 mb-2.5">We'll flag any products containing these.</p>
        <div className="flex flex-wrap gap-2">
          {ALLERGENS.map(({ label, emoji }) => {
            const active = form.allergies.includes(label.toLowerCase());
            return (
              <button key={label} type="button" onClick={() => set('allergies', active ? form.allergies.filter(x => x !== label.toLowerCase()) : [...form.allergies, label.toLowerCase()])}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border-2 transition-all duration-150"
                style={active ? {
                  background: '#ff000022', borderColor: '#f87171', color: '#f87171',
                  boxShadow: '0 0 8px #f8717155',
                } : {
                  background: '#0f172a', borderColor: '#1e293b', color: '#475569',
                }}
              >
                {emoji} {label}{active && <span className="ml-0.5 opacity-70">✕</span>}
              </button>
            );
          })}
        </div>
      </div>

      <button type="button" onClick={() => setShowMore(v => !v)}
        className="flex items-center gap-1.5 text-xs font-black text-slate-500 hover:text-slate-300 uppercase tracking-widest transition-colors">
        {showMore ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
        {showMore ? 'Less' : 'More'} details
      </button>

      {showMore && (
        <div className="space-y-4 bg-[#0a0f1e] rounded-2xl p-4 border border-[#1e293b]">
          <div className="flex flex-wrap gap-4 items-center">
            <div>
              <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2">Sex</label>
              <div className="flex gap-2">
                {[{ v: 'male', l: '♂ Male' }, { v: 'female', l: '♀ Female' }].map(({ v, l }) => (
                  <button key={v} type="button" onClick={() => set('sex', form.sex === v ? '' : v)}
                    className="px-4 py-1.5 rounded-full text-xs font-bold border-2 transition-all"
                    style={form.sex === v ? { background: '#0ea5e922', borderColor: '#0ea5e9', color: '#38bdf8', boxShadow: '0 0 8px #0ea5e933' }
                      : { background: '#0f172a', borderColor: '#1e293b', color: '#475569' }}
                  >{l}</button>
                ))}
              </div>
            </div>
            <div className="flex items-center gap-2 sm:mt-5">
              <input type="checkbox" id="isFixed" checked={form.isFixed} onChange={e => set('isFixed', e.target.checked)} className="w-4 h-4 accent-cyan-500" />
              <label htmlFor="isFixed" className="text-xs text-slate-400 font-bold">Spayed / Neutered</label>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-1.5">Weight (lbs)</label>
              <input type="number" value={form.weight} onChange={e => set('weight', e.target.value)} min="0" max="300" placeholder="e.g. 45"
                className={inputCls} style={{ borderColor: '#1e293b' }} />
            </div>
            {(form.species === 'dog' || form.species === 'cat') && (
              <div>
                <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-1.5">Size</label>
                <div className="grid grid-cols-2 gap-1.5">
                  {SIZES.map(sz => (
                    <button key={sz.value} type="button" onClick={() => set('size', form.size === sz.value ? '' : sz.value)}
                      className="flex flex-col items-start px-3 py-2 rounded-xl border-2 text-xs transition-all"
                      style={form.size === sz.value
                        ? { background: '#0f172a', borderColor: sp?.neon || '#0ea5e9', color: sp?.neon || '#38bdf8', boxShadow: `0 0 8px ${sp?.neon || '#0ea5e9'}33` }
                        : { background: '#0f172a', borderColor: '#1e293b', color: '#475569' }}
                    ><span className="font-black">{sz.label}</span><span style={{ color: '#334155' }}>{sz.sub}</span></button>
                  ))}
                </div>
              </div>
            )}
          </div>
          <div>
            <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-1.5">Notes</label>
            <textarea value={form.notes} onChange={e => set('notes', e.target.value)}
              placeholder="Health conditions, favourite things..." rows={2} maxLength={500}
              className={`${inputCls} resize-none`} style={{ borderColor: '#1e293b' }} />
          </div>
        </div>
      )}

      <div className="flex gap-3 pt-1">
        <button type="submit" disabled={isPending || !form.petName.trim() || !form.species}
          className="flex items-center gap-2 px-7 py-2.5 rounded-xl font-black text-sm disabled:opacity-40 transition-all"
          style={{
            background: sp ? sp.tileGrad : 'linear-gradient(135deg,#0f2a6e,#0ea5e9)',
            color: sp ? sp.neon : '#38bdf8',
            border: `2px solid ${sp ? sp.neon : '#0ea5e9'}`,
            boxShadow: sp ? `0 0 16px ${sp.neon}44` : '0 0 16px #0ea5e944',
          }}
        >
          <Zap size={14} />
          {isPending ? 'Saving...' : isEdit ? 'Save Changes' : `Add ${form.petName || 'Pet'}`}
        </button>
        <button type="button" onClick={onCancel}
          className="px-5 py-2.5 rounded-xl font-bold text-sm text-slate-500 hover:text-slate-300 border-2 border-[#1e293b] hover:border-[#334155] bg-[#0f172a] transition-all">
          Cancel
        </button>
      </div>
    </form>
  );
}

// ─── Digital Pet ID Card ──────────────────────────────────────────────────────
interface PetCardProps { pet: Pet; onEdit: () => void; onDelete: () => void; }

function PetCard({ pet, onEdit, onDelete }: PetCardProps) {
  const sp = getSp(pet.species);
  const age = petAge(pet.birthday);
  const spLabel = SPECIES_CONFIG[pet.species]?.label || 'Other';

  return (
    <div className="rounded-3xl overflow-hidden transition-all duration-300 hover:-translate-y-1.5 cursor-default"
      style={{ background: '#0a0f1e', border: `1.5px solid ${sp.neon}44`, boxShadow: sp.glowShadow }}>

      {/* Dark header */}
      <div className="relative h-32 flex flex-col items-center justify-center gap-1 overflow-hidden"
        style={{ background: sp.darkGrad }}>
        {/* Grid dot pattern */}
        <div className="absolute inset-0 opacity-20"
          style={{ backgroundImage: 'radial-gradient(rgba(255,255,255,.4) 1px, transparent 1px)', backgroundSize: '18px 18px' }} />

        {/* Decorative ring */}
        <div className="absolute inset-0 rounded-t-3xl" style={{ boxShadow: `inset 0 -1px 0 ${sp.neon}33` }} />

        {/* Glowing orb */}
        <div className="relative w-16 h-16 rounded-full flex items-center justify-center text-3xl border-2"
          style={{ background: sp.orbGrad, borderColor: sp.neon + '66', boxShadow: `0 0 24px ${sp.neon}66, 0 0 8px ${sp.neon}44` }}>
          {sp.emoji}
        </div>

        {/* ID badge top right */}
        <div className="absolute top-3 left-4 flex items-center gap-1.5"
          style={{ color: sp.neon + 'aa', fontSize: 9, fontWeight: 900, letterSpacing: '0.1em' }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: sp.neon, boxShadow: `0 0 6px ${sp.neon}`, display: 'inline-block' }} />
          PET ID
        </div>

        {/* Action buttons */}
        <div className="absolute top-2.5 right-3 flex gap-1">
          {[{ action: onEdit, icon: <Pencil size={11} />, title: 'Edit' }, { action: onDelete, icon: <Trash2 size={11} />, title: 'Remove' }].map(({ action, icon, title }) => (
            <button key={title} onClick={action} title={title}
              className="w-6 h-6 rounded-full flex items-center justify-center transition-all hover:scale-110"
              style={{ background: '#ffffff11', border: '1px solid #ffffff22', color: '#94a3b8' }}>
              {icon}
            </button>
          ))}
        </div>
      </div>

      {/* Card body */}
      <div className="px-5 pt-4 pb-5">
        <h4 className="text-lg font-black text-center leading-tight" style={{ color: '#f1f5f9' }}>{pet.petName}</h4>
        <p className="text-xs font-bold text-center mb-4 mt-0.5" style={{ color: sp.neon + 'cc' }}>
          {spLabel}{pet.breed ? ` · ${pet.breed}` : ''}
        </p>

        {/* Stats row */}
        <div className="flex flex-wrap justify-center gap-1.5 mb-3">
          {age && <span className="text-[11px] font-bold px-2.5 py-1 rounded-full" style={{ background: sp.neon + '18', color: sp.neon, border: `1.5px solid ${sp.neon}44` }}>🎂 {age}</span>}
          {pet.sex && pet.sex !== 'unknown' && <span className="text-[11px] font-bold px-2.5 py-1 rounded-full" style={{ background: sp.neon + '18', color: sp.neon, border: `1.5px solid ${sp.neon}44` }}>{pet.sex === 'male' ? '♂' : '♀'} {pet.sex === 'male' ? 'Male' : 'Female'}</span>}
          {pet.isFixed && <span className="text-[11px] font-bold px-2.5 py-1 rounded-full" style={{ background: sp.neon + '18', color: sp.neon, border: `1.5px solid ${sp.neon}44` }}>Neutered</span>}
          {pet.weight && <span className="text-[11px] font-bold px-2.5 py-1 rounded-full" style={{ background: sp.neon + '18', color: sp.neon, border: `1.5px solid ${sp.neon}44` }}>{pet.weight} lbs</span>}
          {pet.size && <span className="text-[11px] font-bold px-2.5 py-1 rounded-full capitalize" style={{ background: sp.neon + '18', color: sp.neon, border: `1.5px solid ${sp.neon}44` }}>{pet.size === 'xlarge' ? 'XL' : pet.size}</span>}
        </div>

        {/* Allergens */}
        {pet.allergies && pet.allergies.length > 0 && (
          <div className="border-t mt-1 pt-3" style={{ borderColor: sp.neon + '22' }}>
            <p className="text-[9px] font-black uppercase tracking-widest text-center mb-2" style={{ color: sp.neon + '88' }}>No-go ingredients</p>
            <div className="flex flex-wrap justify-center gap-1">
              {pet.allergies.map(a => {
                const found = ALLERGENS.find(x => x.label.toLowerCase() === a);
                return (
                  <span key={a} className="flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full capitalize"
                    style={{ background: '#ff000018', color: '#f87171', border: '1.5px solid #f8717133' }}>
                    {found?.emoji} {a}
                  </span>
                );
              })}
            </div>
          </div>
        )}

        {pet.notes && (
          <p className="text-[11px] italic text-center mt-3 pt-3 border-t leading-snug" style={{ color: '#475569', borderColor: sp.neon + '22' }}>
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
  const [profileData, setProfileData] = useState({ firstName: user?.firstName || '', lastName: user?.lastName || '', email: user?.email || '', phone: user?.phone || '' });
  const [passwordData, setPasswordData] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingPetId, setEditingPetId] = useState<string | null>(null);
  const [deletingPetId, setDeletingPetId] = useState<string | null>(null);

  const { data: pets = [] } = useQuery({ queryKey: ['myPets'], queryFn: petService.getMyPets, enabled: !!user });

  const addPetMutation = useMutation({
    mutationFn: petService.addPet,
    onSuccess: p => { queryClient.invalidateQueries({ queryKey: ['myPets'] }); setShowAddForm(false); showToast(`${p.petName} added to your pet family! 🐾`, 'success'); },
    onError: (e: any) => showToast(e.response?.data?.message || 'Failed to add pet', 'error'),
  });
  const updatePetMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => petService.updatePet(id, data),
    onSuccess: p => { queryClient.invalidateQueries({ queryKey: ['myPets'] }); setEditingPetId(null); showToast(`${p.petName} updated!`, 'success'); },
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

  const petToForm = (pet: Pet) => ({ petName: pet.petName, species: pet.species, breed: pet.breed || '', birthday: pet.birthday || '', sex: pet.sex || '', isFixed: pet.isFixed || false, weight: pet.weight ? String(pet.weight) : '', size: pet.size || '', allergies: pet.allergies || [], notes: pet.notes || '' });
  const formToPetData = (form: typeof EMPTY_FORM) => ({ petName: form.petName, species: form.species, breed: form.breed || undefined, birthday: form.birthday || undefined, sex: (form.sex as any) || undefined, isFixed: form.isFixed || undefined, weight: form.weight ? Number(form.weight) : undefined, size: (form.size as any) || undefined, allergies: form.allergies.length ? form.allergies : undefined, notes: form.notes || undefined });

  const inputCls = "w-full border-2 border-gray-200 rounded-xl px-4 py-2 focus:outline-none focus:border-primary-400 text-sm";

  return (
    <div className="container mx-auto px-4 lg:px-8 py-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">My Profile</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-md p-6">
              <div className="flex flex-col items-center text-center">
                <div className="w-24 h-24 rounded-full flex items-center justify-center mb-4" style={{ background: 'linear-gradient(135deg,#e0f2fe,#bae6fd)' }}>
                  <User size={48} className="text-primary-600" />
                </div>
                <h2 className="text-xl font-bold mb-1">{user?.firstName} {user?.lastName}</h2>
                <p className="text-gray-500 text-sm mb-2">{user?.email}</p>
                <span className="px-3 py-1 bg-primary-100 text-primary-700 rounded-full text-xs font-bold">{user?.role === 'admin' ? 'Administrator' : 'Customer'}</span>
              </div>
              <div className="mt-5 pt-5 border-t space-y-2.5">
                <div className="flex items-center gap-2.5 text-sm text-gray-600"><Mail size={14} className="text-gray-400 shrink-0" />{user?.email}</div>
                {user?.phone && <div className="flex items-center gap-2.5 text-sm text-gray-600"><Phone size={14} className="text-gray-400 shrink-0" />{user.phone}</div>}
                {pets.length > 0 && <div className="flex items-center gap-2.5 text-sm text-gray-600"><PawPrint size={14} className="text-gray-400 shrink-0" />{pets.length} pet{pets.length !== 1 ? 's' : ''} in your family</div>}
              </div>
            </div>
          </div>

          <div className="lg:col-span-2 space-y-6">
            {/* Personal Info */}
            <div className="bg-white rounded-2xl shadow-md p-6">
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-lg font-bold">Personal Information</h3>
                {!isEditingProfile && <button onClick={() => setIsEditingProfile(true)} className="text-primary-600 text-sm font-semibold hover:text-primary-700">Edit</button>}
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
                    <div><label className="block text-sm font-medium mb-1.5">First Name *</label><input type="text" required value={profileData.firstName} onChange={e => setProfileData({ ...profileData, firstName: e.target.value })} className={inputCls} /></div>
                    <div><label className="block text-sm font-medium mb-1.5">Last Name *</label><input type="text" required value={profileData.lastName} onChange={e => setProfileData({ ...profileData, lastName: e.target.value })} className={inputCls} /></div>
                  </div>
                  <div><label className="block text-sm font-medium mb-1.5">Email *</label><input type="email" required value={profileData.email} onChange={e => setProfileData({ ...profileData, email: e.target.value })} className={inputCls} /></div>
                  <div><label className="block text-sm font-medium mb-1.5">Phone</label><input type="tel" value={profileData.phone} onChange={e => setProfileData({ ...profileData, phone: e.target.value })} className={inputCls} /></div>
                  <div className="flex gap-3 pt-1">
                    <button type="submit" disabled={updateProfileMutation.isPending} className="flex items-center gap-2 bg-primary-600 text-white px-6 py-2 rounded-xl font-semibold text-sm hover:bg-primary-700 disabled:opacity-50"><Save size={14} />{updateProfileMutation.isPending ? 'Saving...' : 'Save'}</button>
                    <button type="button" onClick={() => { setProfileData({ firstName: user?.firstName || '', lastName: user?.lastName || '', email: user?.email || '', phone: user?.phone || '' }); setIsEditingProfile(false); }} className="px-5 py-2 border-2 border-gray-200 rounded-xl text-sm font-semibold hover:bg-gray-50">Cancel</button>
                  </div>
                </form>
              )}
            </div>

            {/* ── Digital Pet Family ─────────────────────────────────────── */}
            <div className="rounded-2xl overflow-hidden shadow-2xl" style={{ background: '#060d1f', border: '1px solid #1e293b' }}>
              {/* Dark header */}
              <div className="relative px-6 py-6 overflow-hidden"
                style={{ background: 'linear-gradient(135deg, #060d1f 0%, #0f172a 100%)', borderBottom: '1px solid #1e293b' }}>
                {/* Grid dot background */}
                <div className="absolute inset-0 opacity-30"
                  style={{ backgroundImage: 'radial-gradient(rgba(56,189,248,.5) 1px, transparent 1px)', backgroundSize: '24px 24px' }} />
                {/* Glow orbs */}
                <div className="absolute -top-8 -left-8 w-32 h-32 rounded-full opacity-20"
                  style={{ background: 'radial-gradient(circle, #6366f1, transparent)' }} />
                <div className="absolute -bottom-8 right-12 w-24 h-24 rounded-full opacity-15"
                  style={{ background: 'radial-gradient(circle, #f472b6, transparent)' }} />

                <div className="relative flex items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2.5 mb-1.5">
                      <div className="w-8 h-8 rounded-xl flex items-center justify-center text-base"
                        style={{ background: 'linear-gradient(135deg, #0ea5e9, #6366f1)', boxShadow: '0 0 16px #6366f155' }}>
                        🐾
                      </div>
                      <h3 className="text-lg font-black text-white">My Pet Family</h3>
                      {pets.length > 0 && (
                        <span className="text-xs font-black px-2 py-0.5 rounded-full"
                          style={{ background: '#0ea5e922', color: '#38bdf8', border: '1px solid #0ea5e944' }}>
                          {pets.length}
                        </span>
                      )}
                    </div>
                    <p className="text-xs font-medium" style={{ color: '#475569' }}>
                      Personalized recommendations, birthday alerts & ingredient warnings.
                    </p>
                  </div>
                  {!showAddForm && pets.length > 0 && (
                    <button onClick={() => { setShowAddForm(true); setEditingPetId(null); }}
                      className="shrink-0 flex items-center gap-1.5 text-xs font-black px-4 py-2 rounded-xl transition-all hover:scale-105"
                      style={{ background: 'linear-gradient(135deg, #0f2a6e, #0284c7)', color: '#38bdf8', border: '1.5px solid #0ea5e966', boxShadow: '0 0 16px #0ea5e944' }}>
                      <Plus size={13} /> Add Pet
                    </button>
                  )}
                </div>
              </div>

              <div className="p-6">
                {/* Add form */}
                {showAddForm && (
                  <div className="mb-6 rounded-2xl p-5" style={{ background: '#0a0f1e', border: '1.5px solid #0ea5e944', boxShadow: '0 0 24px #0ea5e922' }}>
                    <div className="flex items-center justify-between mb-5">
                      <div className="flex items-center gap-2">
                        <Zap size={16} style={{ color: '#38bdf8' }} />
                        <h4 className="font-black text-white text-sm">New Pet Profile</h4>
                      </div>
                      <button onClick={() => setShowAddForm(false)} className="w-7 h-7 rounded-full flex items-center justify-center text-slate-500 hover:text-slate-300 hover:bg-white/5 transition-all"><X size={14} /></button>
                    </div>
                    <PetForm onSubmit={form => addPetMutation.mutate(formToPetData(form) as any)} onCancel={() => setShowAddForm(false)} isPending={addPetMutation.isPending} />
                  </div>
                )}

                {/* Empty state */}
                {pets.length === 0 && !showAddForm ? (
                  <div className="text-center py-14 px-4">
                    <div className="flex justify-center gap-3 mb-6">
                      {['🐕','🐈','🐦'].map((e, i) => (
                        <div key={i} className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl animate-bounce"
                          style={{ background: ['linear-gradient(135deg,#431407,#7c2d12)', 'linear-gradient(135deg,#3b0764,#581c87)', 'linear-gradient(135deg,#0c2a5e,#1e3a8a)'][i], border: `1.5px solid ${['#fb923c','#c084fc','#38bdf8'][i]}55`, boxShadow: `0 0 16px ${['#fb923c','#c084fc','#38bdf8'][i]}44`, animationDelay: `${i * 0.15}s` }}>
                          {e}
                        </div>
                      ))}
                    </div>
                    <h4 className="text-xl font-black text-white mb-2">Introduce your pets!</h4>
                    <p className="text-sm mb-7 max-w-xs mx-auto" style={{ color: '#475569' }}>
                      Tell us about your pets and every visit to Petshiwu will feel made just for them.
                    </p>
                    <button onClick={() => setShowAddForm(true)}
                      className="inline-flex items-center gap-2 font-black text-sm px-8 py-3 rounded-xl transition-all hover:scale-105"
                      style={{ background: 'linear-gradient(135deg,#0f2a6e,#0284c7)', color: '#38bdf8', border: '1.5px solid #0ea5e966', boxShadow: '0 0 24px #0ea5e944' }}>
                      <PawPrint size={16} /> Create First Pet Profile
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    {pets.map(pet => (
                      <div key={pet._id}>
                        {editingPetId === pet._id ? (
                          <div className="rounded-2xl p-4" style={{ background: '#0a0f1e', border: `1.5px solid ${getSp(pet.species).neon}55`, boxShadow: `0 0 16px ${getSp(pet.species).neon}22` }}>
                            <div className="flex items-center justify-between mb-4">
                              <h4 className="font-black text-white text-sm">Edit {pet.petName}</h4>
                              <button onClick={() => setEditingPetId(null)} className="text-slate-500 hover:text-slate-300"><X size={14} /></button>
                            </div>
                            <PetForm initial={petToForm(pet)} onSubmit={form => updatePetMutation.mutate({ id: pet._id, data: formToPetData(form) })} onCancel={() => setEditingPetId(null)} isPending={updatePetMutation.isPending} isEdit />
                          </div>
                        ) : deletingPetId === pet._id ? (
                          <div className="rounded-2xl p-5 text-center" style={{ background: '#1a0010', border: '1.5px solid #f8717155', boxShadow: '0 0 16px #f8717122' }}>
                            <span className="text-4xl block mb-3">{getSp(pet.species).emoji}</span>
                            <p className="text-sm font-bold text-white mb-4">Remove <span style={{ color: '#f87171' }}>{pet.petName}</span>?</p>
                            <div className="flex gap-2">
                              <button onClick={() => deletePetMutation.mutate(pet._id)} disabled={deletePetMutation.isPending}
                                className="flex-1 py-2 rounded-xl text-sm font-black disabled:opacity-50"
                                style={{ background: '#ff000022', color: '#f87171', border: '1.5px solid #f8717155' }}>
                                {deletePetMutation.isPending ? 'Removing...' : 'Remove'}
                              </button>
                              <button onClick={() => setDeletingPetId(null)}
                                className="flex-1 py-2 rounded-xl text-sm font-bold text-slate-400 hover:text-slate-200"
                                style={{ background: '#0f172a', border: '1.5px solid #1e293b' }}>
                                Cancel
                              </button>
                            </div>
                          </div>
                        ) : (
                          <PetCard pet={pet} onEdit={() => { setEditingPetId(pet._id); setShowAddForm(false); }} onDelete={() => setDeletingPetId(pet._id)} />
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
                {!isChangingPassword && <button onClick={() => setIsChangingPassword(true)} className="text-primary-600 text-sm font-semibold hover:text-primary-700">Change Password</button>}
              </div>
              {!isChangingPassword ? (
                <div className="flex items-center gap-3 text-gray-500"><Lock size={18} /><span>••••••••</span></div>
              ) : (
                <form onSubmit={e => { e.preventDefault(); if (passwordData.newPassword !== passwordData.confirmPassword) { showToast("Passwords don't match", 'error'); return; } if (passwordData.newPassword.length < 8) { showToast('Min 8 characters', 'error'); return; } updatePasswordMutation.mutate({ currentPassword: passwordData.currentPassword, newPassword: passwordData.newPassword }); }} className="space-y-4">
                  {[['Current Password', 'currentPassword'], ['New Password', 'newPassword'], ['Confirm New Password', 'confirmPassword']].map(([label, key]) => (
                    <div key={key}><label className="block text-sm font-medium mb-1.5">{label} *</label>
                      <input type="password" required value={passwordData[key as keyof typeof passwordData]} onChange={e => setPasswordData({ ...passwordData, [key]: e.target.value })} minLength={key !== 'currentPassword' ? 8 : undefined} className={inputCls} /></div>
                  ))}
                  <p className="text-xs text-gray-500">At least 8 characters.</p>
                  <div className="flex gap-3">
                    <button type="submit" disabled={updatePasswordMutation.isPending} className="flex items-center gap-2 bg-primary-600 text-white px-6 py-2 rounded-xl font-semibold text-sm hover:bg-primary-700 disabled:opacity-50"><Lock size={14} />{updatePasswordMutation.isPending ? 'Updating...' : 'Update Password'}</button>
                    <button type="button" onClick={() => { setIsChangingPassword(false); setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' }); }} className="px-5 py-2 border-2 border-gray-200 rounded-xl text-sm font-semibold hover:bg-gray-50">Cancel</button>
                  </div>
                </form>
              )}
            </div>

            {/* Account */}
            <div className="bg-white rounded-2xl shadow-md p-6">
              <h3 className="text-lg font-bold mb-4">Account Information</h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between"><span className="text-gray-500">Account Type</span><span className="font-semibold">{user?.role === 'admin' ? 'Administrator' : 'Customer'}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Member Since</span><span className="font-semibold">{user?.createdAt ? new Date(user.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : '—'}</span></div>
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
