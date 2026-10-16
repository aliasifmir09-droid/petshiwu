import { Clock, MapPin, RotateCcw, ShieldCheck, Truck } from 'lucide-react';
import { FEE_FREE_LABEL, FEE_UNDER_LABEL, SAME_DAY_LOCAL_PHRASE } from '@/utils/deliveryZones';

const BADGES = [
  { icon: ShieldCheck, title: 'Secure checkout', description: 'PayPal or card', tone: 'navy' as const },
  { icon: RotateCcw, title: '365-day returns', description: 'Unused items', tone: 'orange' as const },
  { icon: Truck, title: FEE_FREE_LABEL, description: FEE_UNDER_LABEL, tone: 'navy' as const },
  { icon: Clock, title: 'Nationwide 2-5 day delivery', description: 'Except Alaska and Hawaii', tone: 'orange' as const },
  { icon: MapPin, title: SAME_DAY_LOCAL_PHRASE, description: 'Our home city, on local stock', tone: 'navy' as const },
];

const TrustBadges = () => (
  <div className="bg-[#FAF6EF] py-8 md:py-10" data-home-section="trust">
    <div className="container mx-auto px-4 sm:px-6 lg:px-8">
      <ul className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-5">
        {BADGES.map((badge) => {
          const Icon = badge.icon;
          const circle =
            badge.tone === 'orange' ? 'bg-orange-100 text-orange-600' : 'bg-blue-50 text-[#1E3A8A]';
          return (
            <li key={badge.title} className="flex items-start gap-3">
              <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full ${circle}`}>
                <Icon size={18} strokeWidth={2.25} />
              </div>
              <div>
                <h3 className="text-sm font-bold leading-snug text-[#1E3A8A]">{badge.title}</h3>
                <p className="mt-0.5 text-xs leading-snug text-slate-600">{badge.description}</p>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  </div>
);

export default TrustBadges;
