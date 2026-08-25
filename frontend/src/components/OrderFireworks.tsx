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

const COLORS = ['#1E3A8A', '#F59E0B', '#F43F5E', '#38BDF8', '#FFFFFF', '#FB7185', '#F97316'];
const SHOW_MS = 4800;

const OrderFireworks = ({ active, onDone }: OrderFireworksProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [visible, setVisible] = useState(active);
  const onDoneRef = useRef(onDone);
  onDoneRef.current = onDone;

  useEffect(() => {
    if (active) setVisible(true);
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
      if (!running) return;
      running = false;
      cancelAnimationFrame(raf);
      setVisible(false);
      onDoneRef.current?.();
    };

    const timer = window.setTimeout(finish, SHOW_MS);
    if (reduceMotion || !canvas) {
      return () => {
        running = false;
        window.clearTimeout(timer);
      };
    }

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      return () => window.clearTimeout(timer);
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
        x: w * (0.12 + Math.random() * 0.76),
        y: h + 8,
        vx: (Math.random() - 0.5) * 2.4,
        vy: -(9.2 + Math.random() * 5.4),
        life: 0,
        max: 42 + Math.random() * 18,
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
        size: 3,
        kind: 'rocket'
      });
    };

    const explode = (spark: Spark) => {
      const count = 56 + Math.floor(Math.random() * 28);
      for (let i = 0; i < count; i++) {
        const angle = (Math.PI * 2 * i) / count + Math.random() * 0.2;
        const speed = 1.4 + Math.random() * 5.2;
        sparks.push({
          x: spark.x,
          y: spark.y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          life: 0,
          max: 38 + Math.random() * 28,
          color: i % 4 === 0 ? '#F59E0B' : COLORS[Math.floor(Math.random() * COLORS.length)],
          size: 1.6 + Math.random() * 2.4,
          kind: 'burst'
        });
      }
    };

    launchRocket();

    const tick = () => {
      if (!running) return;
      frame += 1;
      const w = window.innerWidth;
      const h = window.innerHeight;
      ctx.clearRect(0, 0, w, h);

      if (frame % 14 === 0 && frame < 90) launchRocket();

      for (let i = sparks.length - 1; i >= 0; i--) {
        const spark = sparks[i];
        spark.life += 1;
        spark.x += spark.vx;
        spark.y += spark.vy;
        spark.vy += spark.kind === 'rocket' ? 0.12 : 0.045;
        spark.vx *= 0.995;

        if (spark.kind === 'rocket' && (spark.life > spark.max || spark.vy >= -1.2)) {
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
          ctx.globalAlpha = fade * 0.45;
          ctx.fillRect(spark.x - 1, spark.y + 6, 2, 14);
        }
      }

      ctx.globalAlpha = 1;
      raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);

    return () => {
      running = false;
      window.clearTimeout(timer);
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
    };
  }, [active, visible]);

  if (!active && !visible) return null;

  return (
    <div className="fixed inset-0 z-[90] pointer-events-none" role="status" aria-live="polite">
      <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" aria-hidden="true" />
      <div className="absolute inset-0 flex items-center justify-center px-6">
        <div className="max-w-md rounded-[2rem] bg-[#1E3A8A]/92 px-8 py-7 text-center text-white shadow-[0_30px_80px_-20px_rgba(30,58,138,0.85)] ring-1 ring-white/20 backdrop-blur-md">
          <p className="text-xs font-black uppercase tracking-[0.28em] text-amber-300">It&apos;s done</p>
          <p className="mt-2 text-3xl font-black tracking-tight sm:text-4xl">Your order is placed</p>
          <p className="mt-2 text-sm text-blue-100">We&apos;re packing it in Queens. You can close this — you&apos;re all set.</p>
        </div>
      </div>
    </div>
  );
};

export default OrderFireworks;
