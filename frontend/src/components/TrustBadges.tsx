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
    <div className="bg-[#F7F4EE] py-8 border-y border-[#1E3A8A]/8">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-3 md:grid-cols-6 gap-3 md:gap-4">
          {badges.map((badge) => {
            const Icon = badge.icon;
            return (
              <div
                key={badge.title}
                className="flex flex-col items-center text-center p-3 md:p-4 rounded-2xl bg-white/70 hover:bg-white hover:shadow-sm transition-all duration-200"
              >
                <div className="w-10 h-10 md:w-12 md:h-12 bg-[#1E3A8A] rounded-full flex items-center justify-center mb-2 shadow-sm">
                  <Icon size={20} className="text-white" />
                </div>
                <h3 className="font-bold text-xs md:text-sm text-gray-900 mb-0.5 leading-tight">{badge.title}</h3>
                <p className="text-xs text-gray-500 leading-tight hidden md:block">{badge.description}</p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default TrustBadges;
