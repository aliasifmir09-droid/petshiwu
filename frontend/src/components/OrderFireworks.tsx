import { useEffect, useRef, useState } from 'react';

interface OrderFireworksProps {
  active: boolean;
  onDone?: () => void;
}

interface Spark {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  max: number;
  color: string;
  size: number;
  kind: 'rocket' | 'burst';
}

const COLORS = ['#1E3A8A', '#F59E0B', '#F43F5E', '#38BDF8', '#FFFFFF', '#FB7185', '#F97316', '#34D399', '#A78BFA'];
const SHOW_MS = 7200;
const FADE_MS = 900;
const CONFETTI = [
  '#F43F5E', '#F59E0B', '#38BDF8', '#34D399', '#A78BFA', '#FB7185', '#FFFFFF', '#1E3A8A'
];

const PetFamily = () => (
  <svg
    viewBox="0 0 920 360"
    className="mx-auto h-auto w-[min(98vw,80rem)] drop-shadow-[0_28px_60px_rgba(15,23,42,0.45)]"
    role="img"
    aria-label="Celebrating pet family"
  >
    <ellipse cx="460" cy="332" rx="300" ry="22" fill="#1E3A8A" opacity="0.14" />

    {/* Dog */}
    <g className="order-cele-bounce" style={{ transformOrigin: '210px 280px', animationDelay: '0s' }}>
      <ellipse cx="210" cy="268" rx="78" ry="56" fill="#D97706" />
      <ellipse cx="210" cy="254" rx="48" ry="36" fill="#FBBF24" />
      <circle cx="210" cy="178" r="52" fill="#F59E0B" />
      <ellipse cx="160" cy="158" rx="22" ry="34" fill="#B45309" />
      <ellipse cx="260" cy="158" rx="22" ry="34" fill="#B45309" />
      <circle cx="194" cy="172" r="8" fill="#1C1917" />
      <circle cx="226" cy="172" r="8" fill="#1C1917" />
      <circle cx="196" cy="170" r="2.4" fill="#fff" />
      <circle cx="228" cy="170" r="2.4" fill="#fff" />
      <ellipse cx="210" cy="194" rx="11" ry="8" fill="#1C1917" />
      <path d="M194 208c10 12 22 12 32 0" fill="none" stroke="#1C1917" strokeWidth="4" strokeLinecap="round" />
      <circle cx="268" cy="286" r="18" fill="#FBBF24" className="order-cele-wag" style={{ transformOrigin: '268px 286px' }} />
      <rect x="196" y="118" width="28" height="22" rx="5" fill="#1E3A8A" />
      <polygon points="210,96 198,122 222,122" fill="#F43F5E" />
    </g>

    {/* Cat */}
    <g className="order-cele-bounce" style={{ transformOrigin: '400px 276px', animationDelay: '0.14s' }}>
      <ellipse cx="400" cy="262" rx="62" ry="50" fill="#FB7185" />
      <circle cx="400" cy="172" r="46" fill="#FDA4AF" />
      <polygon points="362,146 352,104 390,136" fill="#FB7185" />
      <polygon points="438,146 448,104 410,136" fill="#FB7185" />
      <polygon points="366,142 358,114 386,132" fill="#FECDD3" />
      <polygon points="434,142 442,114 414,132" fill="#FECDD3" />
      <ellipse cx="384" cy="168" rx="7" ry="11" fill="#1C1917" />
      <ellipse cx="416" cy="168" rx="7" ry="11" fill="#1C1917" />
      <circle cx="400" cy="188" r="7" fill="#F43F5E" />
      <path d="M372 190h22M406 190h22" stroke="#F43F5E" strokeWidth="2.5" />
      <path d="M386 204c8 10 20 10 28 0" fill="none" stroke="#9F1239" strokeWidth="3.2" strokeLinecap="round" />
      <path
        d="M454 232c26-30 40-10 30 16"
        fill="none"
        stroke="#FB7185"
        strokeWidth="10"
        strokeLinecap="round"
        className="order-cele-tail"
      />
      <rect x="386" y="118" width="28" height="20" rx="5" fill="#1E3A8A" />
      <polygon points="400,96 388,122 412,122" fill="#F59E0B" />
    </g>

    {/* Puppy */}
    <g className="order-cele-bounce" style={{ transformOrigin: '560px 292px', animationDelay: '0.26s' }}>
      <ellipse cx="560" cy="286" rx="48" ry="36" fill="#FDE68A" />
      <circle cx="560" cy="224" r="34" fill="#FCD34D" />
      <ellipse cx="528" cy="218" rx="16" ry="22" fill="#B45309" />
      <ellipse cx="592" cy="218" rx="16" ry="22" fill="#B45309" />
      <circle cx="548" cy="222" r="6" fill="#1C1917" />
      <circle cx="572" cy="222" r="6" fill="#1C1917" />
      <circle cx="550" cy="220" r="1.8" fill="#fff" />
      <ellipse cx="560" cy="236" rx="8" ry="6" fill="#1C1917" />
      <path d="M548 246c8 8 16 8 24 0" fill="none" stroke="#1C1917" strokeWidth="3" strokeLinecap="round" />
      <circle cx="522" cy="298" r="13" fill="#FBBF24" className="order-cele-wag" style={{ transformOrigin: '522px 298px', animationDelay: '0.12s' }} />
      <rect x="546" y="184" width="24" height="16" rx="4" fill="#1E3A8A" />
      <polygon points="558,164 548,188 568,188" fill="#38BDF8" />
    </g>

    {/* Bunny */}
    <g className="order-cele-bounce" style={{ transformOrigin: '710px 294px', animationDelay: '0.4s' }}>
      <ellipse cx="710" cy="292" rx="40" ry="32" fill="#E7E5E4" />
      <circle cx="710" cy="234" r="30" fill="#F5F5F4" />
      <ellipse cx="690" cy="168" rx="12" ry="42" fill="#E7E5E4" className="order-cele-ear" style={{ transformOrigin: '690px 200px' }} />
      <ellipse cx="730" cy="168" rx="12" ry="42" fill="#E7E5E4" className="order-cele-ear" style={{ transformOrigin: '730px 200px', animationDelay: '0.2s' }} />
      <ellipse cx="690" cy="172" rx="6" ry="28" fill="#FECDD3" />
      <ellipse cx="730" cy="172" rx="6" ry="28" fill="#FECDD3" />
      <circle cx="700" cy="232" r="5" fill="#1C1917" />
      <circle cx="720" cy="232" r="5" fill="#1C1917" />
      <ellipse cx="710" cy="244" rx="7" ry="5" fill="#FB7185" />
      <path d="M704 252c4 6 12 6 16 0" fill="none" stroke="#A8A29E" strokeWidth="2.5" strokeLinecap="round" />
      <circle cx="742" cy="304" r="11" fill="#D6D3D1" className="order-cele-wag" style={{ transformOrigin: '742px 304px', animationDelay: '0.2s' }} />
      <rect x="698" y="198" width="22" height="14" rx="4" fill="#1E3A8A" />
      <polygon points="709,180 700,202 718,202" fill="#34D399" />
    </g>

    {/* Hearts + yay bursts */}
    <g fill="#F43F5E" className="order-cele-hearts">
      <path d="M148 92c0-10 8-18 18-18 6 0 12 4 15 10 3-6 9-10 15-10 10 0 18 8 18 18 0 20-33 36-33 36S148 112 148 92z" />
      <path d="M470 48c0-9 7-16 16-16 5 0 10 3 13 8 3-5 8-8 13-8 9 0 16 7 16 16 0 18-29 32-29 32S470 66 470 48z" />
      <path d="M780 88c0-8 6-14 14-14 5 0 9 3 12 8 3-5 7-8 12-8 8 0 14 6 14 14 0 16-26 28-26 28S780 104 780 88z" />
    </g>
    <g className="order-cele-yay" fontFamily="ui-rounded, system-ui, sans-serif" fontWeight="900">
      <text x="92" y="210" fontSize="28" fill="#F59E0B" transform="rotate(-12 92 210)">YAY!</text>
      <text x="790" y="160" fontSize="26" fill="#38BDF8" transform="rotate(10 790 160)">YAY!</text>
    </g>
  </svg>
);

const OrderFireworks = ({ active, onDone }: OrderFireworksProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [visible, setVisible] = useState(active);
  const [fading, setFading] = useState(false);
  const finishedRef = useRef(false);
  const clickableAtRef = useRef(Number.POSITIVE_INFINITY);
  const onDoneRef = useRef(onDone);
  onDoneRef.current = onDone;

  useEffect(() => {
    if (active) {
      finishedRef.current = false;
      clickableAtRef.current = Date.now() + 1800;
      setVisible(true);
      setFading(false);
    }
  }, [active]);

  useEffect(() => {
    if (!active || !visible) return;

    const reduceMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    const canvas = canvasRef.current;
    const sparks: Spark[] = [];
    let frame = 0;
    let running = true;
    let raf = 0;

    const finish = () => {
      if (finishedRef.current) return;
      finishedRef.current = true;
      running = false;
      cancelAnimationFrame(raf);
      setVisible(false);
      setFading(false);
      onDoneRef.current?.();
    };

    const fadeTimer = window.setTimeout(() => setFading(true), SHOW_MS - FADE_MS);
    const timer = window.setTimeout(finish, SHOW_MS);

    if (reduceMotion || !canvas) {
      return () => {
        running = false;
        window.clearTimeout(timer);
        window.clearTimeout(fadeTimer);
      };
    }

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      return () => {
        window.clearTimeout(timer);
        window.clearTimeout(fadeTimer);
      };
    }

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.floor(window.innerWidth * dpr);
      canvas.height = Math.floor(window.innerHeight * dpr);
      canvas.style.width = '100%';
      canvas.style.height = '100%';
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener('resize', resize);

    const launchRocket = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      sparks.push({
        x: w * (0.06 + Math.random() * 0.88),
        y: h + 12,
        vx: (Math.random() - 0.5) * 3.6,
        vy: -(12 + Math.random() * 8),
        life: 0,
        max: 34 + Math.random() * 24,
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
        size: 4.6,
        kind: 'rocket'
      });
    };

    const explode = (spark: Spark) => {
      const count = 110 + Math.floor(Math.random() * 50);
      for (let i = 0; i < count; i++) {
        const angle = (Math.PI * 2 * i) / count + Math.random() * 0.22;
        const speed = 2 + Math.random() * 8.2;
        sparks.push({
          x: spark.x,
          y: spark.y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          life: 0,
          max: 52 + Math.random() * 34,
          color: i % 5 === 0 ? '#F59E0B' : COLORS[Math.floor(Math.random() * COLORS.length)],
          size: 2.4 + Math.random() * 3.8,
          kind: 'burst'
        });
      }
    };

    for (let i = 0; i < 6; i++) launchRocket();

    const tick = () => {
      if (!running) return;
      frame += 1;
      const w = window.innerWidth;
      const h = window.innerHeight;
      ctx.clearRect(0, 0, w, h);

      if (frame % 7 === 0 && frame < 180) launchRocket();

      for (let i = sparks.length - 1; i >= 0; i--) {
        const spark = sparks[i];
        spark.life += 1;
        spark.x += spark.vx;
        spark.y += spark.vy;
        spark.vy += spark.kind === 'rocket' ? 0.15 : 0.055;
        spark.vx *= 0.994;

        if (spark.kind === 'rocket' && (spark.life > spark.max || spark.vy >= -1)) {
          explode(spark);
          sparks.splice(i, 1);
          continue;
        }
        if (spark.kind === 'burst' && spark.life > spark.max) {
          sparks.splice(i, 1);
          continue;
        }

        const fade = 1 - spark.life / spark.max;
        ctx.globalAlpha = Math.max(0, fade);
        ctx.fillStyle = spark.color;
        ctx.beginPath();
        ctx.arc(spark.x, spark.y, spark.size, 0, Math.PI * 2);
        ctx.fill();
        if (spark.kind === 'rocket') {
          ctx.globalAlpha = fade * 0.55;
          ctx.fillRect(spark.x - 1.6, spark.y + 8, 3.2, 22);
        }
      }

      ctx.globalAlpha = 1;
      raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);

    return () => {
      running = false;
      window.clearTimeout(timer);
      window.clearTimeout(fadeTimer);
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
    };
  }, [active, visible]);

  const dismissNow = () => {
    if (Date.now() < clickableAtRef.current) return;
    if (finishedRef.current || fading) {
      if (!finishedRef.current) {
        finishedRef.current = true;
        setVisible(false);
        onDoneRef.current?.();
      }
      return;
    }
    setFading(true);
    window.setTimeout(() => {
      if (finishedRef.current) return;
      finishedRef.current = true;
      setVisible(false);
      onDoneRef.current?.();
    }, 480);
  };

  if (!visible) return null;

  return (
    <div
      className={`fixed inset-0 z-[200] flex items-center justify-center px-3 transition-opacity duration-700 ${fading ? 'opacity-0' : 'opacity-100'}`}
      role="status"
      aria-live="polite"
    >
      <style>{`
        @keyframes orderCeleBounce { 0%,100% { transform: translateY(0) rotate(0) } 50% { transform: translateY(-36px) rotate(-3deg) } }
        @keyframes orderCeleWag { 0%,100% { transform: rotate(-22deg) } 50% { transform: rotate(32deg) } }
        @keyframes orderCeleTail { 0%,100% { transform: rotate(-10deg) } 50% { transform: rotate(18deg) } }
        @keyframes orderCeleEar { 0%,100% { transform: rotate(-6deg) } 50% { transform: rotate(10deg) } }
        @keyframes orderCeleHearts { 0% { transform: translateY(10px) scale(.85); opacity: .15 } 45% { opacity: 1 } 100% { transform: translateY(-36px) scale(1.1); opacity: 0 } }
        @keyframes orderCeleYay { 0%,100% { transform: scale(.9); opacity: .7 } 50% { transform: scale(1.18); opacity: 1 } }
        @keyframes orderCelePop { 0% { transform: scale(.62); opacity: 0 } 16% { transform: scale(1.08); opacity: 1 } 100% { transform: scale(1); opacity: 1 } }
        @keyframes orderCeleConfetti {
          0% { transform: translateY(-8vh) rotate(0deg); opacity: 1 }
          100% { transform: translateY(108vh) rotate(640deg); opacity: .15 }
        }
        .order-cele-bounce { animation: orderCeleBounce 1.05s ease-in-out infinite; }
        .order-cele-wag { animation: orderCeleWag .42s ease-in-out infinite; }
        .order-cele-tail { transform-origin: 454px 232px; animation: orderCeleTail .65s ease-in-out infinite; }
        .order-cele-ear { animation: orderCeleEar .8s ease-in-out infinite; }
        .order-cele-hearts { animation: orderCeleHearts 1.7s ease-in-out infinite; }
        .order-cele-yay { animation: orderCeleYay .7s ease-in-out infinite; }
        .order-cele-stage { animation: orderCelePop .75s cubic-bezier(.2,1.45,.28,1) both; }
        .order-cele-confetti {
          position: absolute;
          top: -12px;
          width: 10px;
          height: 18px;
          border-radius: 2px;
          animation: orderCeleConfetti 2.6s linear infinite;
          pointer-events: none;
        }
        @media (prefers-reduced-motion: reduce) {
          .order-cele-bounce, .order-cele-wag, .order-cele-tail, .order-cele-ear,
          .order-cele-hearts, .order-cele-yay, .order-cele-stage, .order-cele-confetti { animation: none; }
        }
      `}</style>
      <div className="absolute inset-0 bg-[#0b1224]/70" />
      <canvas ref={canvasRef} className="absolute inset-0 h-full w-full pointer-events-none" />
      {CONFETTI.concat(CONFETTI, CONFETTI, CONFETTI).map((color, i) => (
        <span
          key={i}
          className="order-cele-confetti"
          style={{
            left: `${(i * 3.1) % 100}%`,
            background: color,
            animationDelay: `${(i % 12) * 0.12}s`,
            animationDuration: `${2.2 + (i % 5) * 0.28}s`,
            width: `${8 + (i % 4) * 3}px`,
            height: `${14 + (i % 3) * 6}px`,
            transform: `rotate(${(i * 27) % 180}deg)`
          }}
        />
      ))}
      <div className="order-cele-stage relative z-10 w-full max-w-5xl text-center">
        <PetFamily />
        <p className="mt-1 text-base font-black uppercase tracking-[0.38em] text-amber-400 sm:text-lg">It&apos;s done</p>
        <p className="mt-2 text-5xl font-black tracking-tight text-white drop-shadow-[0_8px_24px_rgba(15,23,42,0.65)] sm:text-7xl">
          Your order is placed
        </p>
        <p className="mx-auto mt-4 max-w-2xl text-lg font-semibold text-white/85 sm:text-2xl">
          Your pet family is celebrating with you.
        </p>
        <button
          type="button"
          className="mt-6 rounded-full bg-white/15 px-5 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-white/80 ring-1 ring-white/30 hover:bg-white/25"
          onClick={(e) => {
            e.stopPropagation();
            dismissNow();
          }}
        >
          Close
        </button>
      </div>
    </div>
  );
};

export default OrderFireworks;
