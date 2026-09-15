import { Link } from 'react-router-dom';
import { Clock, Heart, Lock, Sparkles } from 'lucide-react';
import {
  ORDERING_PAUSED,
  ORDERING_PAUSED_BODY,
  ORDERING_PAUSED_EYEBROW,
  ORDERING_PAUSED_HEADLINE,
  ORDERING_PAUSED_SHORT,
} from '@/config/ordering';

interface OrdersHoldNoticeProps {
  variant?: 'hero' | 'compact';
}

const OrdersHoldNotice = ({ variant = 'hero' }: OrdersHoldNoticeProps) => {
  if (!ORDERING_PAUSED) return null;

  if (variant === 'compact') {
    return (
      <div className="flex items-start gap-3 rounded-2xl border border-amber-200/80 bg-gradient-to-r from-amber-50 to-white px-4 py-3 shadow-sm">
        <span className="mt-0.5 flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-[#1E3A8A] text-amber-300">
          <Lock size={16} />
        </span>
        <p className="text-sm leading-relaxed text-stone-700">
          <span className="font-bold text-[#1E3A8A]">{ORDERING_PAUSED_HEADLINE}. </span>
          {ORDERING_PAUSED_SHORT}
        </p>
      </div>
    );
  }

  return (
    <section
      role="status"
      aria-live="polite"
      className="relative overflow-hidden rounded-[28px] border border-[#1E3A8A]/10 bg-[radial-gradient(circle_at_top_left,_#fff8e8,_#ffffff_46%,_#eef3ff_100%)] p-6 sm:p-8 shadow-[0_28px_70px_-36px_rgba(30,58,138,0.55)]"
    >
      <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-amber-200/40 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-16 left-10 h-32 w-32 rounded-full bg-blue-200/30 blur-3xl" />

      <p className="mb-3 inline-flex items-center gap-2 rounded-full bg-[#1E3A8A] px-3 py-1 text-[11px] font-bold uppercase tracking-[0.22em] text-amber-200">
        <Sparkles size={12} /> {ORDERING_PAUSED_EYEBROW}
      </p>
      <h2 className="max-w-xl font-black tracking-tight text-[#1E3A8A] text-3xl sm:text-4xl">
        {ORDERING_PAUSED_HEADLINE}
      </h2>
      <p className="mt-3 max-w-2xl text-[15px] leading-relaxed text-stone-600">
        {ORDERING_PAUSED_BODY}
      </p>

      <ul className="mt-6 grid gap-3 sm:grid-cols-3">
        {[
          { icon: Heart, label: 'Keep browsing', text: 'Add favorites now. Your cart stays on this device.' },
          { icon: Clock, label: 'Same-day NYC', text: 'Queens packing · all five boroughs when we open.' },
          { icon: Lock, label: 'Nothing charged', text: 'PayPal, Apple Pay, and cards stay locked until then.' },
        ].map(({ icon: Icon, label, text }) => (
          <li key={label} className="rounded-2xl bg-white/80 px-4 py-3 ring-1 ring-stone-200/80">
            <p className="flex items-center gap-2 text-sm font-bold text-stone-900">
              <Icon size={15} className="text-[#1E3A8A]" /> {label}
            </p>
            <p className="mt-1 text-xs leading-relaxed text-stone-500">{text}</p>
          </li>
        ))}
      </ul>

      <div className="mt-6 flex flex-wrap gap-3">
        <Link
          to="/products"
          className="inline-flex items-center justify-center rounded-full bg-[#1E3A8A] px-6 py-3 text-sm font-bold text-white shadow-lg shadow-blue-900/20 hover:bg-[#16307a]"
        >
          Keep shopping
        </Link>
        <Link
          to="/"
          className="inline-flex items-center justify-center rounded-full bg-white px-6 py-3 text-sm font-bold text-[#1E3A8A] ring-1 ring-[#1E3A8A]/20 hover:bg-blue-50"
        >
          Back to home
        </Link>
      </div>
    </section>
  );
};

export default OrdersHoldNotice;
