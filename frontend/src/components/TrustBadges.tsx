import { Star, Truck, MapPin, HeadphonesIcon, Package, RotateCcw } from 'lucide-react';
import { ORDERING_PAUSED } from '@/config/ordering';

const TrustBadges = () => {
  const badges = [
    {
      icon: MapPin,
      title: 'Packed in Queens',
      description: 'Jackson Heights warehouse',
      color: 'bg-[#1E3A8A]',
    },
    {
      icon: Truck,
      title: ORDERING_PAUSED ? 'Same-day NYC' : 'Tonight delivery',
      description: ORDERING_PAUSED ? 'When checkout opens' : 'Order by 3 PM weekdays',
      color: 'bg-[#1E3A8A]',
    },
    {
      icon: Package,
      title: 'One-tap cart',
      description: 'Add 1, then checkout',
      color: 'bg-[#1E3A8A]',
    },
    {
      icon: RotateCcw,
      title: '365-day returns',
      description: 'Unused items, no hassle',
      color: 'bg-[#1E3A8A]',
    },
    {
      icon: Star,
      title: 'No autoship',
      description: 'You confirm every order',
      color: 'bg-[#1E3A8A]',
    },
    {
      icon: HeadphonesIcon,
      title: 'Call 24/7',
      description: '(800) 259-2605 anytime',
      color: 'bg-[#1E3A8A]',
    },
  ];

  return (
    <div className="bg-white py-6 border-y border-gray-100 shadow-sm">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-3 md:grid-cols-6 gap-3 md:gap-4">
          {badges.map((badge, index) => {
            const Icon = badge.icon;
            return (
              <div
                key={index}
                className="flex flex-col items-center text-center p-3 md:p-4 rounded-xl hover:bg-gray-50 transition-colors duration-200"
              >
                <div className={`w-10 h-10 md:w-12 md:h-12 ${badge.color} rounded-full flex items-center justify-center mb-2`}>
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
