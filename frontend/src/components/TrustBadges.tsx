import { Clock, MapPin, RotateCcw, ShieldCheck, Truck } from 'lucide-react';

const BADGES = [
  { icon: ShieldCheck, title: 'Secure checkout', description: 'PayPal or card' },
  { icon: RotateCcw, title: '365-day returns', description: 'Unused items' },
  { icon: Truck, title: 'Free shipping $49+', description: '$7 under $49' },
  { icon: Clock, title: 'Nationwide 2-5 business days', description: 'Across the US, except Alaska and Hawaii' },
  { icon: MapPin, title: 'NYC same-day on local stock', description: 'Order by cutoff' },
];

const TrustBadges = () => (
  <div className="bg-white border-y border-[#1E3A8A]/8 py-5 md:py-6">
    <div className="container mx-auto px-4">
      <ul className="flex flex-wrap justify-center gap-x-8 gap-y-4 md:gap-x-10">
        {BADGES.map((badge) => {
          const Icon = badge.icon;
          return (
            <li key={badge.title} className="flex items-center gap-3 min-w-[160px]">
              <div className="w-10 h-10 bg-[#1E3A8A] rounded-full flex items-center justify-center shrink-0">
                <Icon size={18} className="text-white" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-gray-900 leading-tight">{badge.title}</h3>
                <p className="text-xs text-gray-500 leading-tight hidden sm:block">{badge.description}</p>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  </div>
);

export default TrustBadges;
