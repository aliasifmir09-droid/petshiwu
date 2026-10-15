import { Clock, MapPin, RotateCcw, ShieldCheck, Truck } from 'lucide-react';
import { FEE_FREE_LABEL, FEE_UNDER_LABEL, SAME_DAY_LOCAL_PHRASE } from '@/utils/deliveryZones';

const BADGES = [
  { icon: ShieldCheck, title: 'Secure checkout', description: 'PayPal or card' },
  { icon: RotateCcw, title: '365-day returns', description: 'Unused items' },
  { icon: Truck, title: FEE_FREE_LABEL, description: FEE_UNDER_LABEL },
  { icon: Clock, title: 'Nationwide 2-5 day delivery', description: 'Except Alaska and Hawaii' },
  { icon: MapPin, title: SAME_DAY_LOCAL_PHRASE, description: 'Our home city, on local stock' },
];

const TrustBadges = () => (
  <div className="border-y border-stone-200 bg-white py-8 md:py-10">
    <div className="container mx-auto px-4 sm:px-6 lg:px-8">
      <ul className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-5">
        {BADGES.map((badge) => {
          const Icon = badge.icon;
          return (
            <li key={badge.title} className="flex items-start gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-stone-200 text-stone-700">
                <Icon size={16} strokeWidth={1.75} />
              </div>
              <div>
                <h3 className="text-[13px] font-medium leading-snug text-stone-900">{badge.title}</h3>
                <p className="mt-0.5 text-xs leading-snug text-stone-500">{badge.description}</p>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  </div>
);

export default TrustBadges;
