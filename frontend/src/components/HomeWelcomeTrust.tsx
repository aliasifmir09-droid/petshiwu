import { Link } from 'react-router-dom';
import { HeadphonesIcon, RotateCcw, ShieldCheck, Tag } from 'lucide-react';
import { FIRST_ORDER_CODE, FIRST_ORDER_COPY } from '@/config/publicPromos';
import { CONTACT_PHONE } from '@/config/constants';

const CARDS = [
  {
    icon: Tag,
    title: FIRST_ORDER_CODE,
    text: `${FIRST_ORDER_COPY} on your first order. No code hunt — enter it at checkout.`,
    to: '/products',
    label: 'Shop the offer',
  },
  {
    icon: ShieldCheck,
    title: 'No autoship. Ever.',
    text: 'We never enroll you or charge in the background. You confirm every order.',
    to: '/our-promise',
    label: 'Read our promise',
  },
  {
    icon: RotateCcw,
    title: '365-day returns',
    text: 'Unused items come back easy. PayPal or card. Call us any hour.',
    to: '/contact',
    label: 'Talk to a person',
  },
];

const HomeWelcomeTrust = () => {
  return (
    <section className="bg-white border-b border-[#1E3A8A]/8">
      <div className="container mx-auto px-4 lg:px-8 py-8 md:py-10">
        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,0.9fr)_repeat(3,minmax(0,1fr))] gap-4 md:gap-5 items-stretch">
          <div className="rounded-3xl bg-[#1E3A8A] text-white px-6 py-7 md:px-8 flex flex-col justify-center">
            <p className="text-[11px] font-semibold tracking-[0.18em] uppercase text-white/60 mb-2">
              You are safe here
            </p>
            <h2 className="text-2xl md:text-3xl font-extrabold leading-tight mb-3">
              A real store. A real phone. No surprise charges.
            </h2>
            <p className="text-white/80 text-sm leading-relaxed mb-5">
              Same-day in NYC. PayPal or card. Support {CONTACT_PHONE} — 24/7.
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <Link
                to="/products"
                className="inline-flex items-center justify-center h-11 px-6 rounded-full bg-white text-[#1E3A8A] font-semibold hover:bg-slate-100 transition-colors"
              >
                Start shopping
              </Link>
              <span className="inline-flex items-center gap-1.5 text-sm text-white/80">
                <HeadphonesIcon size={16} aria-hidden="true" />
                {CONTACT_PHONE}
              </span>
            </div>
          </div>
          {CARDS.map((card) => {
            const Icon = card.icon;
            return (
              <Link
                key={card.title}
                to={card.to}
                className="rounded-3xl border border-[#1E3A8A]/10 bg-[#F7F4EE] px-5 py-6 hover:bg-white hover:shadow-md hover:border-[#1E3A8A]/20 transition-all"
              >
                <div className="w-11 h-11 rounded-full bg-[#1E3A8A] text-white flex items-center justify-center mb-4">
                  <Icon size={20} aria-hidden="true" />
                </div>
                <h3 className="font-extrabold text-[#1E3A8A] text-lg mb-2">{card.title}</h3>
                <p className="text-sm text-slate-600 leading-relaxed mb-4">{card.text}</p>
                <span className="text-sm font-semibold text-[#1E3A8A]">{card.label} →</span>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default HomeWelcomeTrust;
