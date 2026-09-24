import { Link } from 'react-router-dom';
import { HeadphonesIcon, ShieldCheck, Tag } from 'lucide-react';
import { FIRST_ORDER_CARD_LINE, FIRST_ORDER_CODE } from '@/config/publicPromos';
import { CONTACT_PHONE, CONTACT_PHONE_TEL } from '@/config/constants';

const ITEMS = [
  {
    icon: Tag,
    title: FIRST_ORDER_CODE,
    text: FIRST_ORDER_CARD_LINE,
    to: '/products',
    label: `Use ${FIRST_ORDER_CODE}`,
  },
  {
    icon: ShieldCheck,
    title: 'No autoship',
    text: 'You confirm every order. We never charge in the background.',
    to: '/our-promise',
    label: 'Our promise',
  },
  {
    icon: HeadphonesIcon,
    title: 'Call 24/7',
    text: `${CONTACT_PHONE} · PayPal or card · 365-day returns`,
    href: `tel:${CONTACT_PHONE_TEL}`,
    label: 'Talk to a person',
  },
];

const HomeWelcomeTrust = () => {
  return (
    <section className="bg-white">
      <div className="container mx-auto px-4 lg:px-8 py-6 md:py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4">
          {ITEMS.map((item) => {
            const Icon = item.icon;
            const body = (
              <>
                <div className="w-12 h-12 rounded-full bg-[#1E3A8A] text-white flex items-center justify-center shrink-0">
                  <Icon size={22} aria-hidden="true" />
                </div>
                <div className="min-w-0">
                  <h2 className="font-extrabold text-[#1E3A8A] text-lg leading-tight">{item.title}</h2>
                  <p className="mt-1 text-sm text-slate-600 leading-snug">{item.text}</p>
                  <span className="mt-2 inline-block text-sm font-semibold text-[#1E3A8A]">{item.label} →</span>
                </div>
              </>
            );
            const className =
              'flex items-start gap-4 rounded-2xl border border-[#1E3A8A]/10 bg-[#F7F4EE] px-5 py-5 hover:bg-white hover:shadow-md hover:border-[#1E3A8A]/20 transition-all';
            if ('href' in item && item.href) {
              return (
                <a key={item.title} href={item.href} className={className}>
                  {body}
                </a>
              );
            }
            return (
              <Link key={item.title} to={item.to!} className={className}>
                {body}
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default HomeWelcomeTrust;
