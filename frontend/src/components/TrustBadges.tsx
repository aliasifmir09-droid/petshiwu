import { Star, Truck, MapPin, HeadphonesIcon, Package, RotateCcw } from 'lucide-react';

const TrustBadges = () => {
  const badges = [
    {
      icon: MapPin,
      title: 'Queens-Based',
      description: 'Local to Jackson Heights, NYC',
      color: 'bg-[#1E3A8A]',
    },
    {
      icon: Truck,
      title: 'Free Delivery',
      description: 'On all orders over $49',
      color: 'bg-[#1E3A8A]',
    },
    {
      icon: Package,
      title: '10,000+ Products',
      description: 'Every pet, every brand',
      color: 'bg-[#1E3A8A]',
    },
    {
      icon: RotateCcw,
      title: '365-Day Returns',
      description: 'Unused items, no hassle',
      color: 'bg-[#1E3A8A]',
    },
    {
      icon: Star,
      title: 'Top Brands',
      description: 'Purina, Royal Canin & more',
      color: 'bg-[#1E3A8A]',
    },
    {
      icon: HeadphonesIcon,
      title: 'NYC Support',
      description: '(800) 259-2605 · 9AM–8PM',
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
