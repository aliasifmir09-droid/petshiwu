import { Link } from 'react-router-dom';
import { ScanLine, ArrowRight } from 'lucide-react';

const NeuralPortal = () => {
  return (
    <section className="container mx-auto px-4 lg:px-8 mt-6">
      <Link
        to="/neural"
        className="group relative block overflow-hidden rounded-3xl border border-cyan-400/30 bg-[#050816] shadow-[0_0_60px_rgba(34,211,238,0.15)]"
      >
        <div className="pointer-events-none absolute inset-0 opacity-40" style={{
          backgroundImage: 'linear-gradient(rgba(34,211,238,.12) 1px, transparent 1px), linear-gradient(90deg, rgba(34,211,238,.12) 1px, transparent 1px)',
          backgroundSize: '22px 22px',
        }} />
        <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-fuchsia-500/25 blur-3xl group-hover:bg-fuchsia-400/35 transition-colors" />
        <div className="relative flex flex-col md:flex-row items-center gap-6 px-6 py-8 sm:px-10">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-cyan-400 text-slate-950 shadow-[0_0_30px_rgba(34,211,238,0.55)]">
            <ScanLine size={28} />
          </div>
          <div className="flex-1 text-center md:text-left">
            <p className="text-[11px] font-black uppercase tracking-[0.28em] text-cyan-300">New · Petshiwu Neural</p>
            <h2 className="mt-1 text-2xl sm:text-4xl font-black text-white leading-tight">
              Scan your pet. Generate their Twin.
            </h2>
            <p className="mt-2 text-cyan-100/75 text-sm sm:text-base max-w-2xl">
              Computer vision reads breed, life stage, and likely needs from one photo — then builds a live product protocol. Nothing else in NYC pet retail does this.
            </p>
          </div>
          <span className="inline-flex shrink-0 items-center gap-2 rounded-full bg-cyan-400 px-6 py-3 font-black text-slate-950 group-hover:bg-cyan-300 transition-colors">
            Launch Neural Scan <ArrowRight size={16} />
          </span>
        </div>
      </Link>
    </section>
  );
};

export default NeuralPortal;
