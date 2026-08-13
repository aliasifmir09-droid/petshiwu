import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';

export const DIGITAL_CAT_FRAMES = [
  '/digital-cat-run-1.webp',
  '/digital-cat-run-2.webp',
  '/digital-cat-run-3.webp',
] as const;

function useRunFrame(active: boolean, ms = 120) {
  const [frame, setFrame] = useState(0);
  useEffect(() => {
    if (!active) return;
    let id = 0;
    const start = () => {
      window.clearInterval(id);
      id = window.setInterval(() => {
        setFrame((prev) => (prev + 1) % DIGITAL_CAT_FRAMES.length);
      }, ms);
    };
    const onVis = () => {
      if (document.hidden) window.clearInterval(id);
      else start();
    };
    start();
    document.addEventListener('visibilitychange', onVis);
    return () => {
      window.clearInterval(id);
      document.removeEventListener('visibilitychange', onVis);
    };
  }, [active, ms]);
  return DIGITAL_CAT_FRAMES[frame];
}

function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const sync = () => setReduced(mq.matches);
    sync();
    mq.addEventListener('change', sync);
    return () => mq.removeEventListener('change', sync);
  }, []);
  return reduced;
}

/** Homepage HD theater — the digital cat runs on a hologram track. */
export const DigitalCatStage = () => {
  const reduced = usePrefersReducedMotion();
  const runSrc = useRunFrame(!reduced, 110);

  return (
    <section className="container mx-auto px-4 lg:px-8 mt-6" aria-label="Digital cat">
      <div className="relative overflow-hidden rounded-3xl border border-cyan-400/25 bg-[#030712] shadow-[0_0_80px_rgba(34,211,238,0.18)]">
        <div
          className="pointer-events-none absolute inset-0 opacity-30"
          style={{
            backgroundImage:
              'linear-gradient(rgba(34,211,238,.14) 1px, transparent 1px), linear-gradient(90deg, rgba(34,211,238,.14) 1px, transparent 1px)',
            backgroundSize: '28px 28px',
          }}
        />
        <div className="pointer-events-none absolute -left-20 top-0 h-64 w-64 rounded-full bg-cyan-400/20 blur-3xl" />
        <div className="pointer-events-none absolute -right-10 bottom-0 h-72 w-72 rounded-full bg-fuchsia-500/20 blur-3xl" />

        <div className="relative grid md:grid-cols-[0.9fr_1.2fr] gap-2 items-center">
          <div className="relative px-6 pt-8 pb-4 md:py-10 md:pl-10 md:pr-4 text-center md:text-left z-10">
            <p className="text-[11px] font-black uppercase tracking-[0.32em] text-cyan-300">Live · Animated · HD</p>
            <h2 className="mt-2 text-3xl sm:text-4xl font-black text-white leading-tight">
              A digital cat that runs our site.
            </h2>
            <p className="mt-3 text-cyan-100/80 text-sm sm:text-base max-w-md mx-auto md:mx-0">
              High-definition hologram. Always in motion. Tap it to shop cats.
            </p>
            <Link
              to="/cat"
              className="mt-5 inline-flex items-center justify-center rounded-full bg-cyan-400 px-6 py-3 font-black text-slate-950 hover:bg-cyan-300 transition-colors"
            >
              Shop cat supplies
            </Link>
          </div>

          <div className="relative h-[280px] sm:h-[340px] md:h-[380px]">
            <div className="absolute right-4 top-6 md:right-10 md:top-8 w-36 sm:w-44 rounded-2xl overflow-hidden border border-cyan-300/30 shadow-[0_0_40px_rgba(34,211,238,0.35)] z-10">
              <img
                src="/digital-cat-hero.webp"
                alt="Petshiwu digital cat"
                width={800}
                height={800}
                className="w-full h-full object-cover ps-dcat-scan"
              />
            </div>

            <div className="absolute left-0 right-0 bottom-6 h-28 overflow-hidden">
              <div className="absolute left-[8%] right-[8%] bottom-5 h-px bg-gradient-to-r from-transparent via-cyan-300 to-transparent shadow-[0_0_18px_#22d3ee]" />
              <img
                src={runSrc}
                alt=""
                width={960}
                height={540}
                className={`absolute bottom-0 h-[150px] sm:h-[190px] w-auto max-w-none object-contain drop-shadow-[0_0_24px_rgba(34,211,238,0.65)] ${
                  reduced ? 'left-1/2 -translate-x-1/2' : 'ps-dcat-sprint'
                }`}
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

const HIDE_RUNNER_ON = ['/checkout', '/cart', '/pay', '/login', '/register'];

/** Site-wide running digital cat. Hidden on checkout so it never blocks payment. */
export const DigitalCatRunner = () => {
  const reduced = usePrefersReducedMotion();
  const location = useLocation();
  const [ready, setReady] = useState(false);
  const runSrc = useRunFrame(ready && !reduced, 110);
  const hiddenPage = HIDE_RUNNER_ON.some((path) => location.pathname.startsWith(path));

  useEffect(() => {
    const boot = window.setTimeout(() => setReady(true), 800);
    return () => window.clearTimeout(boot);
  }, []);

  if (reduced || !ready || hiddenPage) return null;

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-16 lg:bottom-4 z-30 overflow-hidden h-28" aria-hidden="true">
      <Link
        to="/cat"
        className="pointer-events-auto ps-dcat-sprint-site absolute bottom-0"
        aria-label="Digital cat — shop cat supplies"
      >
        <img
          src={runSrc}
          alt=""
          width={960}
          height={540}
          className="h-24 w-auto max-w-none object-contain mix-blend-screen drop-shadow-[0_0_18px_rgba(34,211,238,0.8)]"
        />
      </Link>
    </div>
  );
};

export default DigitalCatStage;
