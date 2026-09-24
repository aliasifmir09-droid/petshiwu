import { HeadphonesIcon, RotateCcw, ShieldCheck, Star, Truck, Wallet } from 'lucide-react';
import { ORDERING_PAUSED } from '@/config/ordering';

const TrustBadges = () => {
  const badges = [
    {
      icon: Truck,
      title: 'Free over $49',
      description: ORDERING_PAUSED ? 'When checkout opens' : 'On qualifying orders',
    },
    {
      icon: Star,
      title: 'No autoship',
      description: 'You confirm every order',
    },
    {
      icon: RotateCcw,
      title: '365-day returns',
      description: 'Unused items, no hassle',
    },
    {
      icon: Wallet,
      title: 'PayPal or card',
      description: 'Checkout you already know',
    },
    {
      icon: ShieldCheck,
      title: 'Same-day NYC',
      description: 'Order by cutoff, tonight',
    },
    {
      icon: HeadphonesIcon,
      title: 'Call 24/7',
      description: '(800) 259-2605 anytime',
    },
  ];

  return (
    <div className="bg-white border-y border-[#1E3A8A]/8 py-5 md:py-6">
      <div className="container mx-auto px-4">
        <div className="flex flex-wrap justify-center gap-x-8 gap-y-4 md:gap-x-12">
          {badges.map((badge) => {
            const Icon = badge.icon;
            return (
              <div key={badge.title} className="flex items-center gap-3 min-w-[140px]">
                <div className="w-10 h-10 bg-[#1E3A8A] rounded-full flex items-center justify-center shrink-0">
                  <Icon size={18} className="text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-gray-900 leading-tight">{badge.title}</h3>
                  <p className="text-xs text-gray-500 leading-tight hidden sm:block">{badge.description}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default TrustBadges;
