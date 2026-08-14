import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Camera,
  ImageIcon,
  Loader2,
  RotateCcw,
  Sparkles,
  ShieldAlert,
  Cpu,
  ScanLine,
} from 'lucide-react';
import SEO from '@/components/SEO';
import ProductCard from '@/components/ProductCard';
import api from '@/services/api';
import { compressImageFile, fileToDataUrl } from '@/utils/compressImage';
import { Product } from '@/types';

interface NeuralTwin {
  subject: 'pet' | 'product' | 'unknown';
  species: string;
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

const SCAN_STEPS = [
  'Locking photon matrix…',
  'Isolating subject contour…',
  'Running morphometric pass…',
  'Matching breed constellation…',
  'Synthesizing care protocol…',
];

const NeuralScan = () => {
  const cameraRef = useRef<HTMLInputElement>(null);
  const galleryRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);
  const [step, setStep] = useState(0);
  const [twin, setTwin] = useState<NeuralTwin | null>(null);
  const [kit, setKit] = useState<Product[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(8);

  useEffect(() => {
    if (!scanning) return;
    const id = window.setInterval(() => {
      setStep((prev) => (prev + 1) % SCAN_STEPS.length);
      setProgress((prev) => Math.min(94, prev + 11));
    }, 700);
    return () => window.clearInterval(id);
  }, [scanning]);

  const reset = () => {
    setPreview(null);
    setTwin(null);
    setKit([]);
    setError(null);
    setScanning(false);
    setStep(0);
    setProgress(8);
  };

  const runScan = async (file: File) => {
    setError(null);
    setTwin(null);
    setKit([]);
    setScanning(true);
    setStep(0);
    setProgress(12);
    try {
      const compressed = await compressImageFile(file);
      const dataUrl = await fileToDataUrl(compressed);
      setPreview(dataUrl);
      const res = await api.post('/products/neural-scan', {
        image: dataUrl,
        mimeType: 'image/jpeg',
      });
      setProgress(100);
      if (!res.data?.twin) {
        setError(res.data?.message || 'Could not lock onto a pet in this photo.');
        return;
      }
      setTwin(res.data.twin);
      setKit(res.data.data || []);
    } catch (err: any) {
      if (err?.response?.status === 503) {
        setError('Neural Scan is warming up on this server. Try again in a moment, or use Visual Search in the meantime.');
      } else if (err?.response?.status === 413) {
        setError('That photo is still too large. Try a closer crop.');
      } else {
        setError(err?.message || 'Scan interrupted. Please try another photo.');
      }
    } finally {
      setScanning(false);
    }
  };

  const onFile = (file?: File | null) => {
    if (!file) return;
    void runScan(file);
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#030712] text-cyan-50">
      <SEO
        title="Neural Twin Scan | Petshiwu"
        description="Scan your pet’s photo. Petshiwu Neural builds a live biometric twin — breed, life stage, calorie protocol — and matches a same-day product kit from 10,000+ SKUs."
        url="/neural"
        noindex={true}
      />
      <style>{`
        @keyframes neural-scan {
          0% { top: 8%; opacity: .2; }
          50% { opacity: 1; }
          100% { top: 88%; opacity: .2; }
        }
        @keyframes neural-pulse {
          0%, 100% { opacity: .35; }
          50% { opacity: .85; }
        }
        .neural-grid {
          background-image:
            linear-gradient(rgba(34,211,238,.07) 1px, transparent 1px),
            linear-gradient(90deg, rgba(34,211,238,.07) 1px, transparent 1px);
          background-size: 28px 28px;
        }
      `}</style>

      <div className="pointer-events-none absolute inset-0 neural-grid opacity-60" />
      <div className="pointer-events-none absolute -top-32 left-1/2 h-96 w-96 -translate-x-1/2 rounded-full bg-cyan-500/20 blur-3xl" />
      <div className="pointer-events-none absolute bottom-0 right-0 h-80 w-80 rounded-full bg-fuchsia-600/20 blur-3xl" />

      <div className="relative container mx-auto px-4 lg:px-8 py-10 md:py-14">
        <p className="inline-flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.28em] text-cyan-300">
          <Cpu size={14} /> Petshiwu Neural · v1.0
        </p>
        <h1 className="mt-3 max-w-3xl text-4xl md:text-6xl font-black leading-[0.95] text-white">
          Scan your pet.<br />
          <span className="bg-gradient-to-r from-cyan-300 via-white to-fuchsia-300 bg-clip-text text-transparent">
            Generate their Twin.
          </span>
        </h1>
        <p className="mt-4 max-w-xl text-cyan-100/70 text-base md:text-lg">
          One photo. Computer vision reads species, breed constellation, life stage, and likely needs — then builds a shopping protocol from our live NYC catalog.
        </p>

        <div className="mt-10 grid lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] gap-8 items-start">
          <div className="relative rounded-3xl border border-cyan-400/25 bg-black/40 p-4 md:p-5 shadow-[0_0_80px_rgba(34,211,238,0.12)]">
            <div className="relative aspect-[4/5] md:aspect-[5/4] overflow-hidden rounded-2xl bg-slate-950">
              {preview ? (
                <img src={preview} alt="Pet scan subject" className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full flex-col items-center justify-center gap-3 text-cyan-200/70 px-6 text-center">
                  <ScanLine size={42} className="text-cyan-300" />
                  <p className="font-semibold">Drop a photo or open the camera</p>
                  <p className="text-xs text-cyan-200/50">Face-on, good light, one pet. Not a medical diagnosis.</p>
                </div>
              )}
              {scanning && (
                <>
                  <div className="absolute inset-0 bg-cyan-500/10 mix-blend-screen" />
                  <div
                    className="absolute left-4 right-4 h-0.5 bg-gradient-to-r from-transparent via-cyan-300 to-transparent shadow-[0_0_20px_#22d3ee]"
                    style={{ animation: 'neural-scan 1.4s linear infinite' }}
                  />
                  <div className="absolute inset-4 border border-cyan-300/40 rounded-xl" />
                  <div className="absolute left-6 top-6 text-[10px] font-mono tracking-widest text-cyan-200" style={{ animation: 'neural-pulse 1.2s ease-in-out infinite' }}>
                    LIVE · MORPH LOCK
                  </div>
                </>
              )}
            </div>

            <div className="mt-4 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => cameraRef.current?.click()}
                disabled={scanning}
                className="inline-flex items-center gap-2 rounded-full bg-cyan-400 px-5 py-2.5 font-black text-slate-950 hover:bg-cyan-300 disabled:opacity-60"
              >
                {scanning ? <Loader2 size={16} className="animate-spin" /> : <Camera size={16} />}
                {scanning ? 'Scanning…' : 'Open camera'}
              </button>
              <button
                type="button"
                onClick={() => galleryRef.current?.click()}
                disabled={scanning}
                className="inline-flex items-center gap-2 rounded-full border border-cyan-400/40 px-5 py-2.5 font-bold text-cyan-100 hover:bg-cyan-400/10 disabled:opacity-60"
              >
                <ImageIcon size={16} /> Upload photo
              </button>
              {(preview || twin) && (
                <button
                  type="button"
                  onClick={reset}
                  className="inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-semibold text-cyan-200/70 hover:text-white"
                >
                  <RotateCcw size={14} /> Reset
                </button>
              )}
              <input ref={cameraRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={(e) => onFile(e.target.files?.[0])} />
              <input ref={galleryRef} type="file" accept="image/*" className="hidden" onChange={(e) => onFile(e.target.files?.[0])} />
            </div>

            {scanning && (
              <div className="mt-5">
                <div className="mb-2 flex justify-between text-[11px] font-mono uppercase tracking-widest text-cyan-300">
                  <span>{SCAN_STEPS[step]}</span>
                  <span>{progress}%</span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-cyan-950">
                  <div className="h-full bg-gradient-to-r from-cyan-400 to-fuchsia-400 transition-all duration-500" style={{ width: `${progress}%` }} />
                </div>
              </div>
            )}
            {error && (
              <p className="mt-4 rounded-xl border border-amber-400/30 bg-amber-400/10 px-4 py-3 text-sm text-amber-100">
                {error}
              </p>
            )}
          </div>

          <div>
            {!twin ? (
              <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
                <h2 className="text-xl font-black text-white flex items-center gap-2">
                  <Sparkles size={18} className="text-fuchsia-300" /> What the Twin reveals
                </h2>
                <ul className="mt-4 space-y-3 text-sm text-cyan-100/75">
                  <li>• Species + likely breed constellation with confidence</li>
                  <li>• Life stage, size class, coat, estimated mass</li>
                  <li>• Daily calorie protocol (dogs & cats)</li>
                  <li>• Breed-typical watch-outs — not a diagnosis</li>
                  <li>• A live kit pulled from 10,000+ in-stock SKUs</li>
                </ul>
                <p className="mt-6 text-xs text-cyan-200/50 leading-relaxed">
                  Neural Twin is a shopping intelligence layer. It does not replace a veterinarian. For symptoms, use the{' '}
                  <Link to="/symptom-checker" className="underline">symptom checker</Link>.
                </p>
              </div>
            ) : (
              <div className="rounded-3xl border border-cyan-300/30 bg-gradient-to-b from-cyan-500/10 to-transparent p-6">
                <p className="text-[10px] font-black uppercase tracking-[0.25em] text-fuchsia-300">Twin locked</p>
                <h2 className="mt-1 text-3xl font-black text-white">
                  {twin.breed}
                </h2>
                <p className="text-cyan-100/80 mt-2">{twin.summary}</p>

                <div className="mt-5 grid grid-cols-2 gap-3">
                  {[
                    ['Species', twin.species],
                    ['Stage', twin.lifeStage],
                    ['Size', twin.sizeClass],
                    ['Coat', twin.coat],
                    ['Mass', twin.estimatedWeightLbs ? `${twin.estimatedWeightLbs} lb` : '—'],
                    ['Calories', twin.dailyCalories ? `${twin.dailyCalories} kcal/d` : '—'],
                  ].map(([label, value]) => (
                    <div key={label} className="rounded-xl border border-white/10 bg-black/30 px-3 py-2">
                      <p className="text-[10px] uppercase tracking-widest text-cyan-300/70">{label}</p>
                      <p className="font-bold capitalize text-white">{value}</p>
                    </div>
                  ))}
                </div>

                <div className="mt-4">
                  <p className="text-[10px] uppercase tracking-widest text-cyan-300/70 mb-1">Match confidence</p>
                  <div className="h-2 rounded-full bg-slate-800 overflow-hidden">
                    <div className="h-full bg-cyan-400" style={{ width: `${twin.breedConfidence}%` }} />
                  </div>
                  <p className="text-xs text-cyan-200 mt-1 font-mono">{twin.breedConfidence}%</p>
                </div>

                {twin.healthWatch.length > 0 && (
                  <div className="mt-5">
                    <p className="text-xs font-bold uppercase tracking-widest text-amber-200 flex items-center gap-1">
                      <ShieldAlert size={14} /> Watch-outs
                    </p>
                    <ul className="mt-2 space-y-1 text-sm text-cyan-100/80">
                      {twin.healthWatch.map((item) => <li key={item}>• {item}</li>)}
                    </ul>
                  </div>
                )}
                {twin.careFocus.length > 0 && (
                  <div className="mt-4">
                    <p className="text-xs font-bold uppercase tracking-widest text-cyan-200">Care protocol</p>
                    <ul className="mt-2 space-y-1 text-sm text-cyan-100/80">
                      {twin.careFocus.map((item) => <li key={item}>• {item}</li>)}
                    </ul>
                  </div>
                )}

                {twin.petType && (
                  <Link
                    to={`/products?petType=${encodeURIComponent(twin.petType)}`}
                    className="mt-6 inline-flex rounded-full bg-white px-5 py-2.5 text-sm font-black text-slate-950 hover:bg-cyan-200"
                  >
                    Shop this Twin’s aisle →
                  </Link>
                )}
              </div>
            )}
          </div>
        </div>

        {kit.length > 0 && (
          <section className="mt-14">
            <h2 className="text-2xl md:text-3xl font-black text-white">Protocol kit — live from inventory</h2>
            <p className="text-cyan-100/60 mt-1 mb-6 text-sm">Matched to this Twin. Same-day in NYC if you order before cutoff.</p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {kit.map((product, index) => (
                <ProductCard key={product._id} product={product} index={index} />
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
};

export default NeuralScan;
