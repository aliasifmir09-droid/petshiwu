import { useState, useEffect, useRef, useCallback } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/stores/authStore';
import { authService } from '@/services/auth';
import { petService } from '@/services/pets';
import { Pet } from '@/types';
import { User, Mail, Phone, Lock, Save, PawPrint, Plus, Pencil, Trash2, X, ChevronDown, ChevronUp } from 'lucide-react';
import Toast from '@/components/Toast';
import { useToast } from '@/hooks/useToast';

// ─── Species config ─────────────────────────────────────────────────────────
const SP: Record<string, { label: string; shortLabel?: string; emoji: string; deepGrad: string; neon: string }> = {
  dog:           { label: 'Dog',          emoji: '🐕', deepGrad: 'linear-gradient(135deg,#4a1a06,#7a3010,#a04020)', neon: '#f97316' },
  cat:           { label: 'Cat',          emoji: '🐈', deepGrad: 'linear-gradient(135deg,#2d0845,#500e80,#7b20b0)', neon: '#c084fc' },
  bird:          { label: 'Bird',         emoji: '🐦', deepGrad: 'linear-gradient(135deg,#0a1e45,#0f3878,#1555a8)', neon: '#38bdf8' },
  fish:          { label: 'Fish',         emoji: '🐠', deepGrad: 'linear-gradient(135deg,#0a2828,#0d5050,#0d7575)', neon: '#2dd4bf' },
  reptile:       { label: 'Reptile',      emoji: '🦎', deepGrad: 'linear-gradient(135deg,#0a2010,#123c18,#1c5825)', neon: '#4ade80' },
  'small-animal':{ label: 'Small Animal', shortLabel: 'Small', emoji: '🐹', deepGrad: 'linear-gradient(135deg,#420820,#78103a,#a81850)', neon: '#f472b6' },
  other:         { label: 'Other',        emoji: '🐾', deepGrad: 'linear-gradient(135deg,#161628,#242440,#323255)', neon: '#94a3b8' },
};

const ALLERGENS = [
  { label: 'Chicken', emoji: '🍗', tip: 'One of the most common pet allergens. Causes itchy skin, ear infections & GI upset in sensitive dogs and cats.' },
  { label: 'Beef',    emoji: '🥩', tip: 'Frequent trigger for food sensitivities. Beef-free food helps reduce chronic inflammation and skin reactions.' },
  { label: 'Fish',    emoji: '🐟', tip: 'Some pets react to fish proteins with itching or digestive issues despite fish being commonly recommended.' },
  { label: 'Lamb',    emoji: '🐑', tip: 'Less common but possible. Useful to avoid when narrowing down a novel protein elimination diet.' },
  { label: 'Grain',   emoji: '🌾', tip: 'Grain-free avoids wheat, corn, rice & oats. Helpful for pets with digestive sensitivities or itchy skin flare-ups.' },
  { label: 'Wheat',   emoji: '🌾', tip: 'Wheat gluten can cause itching, rashes, or loose stools in sensitive pets. Look for "wheat-free" on labels.' },
  { label: 'Corn',    emoji: '🌽', tip: 'Used as filler in many pet foods. Can trigger itching or GI issues. Corn-free reduces filler-related reactions.' },
  { label: 'Soy',     emoji: '🫘', tip: 'Soy proteins can cause hormonal disruption and digestive issues. Better avoided in reactive or sensitive pets.' },
  { label: 'Dairy',   emoji: '🥛', tip: 'Most adult pets lack the enzymes to digest lactose — dairy causes gas, bloating, and loose stools.' },
  { label: 'Eggs',    emoji: '🥚', tip: 'Egg whites can trigger food allergies in some pets, causing skin irritation or digestive upset.' },
];

const SIZES = [
  { value: 'small',  label: 'S',  sub: '< 20 lbs' },
  { value: 'medium', label: 'M',  sub: '20–55' },
  { value: 'large',  label: 'L',  sub: '55–100' },
  { value: 'xlarge', label: 'XL', sub: '100+' },
];

function getSP(s: string) { return SP[s] || SP.other; }

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

// ─── Allergen pill with tooltip ──────────────────────────────────────────────
function AllergenPill({ label, size = 'sm' }: { label: string; size?: 'sm' | 'xs' }) {
  const [show, setShow] = useState(false);
  const found = ALLERGENS.find(a => a.label.toLowerCase() === label.toLowerCase());
  if (!found) return null;
  const isSm = size === 'sm';
  return (
    <span className="relative inline-flex"
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
      onClick={e => { e.stopPropagation(); setShow(s => !s); }}>
      <span
        className={`${isSm ? 'text-[11px] px-2 py-0.5' : 'text-[10px] px-1.5 py-0.5'} rounded-full font-bold cursor-help select-none`}
        style={{ background: 'rgba(239,68,68,0.2)', color: '#fca5a5', border: '1px solid rgba(239,68,68,0.25)', whiteSpace: 'nowrap' }}>
        {found.emoji} {found.label}
      </span>
      {show && (
        <span className="absolute z-50 bottom-full left-1/2 pointer-events-none"
          style={{ transform: 'translateX(-50%)', marginBottom: 8, width: 210 }}>
          <span className="block rounded-xl px-3 py-2.5"
            style={{ background: 'rgba(12,8,24,0.97)', border: '1px solid rgba(255,255,255,0.13)', backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)', boxShadow: '0 8px 32px rgba(0,0,0,0.6)' }}>
            <span className="block text-[11px] font-black text-white mb-1">{found.emoji} {found.label}-Free</span>
            <span className="block text-[10px] leading-relaxed" style={{ color: 'rgba(255,255,255,0.5)' }}>{found.tip}</span>
            {/* Arrow */}
            <span className="absolute left-1/2 -bottom-1.5" style={{ transform: 'translateX(-50%)', width: 0, height: 0, borderLeft: '6px solid transparent', borderRight: '6px solid transparent', borderTop: '6px solid rgba(255,255,255,0.13)' }} />
          </span>
        </span>
      )}
    </span>
  );
}

// ─── Glass style helpers ─────────────────────────────────────────────────────
const glass = {
  background: 'rgba(255,255,255,0.07)',
  backdropFilter: 'blur(20px) saturate(180%)',
  WebkitBackdropFilter: 'blur(20px) saturate(180%)',
  border: '1px solid rgba(255,255,255,0.1)',
} as React.CSSProperties;

const glassBtn = {
  background: 'rgba(255,255,255,0.08)',
  backdropFilter: 'blur(12px)',
  WebkitBackdropFilter: 'blur(12px)',
  border: '1px solid rgba(255,255,255,0.14)',
  color: 'rgba(255,255,255,0.85)',
  cursor: 'pointer',
} as React.CSSProperties;

// ─── Pet Form Wizard ─────────────────────────────────────────────────────────

interface PetFormProps {
  initial?: typeof EMPTY_FORM;
  onSubmit: (d: typeof EMPTY_FORM) => void;
  onCancel: () => void;
  isPending?: boolean;
  isEdit?: boolean;
}

function PetForm({ initial = EMPTY_FORM, onSubmit, onCancel, isPending, isEdit }: PetFormProps) {
  const [step, setStep]       = useState(1);
  const [dir, setDir]         = useState<'fwd'|'back'>('fwd');
  const [form, setForm]       = useState<typeof EMPTY_FORM>({ ...EMPTY_FORM, ...initial });
  const [nameErr, setNameErr] = useState('');
  const [isMobile, setIsMobile] = useState(() => typeof window !== 'undefined' && window.innerWidth < 640);

  useEffect(() => {
    const h = () => setIsMobile(window.innerWidth < 640);
    window.addEventListener('resize', h);
    // lock body scroll while wizard is open
    document.body.style.overflow = 'hidden';
    return () => { window.removeEventListener('resize', h); document.body.style.overflow = ''; };
  }, []);

  const sp   = form.species ? getSP(form.species) : null;
  const neon = sp?.neon ?? 'rgba(255,255,255,0.35)';

  function set<K extends keyof typeof EMPTY_FORM>(k: K, v: typeof EMPTY_FORM[K]) {
    setForm(f => ({ ...f, [k]: v }));
  }
  function next() { setDir('fwd');  setStep(s => s + 1); }
  function back() { setDir('back'); setStep(s => s - 1); }

  function pickSpecies(key: string) {
    set('species', key);
    setDir('fwd');
    setTimeout(() => setStep(2), 180);
  }

  function handleSubmit() {
    if (!form.petName.trim()) { setNameErr('Name is required'); return; }
    onSubmit(form);
  }

  // ── Shared input style ──────────────────────────────────────────────────────
  const INP = (active?: boolean): React.CSSProperties => ({
    width: '100%', background: 'rgba(255,255,255,0.05)',
    border: `1.5px solid ${active ? neon + '66' : 'rgba(255,255,255,0.08)'}`,
    borderRadius: 12, padding: '13px 16px', color: 'white', fontSize: 15,
    outline: 'none', transition: 'border 0.15s, box-shadow 0.15s',
    boxSizing: 'border-box' as const,
    boxShadow: active ? `0 0 0 3px ${neon}18` : 'none',
  });
  const LBL: React.CSSProperties = {
    display: 'block', fontSize: 10, fontWeight: 800, color: 'rgba(255,255,255,0.3)',
    textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8,
  };
  const CHIP = (on: boolean, color?: string): React.CSSProperties => ({
    flex: 1, padding: '11px 4px', borderRadius: 12, cursor: 'pointer',
    border: `1.5px solid ${on ? (color ?? neon) + '88' : 'rgba(255,255,255,0.08)'}`,
    background: on ? (color ?? neon) + '18' : 'rgba(255,255,255,0.03)',
    color: on ? (color ?? neon) : 'rgba(255,255,255,0.45)',
    fontWeight: 800, fontSize: 12, transition: 'all 0.12s ease',
  });

  // ── Step content ────────────────────────────────────────────────────────────
  const steps: Record<number, React.ReactNode> = {
    1: (
      <>
        <p style={{ fontSize: 22, fontWeight: 900, color: '#fff', letterSpacing: '-0.02em', marginBottom: 6 }}>What kind of pet?</p>
        <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.32)', marginBottom: 22 }}>Tap one to continue</p>
        <div className="grid grid-cols-2 gap-3">
          {Object.entries(SP).map(([key, s]) => {
            const sel = form.species === key;
            return (
              <button key={key} type="button" onClick={() => pickSpecies(key)}
                style={{ background: sel ? s.deepGrad : 'rgba(255,255,255,0.04)',
                  border: `1.5px solid ${sel ? s.neon + 'bb' : 'rgba(255,255,255,0.08)'}`,
                  borderRadius: 16, padding: '15px 14px', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: 12,
                  boxShadow: sel ? `0 0 28px ${s.neon}33` : 'none',
                  transform: sel ? 'scale(1.03)' : 'scale(1)',
                  transition: 'all 0.15s ease' }}>
                <span style={{ fontSize: 28, lineHeight: 1, filter: sel ? `drop-shadow(0 0 10px ${s.neon}99)` : 'none' }}>{s.emoji}</span>
                <span style={{ color: sel ? '#fff' : 'rgba(255,255,255,0.5)', fontWeight: 800, fontSize: 14, flex: 1, textAlign: 'left' }}>{s.label}</span>
                {sel && <span style={{ width: 18, height: 18, borderRadius: '50%', background: s.neon, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, color: '#000', fontWeight: 900, flexShrink: 0 }}>✓</span>}
              </button>
            );
          })}
        </div>
      </>
    ),
    2: (
      <>
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <span style={{ fontSize: 62, display: 'block', marginBottom: 10, filter: `drop-shadow(0 4px 24px ${neon}55)`, animation: 'pfw_pop 0.4s cubic-bezier(0.34,1.56,0.64,1) both' }}>{sp?.emoji ?? '🐾'}</span>
          <p style={{ fontSize: 22, fontWeight: 900, color: '#fff', letterSpacing: '-0.02em', marginBottom: 4 }}>What's their name?</p>
          <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.32)' }}>You can always edit this later</p>
        </div>
        <div style={{ marginBottom: 16 }}>
          <input type="text" placeholder="Luna, Max, Noodle..." value={form.petName}
            onChange={e => { set('petName', e.target.value); setNameErr(''); }}
            autoFocus
            style={{ ...INP(!!form.petName), textAlign: 'center', fontSize: 18, fontWeight: 700, padding: '16px',
              borderColor: nameErr ? '#ef4444' : form.petName ? neon + '66' : 'rgba(255,255,255,0.08)' }} />
          {nameErr && <p style={{ color: '#ef4444', fontSize: 11, textAlign: 'center', marginTop: 6 }}>{nameErr}</p>}
        </div>
        <div>
          <label style={LBL}>Breed <span style={{ opacity: 0.45 }}>(optional)</span></label>
          <input type="text" placeholder="Golden Retriever, Siamese..." value={form.breed}
            onChange={e => set('breed', e.target.value)} style={INP(!!form.breed)} />
        </div>
      </>
    ),
    3: (
      <>
        <p style={{ fontSize: 20, fontWeight: 900, color: '#fff', letterSpacing: '-0.02em', marginBottom: 4 }}>
          A bit more about <span style={{ color: neon }}>{form.petName || 'them'}</span>
        </p>
        <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.28)', marginBottom: 22 }}>All optional — skip anything you're not sure about</p>

        <div style={{ marginBottom: 16 }}>
          <label style={LBL}>🎂 Birthday</label>
          <input type="date" value={form.birthday} onChange={e => set('birthday', e.target.value)}
            style={{ ...INP(!!form.birthday), colorScheme: 'dark' }} />
        </div>

        <div style={{ marginBottom: 16 }}>
          <label style={LBL}>Sex</label>
          <div style={{ display: 'flex', gap: 8 }}>
            {[['male','♂ Male'],['female','♀ Female'],['unknown','Unknown']] .map(([v,l]) => (
              <button key={v} type="button" onClick={() => set('sex', form.sex === v ? '' : v as any)} style={CHIP(form.sex === v)}>{l}</button>
            ))}
          </div>
        </div>

        <div style={{ marginBottom: 16 }}>
          <label style={LBL}>Size</label>
          <div style={{ display: 'flex', gap: 8 }}>
            {SIZES.map(sz => (
              <button key={sz.value} type="button" onClick={() => set('size', form.size === sz.value ? '' : sz.value as any)}
                style={{ ...CHIP(form.size === sz.value), display: 'flex', flexDirection: 'column' as const, alignItems: 'center', gap: 3, padding: '10px 4px' }}>
                <span style={{ fontWeight: 900, fontSize: 13 }}>{sz.label}</span>
                <span style={{ color: 'rgba(255,255,255,0.25)', fontSize: 9 }}>{sz.sub}</span>
              </button>
            ))}
          </div>
        </div>

        <div>
          <label style={LBL}>Weight (lbs)</label>
          <input type="number" placeholder="e.g. 25" value={form.weight}
            onChange={e => set('weight', e.target.value)} style={INP(!!form.weight)} />
        </div>
      </>
    ),
    4: (
      <>
        <p style={{ fontSize: 20, fontWeight: 900, color: '#fff', letterSpacing: '-0.02em', marginBottom: 4 }}>Ingredients to avoid?</p>
        <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.28)', marginBottom: 20 }}>
          We'll flag matching products for <span style={{ color: neon }}>{form.petName || 'your pet'}</span>
        </p>
        <div className="grid grid-cols-3 gap-2.5">
          {ALLERGENS.map(({ label, emoji }) => {
            const k = label.toLowerCase();
            const on = form.allergies.includes(k);
            return (
              <button key={label} type="button"
                onClick={() => set('allergies', on ? form.allergies.filter(x => x!==k) : [...form.allergies, k])}
                style={{ padding: '14px 8px', borderRadius: 14, cursor: 'pointer',
                  border: `1.5px solid ${on ? 'rgba(239,68,68,0.6)' : 'rgba(255,255,255,0.07)'}`,
                  background: on ? 'linear-gradient(135deg,rgba(127,29,29,0.65),rgba(185,28,28,0.35))' : 'rgba(255,255,255,0.03)',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 7,
                  boxShadow: on ? '0 0 18px rgba(239,68,68,0.25)' : 'none',
                  transform: on ? 'scale(1.04)' : 'scale(1)', transition: 'all 0.15s ease' }}>
                <span style={{ fontSize: 26, filter: on ? 'drop-shadow(0 0 8px rgba(239,68,68,0.5))' : 'none' }}>{emoji}</span>
                <span style={{ fontSize: 10, fontWeight: 800, color: on ? '#fca5a5' : 'rgba(255,255,255,0.38)' }}>{label}</span>
              </button>
            );
          })}
        </div>
      </>
    ),
  };

  // ── Layout helpers ──────────────────────────────────────────────────────────
  const isLastStep = step === 4;
  const canAdvance = !(step === 2 && !form.petName.trim());

  return (
    <>
      <style>{`
        @keyframes pfw_in   { from { transform:translateX(28px);  opacity:0 } to { transform:translateX(0); opacity:1 } }
        @keyframes pfw_back { from { transform:translateX(-28px); opacity:0 } to { transform:translateX(0); opacity:1 } }
        @keyframes pfw_bd   { from { opacity:0 } to { opacity:1 } }
        @keyframes pfw_up   { from { transform:translateY(52px); opacity:0 } to { transform:translateY(0); opacity:1 } }
        @keyframes pfw_pop  { from { transform:scale(0.4) rotate(-8deg); opacity:0 } to { transform:scale(1) rotate(0); opacity:1 } }
      `}</style>

      {/* Backdrop */}
      <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.72)', backdropFilter:'blur(8px)', WebkitBackdropFilter:'blur(8px)', zIndex:300, animation:'pfw_bd 0.25s ease' }} onClick={onCancel} />

      {/* Centering wrapper (desktop) / bottom anchor (mobile) */}
      <div style={{ position:'fixed', inset:0, zIndex:301, display:'flex', alignItems: isMobile ? 'flex-end' : 'center', justifyContent:'center', padding: isMobile ? 0 : 16 }} onClick={e => e.stopPropagation()}>

        {/* Sheet */}
        <div style={{ width: isMobile ? '100%' : 460, maxHeight: isMobile ? '92svh' : '88vh',
          background: 'rgba(10,6,20,0.98)', display: 'flex', flexDirection: 'column', overflow: 'hidden',
          borderRadius: isMobile ? '24px 24px 0 0' : 24,
          borderTop: `2px solid ${neon}44`,
          boxShadow: '0 -8px 60px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.04)',
          animation: 'pfw_up 0.32s cubic-bezier(0.16,1,0.3,1)' }}>

          {/* Progress bar */}
          <div style={{ height: 3, background: 'rgba(255,255,255,0.06)', flexShrink: 0 }}>
            <div style={{ height: '100%', background: neon, width: `${(step/4)*100}%`, transition: 'width 0.35s ease, background 0.5s ease', borderRadius: '0 2px 2px 0' }} />
          </div>

          {/* Header */}
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'14px 20px 6px', flexShrink:0 }}>
            <div style={{ display:'flex', alignItems:'center', gap:10 }}>
              {step > 1 && (
                <button onClick={back} style={{ width:32, height:32, borderRadius:'50%', background:'rgba(255,255,255,0.06)', border:'1px solid rgba(255,255,255,0.1)', color:'rgba(255,255,255,0.55)', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', fontSize:20, lineHeight:1, paddingBottom:2 }}>‹</button>
              )}
              <span style={{ fontSize:10, fontWeight:800, color:'rgba(255,255,255,0.2)', textTransform:'uppercase', letterSpacing:'0.12em' }}>
                {isEdit ? 'Edit Pet' : 'New Pet'} &nbsp;·&nbsp; {step} / 4
              </span>
            </div>
            <button onClick={onCancel} style={{ width:32, height:32, borderRadius:'50%', background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.08)', color:'rgba(255,255,255,0.35)', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', fontSize:18 }}>×</button>
          </div>

          {/* Step content — key forces re-mount → re-animation */}
          <div key={step} style={{ flex:1, overflowY:'auto', padding:'10px 20px 8px', minHeight:0,
            animation: dir==='fwd' ? 'pfw_in 0.22s cubic-bezier(0.16,1,0.3,1) both' : 'pfw_back 0.22s cubic-bezier(0.16,1,0.3,1) both' }}>
            {steps[step]}
          </div>

          {/* Footer buttons */}
          {step > 1 && (
            <div style={{ padding:'12px 20px', paddingBottom: isMobile ? 'calc(12px + env(safe-area-inset-bottom, 0px))' : '12px', flexShrink:0, display:'flex', gap:10, borderTop:'1px solid rgba(255,255,255,0.05)' }}>
              {(step === 3 || step === 4) && (
                <button type="button" onClick={isLastStep ? handleSubmit : next}
                  style={{ flex:1, padding:'13px 0', background:'transparent', border:'1px solid rgba(255,255,255,0.08)', borderRadius:12, color:'rgba(255,255,255,0.28)', fontSize:12, fontWeight:800, cursor:'pointer', letterSpacing:'0.05em' }}>
                  Skip
                </button>
              )}
              <button type="button" onClick={isLastStep ? handleSubmit : next}
                disabled={!canAdvance || !!isPending}
                style={{ flex: (step===3||step===4) ? 3 : 1, padding:'14px 0', borderRadius:12, border:'none',
                  cursor: !canAdvance ? 'not-allowed' : 'pointer', fontWeight:900, fontSize:15,
                  background: !canAdvance ? 'rgba(255,255,255,0.07)' : (sp ? sp.neon : 'rgba(255,255,255,0.5)'),
                  color: !canAdvance ? 'rgba(255,255,255,0.2)' : '#000',
                  opacity: isPending ? 0.65 : 1, transition: 'all 0.15s ease' }}>
                {isPending ? 'Saving…' : isLastStep ? (isEdit ? '✓ Save Changes' : `Add ${form.petName || 'Pet'} 🐾`) : 'Continue →'}
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

// ─── Birthday check ──────────────────────────────────────────────────────────
function isBirthdayToday(birthday?: string): boolean {
  if (!birthday) return false;
  const today = new Date();
  const b = new Date(birthday);
  return b.getMonth() === today.getMonth() && b.getDate() === today.getDate();
}

// ─── NYC Skyline SVG ─────────────────────────────────────────────────────────
function NycSkyline({ glowColor }: { glowColor: string }) {
  return (
    <svg viewBox="0 0 120 80" preserveAspectRatio="xMidYMax meet"
      style={{ position: 'absolute', bottom: 0, left: 0, width: '100%', zIndex: 2, pointerEvents: 'none' }}>
      <circle cx="15" cy="8" r=".7" fill="rgba(255,255,255,.55)" />
      <circle cx="35" cy="5" r=".5" fill="rgba(255,255,255,.45)" />
      <circle cx="75" cy="4" r=".7" fill="rgba(255,255,255,.55)" />
      <circle cx="95" cy="9" r=".5" fill="rgba(255,255,255,.4)" />
      <circle cx="22" cy="14" r=".4" fill="rgba(255,255,255,.35)" />
      <circle cx="60" cy="7" r=".6" fill="rgba(255,255,255,.45)" />
      <rect x="0" y="52" width="7" height="28" fill="rgba(255,255,255,.17)" />
      <rect x="1" y="55" width="1.5" height="2" fill="rgba(255,200,100,.5)" />
      <rect x="9" y="44" width="9" height="36" fill="rgba(255,255,255,.2)" />
      <rect x="10" y="47" width="2" height="2" fill="rgba(255,200,100,.6)" />
      <rect x="14" y="50" width="2" height="2" fill="rgba(255,200,100,.4)" />
      <rect x="20" y="36" width="7" height="44" fill="rgba(255,255,255,.22)" />
      <rect x="21" y="39" width="2" height="2" fill="rgba(255,200,100,.55)" />
      <rect x="24" y="43" width="2" height="2" fill="rgba(255,200,100,.45)" />
      {/* Empire State Building */}
      <rect x="43" y="27" width="12" height="53" fill="rgba(255,255,255,.3)" />
      <rect x="45" y="19" width="8" height="10" fill="rgba(255,255,255,.3)" />
      <rect x="47" y="13" width="4" height="8" fill="rgba(255,255,255,.28)" />
      <line x1="49" y1="13" x2="49" y2="3" stroke="rgba(255,255,255,.5)" strokeWidth="1.3" />
      <circle cx="49" cy="3" r="1.1" fill={glowColor} opacity="0.9" />
      <rect x="44" y="29" width="2" height="2" fill="rgba(255,220,100,.7)" />
      <rect x="48" y="29" width="2" height="2" fill="rgba(255,220,100,.6)" />
      <rect x="52" y="29" width="2" height="2" fill="rgba(255,220,100,.5)" />
      <rect x="44" y="34" width="2" height="2" fill="rgba(255,220,100,.55)" />
      <rect x="52" y="34" width="2" height="2" fill="rgba(255,220,100,.6)" />
      <rect x="44" y="40" width="2" height="2" fill="rgba(255,220,100,.5)" />
      <rect x="48" y="40" width="2" height="2" fill="rgba(255,220,100,.65)" />
      <rect x="52" y="40" width="2" height="2" fill="rgba(255,220,100,.5)" />
      {/* Chrysler style */}
      <rect x="58" y="37" width="9" height="43" fill="rgba(255,255,255,.2)" />
      <rect x="68" y="29" width="9" height="51" fill="rgba(255,255,255,.22)" />
      <polygon points="68,29 77,29 72.5,21" fill="rgba(255,255,255,.25)" />
      <rect x="69" y="32" width="2" height="2" fill="rgba(255,200,100,.55)" />
      <rect x="73" y="35" width="2" height="2" fill="rgba(255,200,100,.45)" />
      <rect x="80" y="43" width="8" height="37" fill="rgba(255,255,255,.18)" />
      <rect x="90" y="47" width="9" height="33" fill="rgba(255,255,255,.15)" />
      <rect x="101" y="51" width="10" height="29" fill="rgba(255,255,255,.14)" />
      <rect x="0" y="79" width="120" height="1" fill="rgba(255,255,255,.07)" />
    </svg>
  );
}

// ─── Confetti ────────────────────────────────────────────────────────────────
const CONFETTI_COLORS = ['#f97316','#ec4899','#a855f7','#3b82f6','#22c55e','#eab308'];
function Confetti() {
  const pieces = Array.from({ length: 12 }, (_, i) => ({
    left: `${6 + i * 7.5}%`,
    color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
    dur: `${1.8 + (i * 0.17)}s`,
    delay: `${(i * 0.22) % 1.5}s`,
    isCircle: i % 3 === 2,
    isTall: i % 3 === 1,
  }));
  return (
    <div style={{ position: 'absolute', inset: 0, zIndex: 5, pointerEvents: 'none', overflow: 'hidden' }}>
      {pieces.map((p, i) => (
        <div key={i} style={{
          position: 'absolute', left: p.left,
          width: p.isTall ? 4 : 5, height: p.isTall ? 7 : (p.isCircle ? 5 : 5),
          borderRadius: p.isCircle ? '50%' : 1,
          background: p.color, opacity: 0.9,
          animation: `confettiFall ${p.dur} linear ${p.delay} infinite`,
        }} />
      ))}
    </div>
  );
}

// ─── Balloons ────────────────────────────────────────────────────────────────
function Balloons() {
  return (
    <div style={{ position: 'absolute', inset: 0, zIndex: 6, pointerEvents: 'none' }}>
      {[
        { left: 4, delay: '0s', size: 18, dur: '3.8s' },
        { left: undefined, right: 4, delay: '1.1s', size: 14, dur: '4.2s' },
        { left: 36, delay: '2.2s', size: 13, dur: '3.5s' },
      ].map((b, i) => (
        <span key={i} style={{
          position: 'absolute', bottom: 0,
          ...(b.left !== undefined ? { left: b.left } : { right: (b as any).right }),
          fontSize: b.size, lineHeight: 1,
          animation: `balloonFloat ${b.dur} ease-in-out ${b.delay} infinite`,
          filter: 'drop-shadow(0 2px 4px rgba(0,0,0,.2))',
        }}>🎈</span>
      ))}
    </div>
  );
}

// ─── Passport Pet Card ────────────────────────────────────────────────────────
function PassportPetCard({
  pet, isPrimary, onEdit, onDelete, onPhotoUpdate,
}: {
  pet: Pet;
  isPrimary?: boolean;
  onEdit: () => void;
  onDelete: () => void;
  onPhotoUpdate: (petId: string, url: string) => void;
}) {
  const [expanded, setExpanded]     = useState(false);
  const [uploading, setUploading]   = useState(false);
  const [localPhoto, setLocalPhoto] = useState<string | undefined>(pet.photo);
  const fileRef = useRef<HTMLInputElement>(null);
  const sp     = getSP(pet.species);
  const age    = petAge(pet.birthday);
  const bday   = isBirthdayToday(pet.birthday);

  // Sync if parent updates
  useEffect(() => { setLocalPhoto(pet.photo); }, [pet.photo]);

  const handlePhotoChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      // Compress to ≤800px, 0.82 quality
      const bitmap = await createImageBitmap(file);
      const canvas = document.createElement('canvas');
      const maxSide = 800;
      const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height));
      canvas.width  = Math.round(bitmap.width  * scale);
      canvas.height = Math.round(bitmap.height * scale);
      canvas.getContext('2d')!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
      const base64 = canvas.toDataURL('image/jpeg', 0.82);

      const res = await fetch(`/api/v1/users/me/pets/${pet._id}/photo`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('token')}` },
        body: JSON.stringify({ imageBase64: base64 }),
      });
      const json = await res.json();
      if (json.success) {
        setLocalPhoto(json.data.photo);
        onPhotoUpdate(pet._id, json.data.photo);
      }
    } catch { /* silent */ } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  }, [pet._id, onPhotoUpdate]);

  // Species-based colors
  const speciesBg   = {
    dog: 'linear-gradient(180deg,#0a1628 0%,#1a1208 55%,#7c2d12 100%)',
    cat: 'linear-gradient(180deg,#0c0820 0%,#1a0a2e 55%,#4a1272 100%)',
    bird: 'linear-gradient(180deg,#071520 0%,#0c1e32 55%,#1a4a72 100%)',
    fish: 'linear-gradient(180deg,#071a18 0%,#0c2e28 55%,#0d5a4a 100%)',
    reptile: 'linear-gradient(180deg,#071a07 0%,#0c2e0c 55%,#1a5a1a 100%)',
    'small-animal': 'linear-gradient(180deg,#200820 0%,#3a0a3a 55%,#7a1472 100%)',
  }[pet.species] || 'linear-gradient(180deg,#080f20 0%,#0d1a3a 55%,#1e3a8a 100%)';

  const speciesOv = {
    dog: 'linear-gradient(180deg,transparent 30%,rgba(234,88,12,.45) 100%)',
    cat: 'linear-gradient(180deg,transparent 30%,rgba(147,51,234,.4) 100%)',
    bird: 'linear-gradient(180deg,transparent 30%,rgba(14,165,233,.4) 100%)',
    fish: 'linear-gradient(180deg,transparent 30%,rgba(13,148,136,.4) 100%)',
    reptile: 'linear-gradient(180deg,transparent 30%,rgba(34,197,94,.4) 100%)',
    'small-animal': 'linear-gradient(180deg,transparent 30%,rgba(236,72,153,.4) 100%)',
  }[pet.species] || 'linear-gradient(180deg,transparent 30%,rgba(79,70,229,.35) 100%)';

  const neonGlow = sp.neon;
  const borderColor = {
    dog: 'rgba(234,88,12,.25)', cat: 'rgba(147,51,234,.25)', bird: 'rgba(14,165,233,.25)',
    fish: 'rgba(13,148,136,.25)', reptile: 'rgba(34,197,94,.25)', 'small-animal': 'rgba(236,72,153,.25)',
  }[pet.species] || 'rgba(99,102,241,.25)';

  return (
    <div style={{
      borderRadius: 16, overflow: 'visible',
      ...(bday ? {
        padding: 2,
        background: 'linear-gradient(45deg,#f97316,#ec4899,#a855f7,#3b82f6,#22c55e,#eab308,#f97316)',
        backgroundSize: '300% 300%',
        animation: 'bdayBorder 2.5s ease infinite',
        boxShadow: '0 6px 28px rgba(249,115,22,.3)',
      } : {
        border: `1.5px solid ${borderColor}`,
        boxShadow: '0 3px 14px rgba(0,0,0,.08)',
      }),
    }}>
      {/* inner wrapper keeps border-radius when birthday border is active */}
      <div style={{ display: 'flex', flexDirection: 'column', borderRadius: bday ? 14 : 16, overflow: 'hidden', background: '#fff' }}>

        {/* ── Main row ── */}
        <div style={{ display: 'flex', cursor: 'pointer', minHeight: 140 }} onClick={() => setExpanded(x => !x)}>

          {/* ── LEFT: Photo / Skyline panel ── */}
          <div style={{ width: 130, flexShrink: 0, position: 'relative', overflow: 'visible', minHeight: 140 }}>

            {/* Clipped photo area */}
            <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', borderRadius: 0 }}>
              {localPhoto ? (
                <img src={localPhoto} alt={pet.petName}
                  style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center 15%', display: 'block' }} />
              ) : (
                <>
                  <div style={{ position: 'absolute', inset: 0, background: speciesBg }} />
                  <div style={{ position: 'absolute', inset: 0, background: speciesOv }} />
                  <NycSkyline glowColor={neonGlow} />
                  <div style={{ position: 'absolute', bottom: 30, left: 0, right: 0, zIndex: 3, textAlign: 'center', fontSize: 34, lineHeight: 1, filter: `drop-shadow(0 2px 8px ${neonGlow}88)` }}>
                    {sp.emoji}
                  </div>
                  <div style={{ position: 'absolute', bottom: 10, left: 0, right: 0, zIndex: 3, textAlign: 'center', fontSize: 9, fontWeight: 800, letterSpacing: '.8px', textTransform: 'uppercase', color: 'rgba(255,255,255,.7)' }}>
                    {sp.label}
                  </div>
                </>
              )}
            </div>

            {/* ── Birthday decorations (on top of photo) ── */}
            {bday && (
              <>
                <Confetti />
                <Balloons />
                {/* Sparkles */}
                <div style={{ position: 'absolute', inset: 0, zIndex: 7, pointerEvents: 'none' }}>
                  {[{t:'60%',l:'5%',d:'0s'},{t:'75%',r:'6%',d:'.5s'},{t:'50%',l:'9%',d:'1s'},{t:'68%',r:'5%',d:'.8s'}].map((s,i)=>(
                    <span key={i} style={{ position:'absolute', top:s.t, left:(s as any).l, right:(s as any).r, fontSize:11, animation:`sparkle 1.6s ease-in-out ${s.d} infinite` }}>✨</span>
                  ))}
                </div>
                {/* Party hat — above the head */}
                <div style={{
                  position: 'absolute', top: -18, left: '50%',
                  transform: 'translateX(-52%) rotate(-13deg)',
                  fontSize: 52, zIndex: 30, lineHeight: 1,
                  filter: 'drop-shadow(0 3px 6px rgba(0,0,0,.5))',
                  animation: 'capBob 2.2s ease-in-out infinite',
                  pointerEvents: 'none',
                }}>🎉</div>
                {/* Happy Birthday neck ribbon */}
                <div style={{
                  position: 'absolute', left: 0, right: 0, bottom: 28, zIndex: 9,
                  padding: '5px 4px',
                  background: 'linear-gradient(90deg,#f97316,#ec4899,#a855f7,#3b82f6,#ec4899,#f97316)',
                  backgroundSize: '200% 100%',
                  animation: 'ribbonSlide 2s linear infinite',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
                  boxShadow: '0 2px 10px rgba(0,0,0,.4)',
                }}>
                  <span style={{ fontSize: 11 }}>🎀</span>
                  <span style={{ fontSize: 9, fontWeight: 900, color: '#fff', letterSpacing: '1.2px', textTransform: 'uppercase', textShadow: '0 1px 3px rgba(0,0,0,.5)', whiteSpace: 'nowrap' }}>
                    Happy Birthday!
                  </span>
                  <span style={{ fontSize: 11 }}>🎀</span>
                </div>
              </>
            )}

            {/* Camera badge (no photo, not birthday) */}
            {!localPhoto && !bday && (
              <div style={{ position: 'absolute', bottom: 7, right: 7, zIndex: 15, width: 22, height: 22, borderRadius: '50%', background: '#1e3a8a', border: '2px solid #fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, boxShadow: '0 1px 4px rgba(0,0,0,.3)', cursor: 'pointer' }}
                onClick={e => { e.stopPropagation(); fileRef.current?.click(); }}>
                📷
              </div>
            )}

            {/* Hover overlay — change/add photo */}
            <div className="photo-hover-overlay" style={{
              position: 'absolute', inset: 0, zIndex: 20, background: 'rgba(0,0,0,.55)',
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 5,
              opacity: 0, transition: 'opacity .2s', cursor: 'pointer',
            }} onClick={e => { e.stopPropagation(); fileRef.current?.click(); }}>
              <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'rgba(255,255,255,.2)', border: '1.5px solid rgba(255,255,255,.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14 }}>
                {uploading ? '⏳' : '📷'}
              </div>
              <span style={{ fontSize: 9, fontWeight: 700, color: '#fff', textTransform: 'uppercase', letterSpacing: '.4px' }}>
                {uploading ? 'Uploading...' : localPhoto ? 'Change Photo' : 'Add Photo'}
              </span>
            </div>

            {/* Hidden file input */}
            <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handlePhotoChange} />
          </div>

          {/* ── RIGHT: Content ── */}
          <div style={{
            flex: 1, padding: '13px 14px',
            background: bday ? 'linear-gradient(160deg,#fff9f5,#fdf4ff,#f0f9ff)' : '#fff',
            display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 4,
          }}>
            {/* Name row */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 7, flexWrap: 'wrap', marginBottom: 1 }}>
              <span style={{ fontSize: 15, fontWeight: 800, color: '#0f172a', letterSpacing: '-.3px' }}>{pet.petName}</span>
              {isPrimary && (
                <span style={{ fontSize: 9, fontWeight: 800, letterSpacing: '.5px', textTransform: 'uppercase', padding: '2px 7px', borderRadius: 5, color: '#fff', background: sp.neon }}>
                  Primary
                </span>
              )}
              {bday && (
                <span style={{ fontSize: 10, fontWeight: 800, color: '#fff', background: 'linear-gradient(90deg,#f97316,#ec4899)', padding: '3px 10px', borderRadius: 20, animation: 'chipPulse 1.5s ease-in-out infinite' }}>
                  🎂 Today!
                </span>
              )}
            </div>

            {/* Meta */}
            <div style={{ fontSize: 12, color: '#64748b', fontWeight: 500, marginBottom: 4 }}>
              {sp.label}{pet.breed ? ` · ${pet.breed}` : ''}{age ? ` · ${age}` : ''}{pet.sex && pet.sex !== 'unknown' ? ` · ${pet.sex === 'male' ? '♂' : '♀'}` : ''}
            </div>

            {/* Birthday message */}
            {bday && (
              <div style={{ fontSize: 12, color: '#9a3412', background: 'linear-gradient(135deg,#fff7ed,#fdf2f8)', border: '1px solid #fed7aa', borderRadius: 9, padding: '7px 10px', lineHeight: 1.5, fontWeight: 500, marginBottom: 4 }}>
                🎉 Happy Birthday {pet.petName}! We picked allergy-safe treats just for them.
              </div>
            )}

            {/* Allergen pills */}
            {pet.allergies && pet.allergies.length > 0 && (
              <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                {pet.allergies.slice(0, 3).map(a => (
                  <span key={a} style={{ display: 'inline-flex', alignItems: 'center', gap: 2, background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca', borderRadius: 5, fontSize: 10, fontWeight: 700, padding: '2px 6px' }}>
                    ⚠ {a}
                  </span>
                ))}
                {pet.allergies.length > 3 && (
                  <span style={{ fontSize: 10, fontWeight: 700, color: '#dc2626', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 5, padding: '2px 6px' }}>
                    +{pet.allergies.length - 3}
                  </span>
                )}
              </div>
            )}
            {(!pet.allergies || pet.allergies.length === 0) && (
              <span style={{ fontSize: 10, fontWeight: 600, color: '#16a34a', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 5, padding: '2px 8px', alignSelf: 'flex-start' }}>
                No allergens
              </span>
            )}

            {/* Expand chevron */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', marginTop: 2, color: '#94a3b8', fontSize: 11, gap: 4 }}>
              <span style={{ fontSize: 11, color: '#cbd5e1' }}>{expanded ? '▲ less' : '▼ details'}</span>
            </div>
          </div>
        </div>

        {/* ── Expanded panel ── */}
        {expanded && (
          <div style={{ padding: '14px 16px 16px', background: '#fafbfc', borderTop: '1px solid #f1f5f9' }}>
            {/* Stats grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8, marginBottom: 12 }}>
              {[
                { label: 'Birthday', val: pet.birthday ? new Date(pet.birthday).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '—' },
                { label: 'Weight', val: pet.weight ? `${pet.weight} lbs` : '—' },
                { label: 'Size', val: pet.size || '—' },
                { label: 'Sex', val: pet.sex && pet.sex !== 'unknown' ? (pet.sex === 'male' ? 'Male ♂' : 'Female ♀') : '—' },
                { label: 'Fixed', val: pet.isFixed === true ? 'Yes ✓' : pet.isFixed === false ? 'No' : '—' },
                { label: 'Allergies', val: pet.allergies?.length ? `${pet.allergies.length} item${pet.allergies.length > 1 ? 's' : ''}` : 'None' },
              ].map(({ label, val }) => (
                <div key={label} style={{ background: '#fff', border: '1px solid #f1f5f9', borderRadius: 9, padding: '8px 10px' }}>
                  <div style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.5px', color: '#94a3b8', marginBottom: 3 }}>{label}</div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a' }}>{val}</div>
                </div>
              ))}
            </div>

            {/* Full allergen list */}
            {pet.allergies && pet.allergies.length > 0 && (
              <div style={{ marginBottom: 12 }}>
                <div style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.5px', color: '#94a3b8', marginBottom: 7 }}>⚠ Allergen Alerts</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                  {pet.allergies.map(a => (
                    <div key={a} style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#fff', border: '1px solid #fee2e2', borderRadius: 8, padding: '7px 10px' }}>
                      <span style={{ fontSize: 15 }}>{ALLERGENS.find(al => al.label === a)?.emoji || '⚠'}</span>
                      <div>
                        <div style={{ fontSize: 11, fontWeight: 700, color: '#dc2626' }}>{a}</div>
                        <div style={{ fontSize: 10, color: '#94a3b8' }}>{ALLERGENS.find(al => al.label === a)?.tip || 'Check product labels carefully'}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Notes */}
            {pet.notes && (
              <div style={{ marginBottom: 12 }}>
                <div style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.5px', color: '#94a3b8', marginBottom: 6 }}>📝 Notes</div>
                <div style={{ background: '#fff', border: '1px solid #f1f5f9', borderRadius: 9, padding: '10px 12px', fontSize: 13, color: '#64748b', lineHeight: 1.5 }}>{pet.notes}</div>
              </div>
            )}

            {/* Actions */}
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={e => { e.stopPropagation(); onEdit(); }}
                style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, background: '#1e3a8a', color: '#fff', border: 'none', borderRadius: 9, padding: 10, fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
                ✏️ Edit {pet.petName}'s Profile
              </button>
              <button onClick={e => { e.stopPropagation(); onDelete(); }}
                style={{ background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca', borderRadius: 9, padding: '10px 14px', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
                🗑 Remove
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Hero Pet Card (legacy shell — replaced by PassportPetCard) ───────────────
function HeroPetCard({ pet, onEdit, onDelete }: { pet: Pet; onEdit: () => void; onDelete: () => void }) {
  const sp = getSP(pet.species);
  const age = petAge(pet.birthday);

  return (
    <div className="relative overflow-hidden transition-all duration-300 hover:scale-[1.01]"
      style={{ borderRadius: 24, height: 220, background: sp.deepGrad,
        border: '1px solid rgba(255,255,255,0.1)',
        boxShadow: `0 20px 60px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.04), inset 0 1px 0 rgba(255,255,255,0.08)` }}>

      {/* Ambient glow */}
      <div style={{ position: 'absolute', inset: 0, background: `radial-gradient(ellipse at 30% 50%, ${sp.neon}22, transparent 65%)`, pointerEvents: 'none' }} />
      {/* Noise grain */}
      <div style={{ position: 'absolute', inset: 0, opacity: 0.03, backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 256 256\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'n\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23n)\'/%3E%3C/svg%3E")', backgroundSize: '128px' }} />

      {/* Species label */}
      <div className="absolute top-4 left-5 flex items-center gap-2">
        <div className="w-2 h-2 rounded-full animate-pulse" style={{ background: sp.neon, boxShadow: `0 0 6px ${sp.neon}` }} />
        <span className="text-[10px] font-black uppercase tracking-widest" style={{ color: sp.neon }}>PRIMARY</span>
      </div>

      {/* Action buttons */}
      <div className="absolute top-3 right-3 flex gap-1.5">
        {[{ fn: onEdit, icon: <Pencil size={11} /> }, { fn: onDelete, icon: <Trash2 size={11} /> }].map(({ fn, icon }, i) => (
          <button key={i} onClick={fn}
            className="w-7 h-7 rounded-full flex items-center justify-center transition-all hover:scale-110"
            style={{ ...glassBtn, color: 'rgba(255,255,255,0.6)' }}>
            {icon}
          </button>
        ))}
      </div>

      {/* Big emoji */}
      <div className="absolute" style={{ top: 36, left: 24, fontSize: 64, lineHeight: 1, filter: `drop-shadow(0 8px 32px ${sp.neon}66)` }}>
        {sp.emoji}
      </div>

      {/* Name */}
      <div className="absolute" style={{ bottom: 68, left: 24, fontSize: 34, fontWeight: 900, color: 'white', letterSpacing: '-0.02em', textShadow: '0 2px 20px rgba(0,0,0,0.5)' }}>
        {pet.petName}
      </div>

      {/* Glass data strip */}
      <div className="absolute bottom-0 left-0 right-0 flex items-center gap-3 flex-wrap px-5 py-3"
        style={{ backdropFilter: 'blur(20px) saturate(200%)', WebkitBackdropFilter: 'blur(20px) saturate(200%)', background: 'rgba(0,0,0,0.45)', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
        <span className="text-xs font-bold" style={{ color: sp.neon }}>{SP[pet.species]?.label || 'Other'}{pet.breed ? ` · ${pet.breed}` : ''}</span>
        {age && <span className="text-xs" style={{ color: 'rgba(255,255,255,0.5)' }}>🎂 {age}</span>}
        {pet.sex && pet.sex !== 'unknown' && <span className="text-xs" style={{ color: 'rgba(255,255,255,0.5)' }}>{pet.sex === 'male' ? '♂' : '♀'}</span>}
        {pet.weight && <span className="text-xs" style={{ color: 'rgba(255,255,255,0.5)' }}>{pet.weight} lbs</span>}
        {pet.allergies && pet.allergies.length > 0 && (
          <span className="flex items-center gap-1.5 flex-wrap">
            {pet.allergies.slice(0, 3).map(a => <AllergenPill key={a} label={a} size="sm" />)}
            {pet.allergies.length > 3 && (
              <span className="text-xs font-bold px-2 py-0.5 rounded-full"
                style={{ background: 'rgba(239,68,68,0.2)', color: '#fca5a5', border: '1px solid rgba(239,68,68,0.25)' }}>
                +{pet.allergies.length - 3}
              </span>
            )}
          </span>
        )}
      </div>
    </div>
  );
}

// ─── Compact Pet Card ────────────────────────────────────────────────────────
function CompactPetCard({ pet, onEdit, onDelete }: { pet: Pet; onEdit: () => void; onDelete: () => void }) {
  const sp = getSP(pet.species);
  const age = petAge(pet.birthday);

  return (
    <div className="relative overflow-hidden transition-all duration-300 hover:scale-[1.02]"
      style={{ ...glass, borderRadius: 20, padding: '16px', minHeight: 140, cursor: 'default' }}>

      {/* Species accent bar */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: `linear-gradient(90deg, ${sp.neon}, transparent)` }} />
      {/* Subtle glow */}
      <div style={{ position: 'absolute', top: -20, right: -20, width: 80, height: 80, borderRadius: '50%', background: `radial-gradient(circle, ${sp.neon}18, transparent)`, pointerEvents: 'none' }} />

      {/* Action buttons */}
      <div className="absolute top-4 right-3 flex gap-1">
        {[{ fn: onEdit, icon: <Pencil size={10} /> }, { fn: onDelete, icon: <Trash2 size={10} /> }].map(({ fn, icon }, i) => (
          <button key={i} onClick={fn}
            className="w-6 h-6 rounded-full flex items-center justify-center transition-all hover:scale-110"
            style={{ ...glassBtn, color: 'rgba(255,255,255,0.4)' }}>
            {icon}
          </button>
        ))}
      </div>

      <div className="flex items-start gap-3 mt-1">
        <span style={{ fontSize: 32, filter: `drop-shadow(0 2px 12px ${sp.neon}55)` }}>{sp.emoji}</span>
        <div className="min-w-0">
          <div className="font-black text-white text-sm truncate">{pet.petName}</div>
          <div className="text-xs font-semibold truncate" style={{ color: sp.neon }}>{SP[pet.species]?.label || 'Other'}</div>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap gap-1.5">
        {age && <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold" style={{ background: 'rgba(255,255,255,0.07)', color: 'rgba(255,255,255,0.5)' }}>🎂 {age}</span>}
        {pet.breed && <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold truncate max-w-[80px]" style={{ background: 'rgba(255,255,255,0.07)', color: 'rgba(255,255,255,0.4)' }}>{pet.breed}</span>}
        {pet.allergies && pet.allergies.length > 0 && (
          <>
            {pet.allergies.slice(0, 2).map(a => <AllergenPill key={a} label={a} size="xs" />)}
            {pet.allergies.length > 2 && (
              <span className="text-[10px] px-1.5 py-0.5 rounded-full font-bold" style={{ background: 'rgba(239,68,68,0.15)', color: '#fca5a5' }}>+{pet.allergies.length - 2}</span>
            )}
          </>
        )}
      </div>
    </div>
  );
}

// ─── Add CTA Tile ────────────────────────────────────────────────────────────
function AddCTATile({ onClick }: { onClick: () => void }) {
  return (
    <button onClick={onClick}
      className="w-full flex flex-col items-center justify-center gap-3 transition-all duration-200 hover:scale-[1.02] group"
      style={{ borderRadius: 20, minHeight: 140, background: 'rgba(255,255,255,0.02)', border: '1.5px dashed rgba(255,255,255,0.12)', cursor: 'pointer' }}>
      <div className="w-10 h-10 rounded-full flex items-center justify-center transition-all group-hover:scale-110"
        style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)' }}>
        <Plus size={18} style={{ color: 'rgba(255,255,255,0.4)' }} />
      </div>
      <span className="text-xs font-black uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.25)' }}>Add Pet</span>
    </button>
  );
}

// ─── Stats Tile ──────────────────────────────────────────────────────────────
function StatsTile({ pets }: { pets: Pet[] }) {
  const totalAllergens = [...new Set(pets.flatMap(p => p.allergies || []))].length;
  const species = [...new Set(pets.map(p => p.species))];

  return (
    <div style={{ ...glass, borderRadius: 20, padding: '18px', minHeight: 140, position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', bottom: -16, right: -16, fontSize: 52, opacity: 0.04 }}>🐾</div>
      <p className="text-[9px] font-black uppercase tracking-widest mb-3" style={{ color: 'rgba(255,255,255,0.3)' }}>Pet Family</p>
      <div className="flex items-baseline gap-1.5 mb-1">
        <span style={{ fontSize: 30, fontWeight: 900, color: 'white', letterSpacing: '-0.02em' }}>{pets.length}</span>
        <span className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>pet{pets.length !== 1 ? 's' : ''}</span>
      </div>
      <div className="flex gap-1 flex-wrap mt-2">
        {species.slice(0, 4).map(s => (
          <span key={s} style={{ fontSize: 16, filter: `drop-shadow(0 1px 4px ${getSP(s).neon}66)` }}>{getSP(s).emoji}</span>
        ))}
      </div>
      {totalAllergens > 0 && (
        <p className="mt-2 text-[10px] font-bold" style={{ color: '#fca5a5' }}>⚠ {totalAllergens} allergen{totalAllergens !== 1 ? 's' : ''} tracked</p>
      )}
    </div>
  );
}

// ─── Empty State ─────────────────────────────────────────────────────────────
function EmptyState({ onAdd }: { onAdd: () => void }) {
  const trio = ['dog', 'cat', 'bird'] as const;
  return (
    <div className="flex flex-col items-center text-center py-16 px-6">
      {/* Stacked glowing tiles */}
      <div className="relative mb-8" style={{ width: 130, height: 72 }}>
        {trio.map((s, i) => (
          <div key={s} className="absolute" style={{
            left: i * 34, top: 0, width: 72, height: 72, borderRadius: 20,
            background: SP[s].deepGrad,
            border: '1px solid rgba(255,255,255,0.12)',
            boxShadow: `0 8px 32px rgba(0,0,0,0.5), 0 0 20px ${SP[s].neon}33`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 32, zIndex: i,
          }}>{SP[s].emoji}</div>
        ))}
      </div>

      <h4 style={{ fontSize: 22, fontWeight: 900, color: 'white', letterSpacing: '-0.02em', marginBottom: 8 }}>
        Build your pet family
      </h4>
      <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.35)', marginBottom: 28, maxWidth: 260, lineHeight: 1.6 }}>
        Add your pets once. We handle the rest — personalized picks, birthday alerts, allergen warnings.
      </p>
      <button onClick={onAdd}
        className="flex items-center gap-2 font-black text-sm px-8 py-3 rounded-2xl transition-all hover:scale-105"
        style={{ ...glassBtn, border: '1px solid rgba(255,255,255,0.18)', color: 'white', fontSize: 13 }}>
        <Plus size={15} /> Add Your First Pet
      </button>
    </div>
  );
}

// ─── Main Profile Page ────────────────────────────────────────────────────────
const Profile = () => {
  const { user, setUser } = useAuthStore();
  const queryClient = useQueryClient();
  const { toast, showToast, hideToast } = useToast();

  const [isEditingProfile, setIsEditingProfile]     = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [profileData, setProfileData] = useState({ firstName: user?.firstName || '', lastName: user?.lastName || '', email: user?.email || '', phone: user?.phone || '' });
  const [passwordData, setPasswordData] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [showAddForm,   setShowAddForm]   = useState(false);
  const [editingPetId,  setEditingPetId]  = useState<string | null>(null);
  const [deletingPetId, setDeletingPetId] = useState<string | null>(null);

  const { data: pets = [] } = useQuery({ queryKey: ['myPets'], queryFn: petService.getMyPets, enabled: !!user });

  const addPetMutation = useMutation({
    mutationFn: petService.addPet,
    onSuccess: p => { queryClient.invalidateQueries({ queryKey: ['myPets'] }); setShowAddForm(false); showToast(`${p.petName} added to your family 🐾`, 'success'); },
    onError: (e: any) => showToast(e.response?.data?.message || 'Failed to add', 'error'),
  });
  const updatePetMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => petService.updatePet(id, data),
    onSuccess: p => { queryClient.invalidateQueries({ queryKey: ['myPets'] }); setEditingPetId(null); showToast(`${p.petName} updated`, 'success'); },
    onError: (e: any) => showToast(e.response?.data?.message || 'Failed', 'error'),
  });
  const deletePetMutation = useMutation({
    mutationFn: petService.deletePet,
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['myPets'] }); setDeletingPetId(null); showToast('Removed', 'success'); },
    onError: (e: any) => showToast(e.response?.data?.message || 'Failed', 'error'),
  });
  const updateProfileMutation = useMutation({
    mutationFn: authService.updateProfile,
    onSuccess: u => { setUser(u); setIsEditingProfile(false); showToast('Profile updated', 'success'); },
    onError: (e: any) => showToast(e.response?.data?.message || 'Update failed', 'error'),
  });
  const updatePasswordMutation = useMutation({
    mutationFn: ({ currentPassword, newPassword }: { currentPassword: string; newPassword: string }) => authService.updatePassword(currentPassword, newPassword),
    onSuccess: () => { setIsChangingPassword(false); setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' }); showToast('Password updated', 'success'); },
    onError: (e: any) => showToast(e.response?.data?.message || 'Failed', 'error'),
  });

  const petToForm = (pet: Pet) => ({
    petName: pet.petName, species: pet.species, breed: pet.breed || '', birthday: pet.birthday || '',
    sex: pet.sex || '', isFixed: pet.isFixed || false, weight: pet.weight ? String(pet.weight) : '',
    size: pet.size || '', allergies: pet.allergies || [], notes: pet.notes || '',
  });
  const toData = (f: typeof EMPTY_FORM) => ({
    petName: f.petName, species: f.species,
    breed: f.breed || undefined, birthday: f.birthday || undefined,
    sex: (f.sex as any) || undefined, isFixed: f.isFixed || undefined,
    weight: f.weight ? Number(f.weight) : undefined, size: (f.size as any) || undefined,
    allergies: f.allergies.length ? f.allergies : undefined, notes: f.notes || undefined,
  });

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
                <span className="px-3 py-1 bg-primary-100 text-primary-700 rounded-full text-xs font-bold">
                  {user?.role === 'admin' ? 'Administrator' : 'Customer'}
                </span>
              </div>
              <div className="mt-5 pt-5 border-t space-y-2.5">
                <div className="flex items-center gap-2.5 text-sm text-gray-600"><Mail size={14} className="text-gray-400 shrink-0" />{user?.email}</div>
                {user?.phone && <div className="flex items-center gap-2.5 text-sm text-gray-600"><Phone size={14} className="text-gray-400 shrink-0" />{user.phone}</div>}
                {pets.length > 0 && <div className="flex items-center gap-2.5 text-sm text-gray-600"><PawPrint size={14} className="text-gray-400 shrink-0" />{pets.length} pet{pets.length !== 1 ? 's' : ''}</div>}
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
                    <button type="button" onClick={() => setIsEditingProfile(false)} className="px-5 py-2 border-2 border-gray-200 rounded-xl text-sm font-semibold hover:bg-gray-50">Cancel</button>
                  </div>
                </form>
              )}
            </div>

            {/* ── PET FAMILY ─────────────────────────────────────────────── */}
            <>
              {/* Birthday animation keyframes + photo hover */}
              <style>{`
                @keyframes confettiFall {
                  0%   { transform: translateY(-10px) rotate(0deg);   opacity: 1; }
                  100% { transform: translateY(165px) rotate(720deg); opacity: 0; }
                }
                @keyframes balloonFloat {
                  0%, 100% { transform: translateY(0); }
                  50%      { transform: translateY(-20px); }
                }
                @keyframes sparkle {
                  0%, 100% { opacity: 0; transform: scale(.7); }
                  50%      { opacity: 1; transform: scale(1.2); }
                }
                @keyframes bdayBorder {
                  0%, 100% { background-position: 0% 50%; }
                  50%      { background-position: 100% 50%; }
                }
                @keyframes ribbonSlide {
                  0%   { background-position: 0% center; }
                  100% { background-position: 200% center; }
                }
                @keyframes capBob {
                  0%, 100% { transform: translateX(-52%) rotate(-13deg) translateY(0); }
                  50%      { transform: translateX(-52%) rotate(-13deg) translateY(-5px); }
                }
                @keyframes chipPulse {
                  0%, 100% { opacity: 1; transform: scale(1); }
                  50%      { opacity: .85; transform: scale(1.04); }
                }
                .photo-hover-overlay:hover { opacity: 1 !important; }
              `}</style>

              {/* Pet wizard overlays — outside card so fixed positioning works on iOS */}
              {editingPetId && (
                <PetForm
                  initial={petToForm(pets.find(p => p._id === editingPetId)!)}
                  onSubmit={f => updatePetMutation.mutate({ id: editingPetId, data: toData(f) })}
                  onCancel={() => setEditingPetId(null)}
                  isPending={updatePetMutation.isPending}
                  isEdit
                />
              )}
              {showAddForm && !editingPetId && (
                <PetForm
                  onSubmit={f => addPetMutation.mutate(toData(f) as any)}
                  onCancel={() => setShowAddForm(false)}
                  isPending={addPetMutation.isPending}
                />
              )}

              {/* Light card */}
              <div style={{ borderRadius: 20, background: '#fff', boxShadow: '0 2px 16px rgba(15,23,42,.07)', border: '1.5px solid #f1f5f9' }}>

                {/* Header */}
                <div style={{ padding: '18px 20px 14px', borderBottom: '1.5px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <PawPrint size={17} style={{ color: '#1e3a8a' }} />
                    <span style={{ fontSize: 16, fontWeight: 900, color: '#0f172a', letterSpacing: '-.3px' }}>My Pet Family</span>
                    {pets.length > 0 && (
                      <span style={{ fontSize: 10, fontWeight: 800, color: '#64748b', background: '#f1f5f9', border: '1px solid #e2e8f0', borderRadius: 20, padding: '2px 9px' }}>
                        {pets.length}
                      </span>
                    )}
                  </div>
                  {pets.length > 0 && pets.length < 10 && (
                    <button onClick={() => { setShowAddForm(true); setEditingPetId(null); }}
                      style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#1e3a8a', color: '#fff', border: 'none', borderRadius: 10, padding: '8px 14px', fontSize: 12, fontWeight: 800, cursor: 'pointer' }}>
                      <Plus size={12} /> Add Pet
                    </button>
                  )}
                </div>

                {/* Subheader */}
                <div style={{ padding: '8px 20px', borderBottom: '1px solid #f8fafc', background: '#fafbfc' }}>
                  <p style={{ fontSize: 11, color: '#94a3b8', fontWeight: 500, margin: 0 }}>
                    Personalized picks, birthday alerts &amp; allergen warnings — for every pet.
                  </p>
                </div>

                {/* Empty state */}
                {pets.length === 0 && (
                  <EmptyState onAdd={() => setShowAddForm(true)} />
                )}

                {/* Pet list */}
                {pets.length > 0 && (
                  <div style={{ padding: '14px 14px 6px', display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {pets.map((pet, idx) => (
                      deletingPetId === pet._id ? (
                        <div key={pet._id} style={{ borderRadius: 14, background: '#fef2f2', border: '1.5px solid #fecaca', padding: '16px 18px', display: 'flex', alignItems: 'center', gap: 14 }}>
                          <span style={{ fontSize: 28 }}>{getSP(pet.species).emoji}</span>
                          <div style={{ flex: 1 }}>
                            <p style={{ fontWeight: 700, fontSize: 14, color: '#0f172a', margin: '0 0 3px' }}>Remove <span style={{ color: '#dc2626' }}>{pet.petName}</span>?</p>
                            <p style={{ fontSize: 11, color: '#94a3b8', margin: 0 }}>This can't be undone.</p>
                          </div>
                          <div style={{ display: 'flex', gap: 8 }}>
                            <button onClick={() => deletePetMutation.mutate(pet._id)} disabled={deletePetMutation.isPending}
                              style={{ background: '#dc2626', color: '#fff', border: 'none', borderRadius: 9, padding: '8px 16px', fontSize: 12, fontWeight: 800, cursor: 'pointer', opacity: deletePetMutation.isPending ? .5 : 1 }}>
                              {deletePetMutation.isPending ? '...' : 'Remove'}
                            </button>
                            <button onClick={() => setDeletingPetId(null)}
                              style={{ background: '#fff', color: '#64748b', border: '1.5px solid #e2e8f0', borderRadius: 9, padding: '8px 16px', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
                              Keep
                            </button>
                          </div>
                        </div>
                      ) : (
                        <PassportPetCard key={pet._id} pet={pet} isPrimary={idx === 0}
                          onEdit={() => { setEditingPetId(pet._id); setShowAddForm(false); }}
                          onDelete={() => setDeletingPetId(pet._id)}
                          onPhotoUpdate={() => queryClient.invalidateQueries({ queryKey: ['myPets'] })}
                        />
                      )
                    ))}

                    {/* Add another row */}
                    {pets.length < 10 && (
                      <button onClick={() => { setShowAddForm(true); setEditingPetId(null); }}
                        style={{ width: '100%', padding: '13px', borderRadius: 14, border: '2px dashed #e2e8f0', background: 'transparent', color: '#94a3b8', fontSize: 13, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 2, boxSizing: 'border-box' }}>
                        <Plus size={15} style={{ color: '#cbd5e1' }} /> Add another pet
                      </button>
                    )}
                  </div>
                )}

                {/* Footer stat */}
                {pets.length > 0 && (
                  <div style={{ padding: '10px 20px 14px', marginTop: 8, borderTop: '1px solid #f8fafc', display: 'flex', gap: 20, flexWrap: 'wrap' }}>
                    <span style={{ fontSize: 11, color: '#94a3b8', fontWeight: 600 }}>
                      🐾 {pets.length} pet{pets.length !== 1 ? 's' : ''} registered
                    </span>
                    {[...new Set(pets.flatMap(p => p.allergies || []))].length > 0 && (
                      <span style={{ fontSize: 11, color: '#94a3b8', fontWeight: 600 }}>
                        ⚠ {[...new Set(pets.flatMap(p => p.allergies || []))].length} allergen{[...new Set(pets.flatMap(p => p.allergies || []))].length !== 1 ? 's' : ''} tracked
                      </span>
                    )}
                    {pets.some(p => isBirthdayToday(p.birthday)) && (
                      <span style={{ fontSize: 11, color: '#9a3412', fontWeight: 700 }}>🎂 Birthday today!</span>
                    )}
                  </div>
                )}
              </div>
            </>

            {/* Password */}
            <div className="bg-white rounded-2xl shadow-md p-6">
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-lg font-bold">Password &amp; Security</h3>
                {!isChangingPassword && <button onClick={() => setIsChangingPassword(true)} className="text-primary-600 text-sm font-semibold hover:text-primary-700">Change Password</button>}
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
                    <div key={key}><label className="block text-sm font-medium mb-1.5">{label} *</label>
                      <input type="password" required value={passwordData[key as keyof typeof passwordData]}
                        onChange={e => setPasswordData({ ...passwordData, [key]: e.target.value })}
                        minLength={key !== 'currentPassword' ? 8 : undefined} className={inputCls} /></div>
                  ))}
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

            {/* Account info */}
            <div className="bg-white rounded-2xl shadow-md p-6">
              <h3 className="text-lg font-bold mb-4">Account Information</h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between"><span className="text-gray-500">Account Type</span><span className="font-semibold">{user?.role === 'admin' ? 'Administrator' : 'Customer'}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Member Since</span>
                  <span className="font-semibold">{user?.createdAt ? new Date(user.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : '—'}</span></div>
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
