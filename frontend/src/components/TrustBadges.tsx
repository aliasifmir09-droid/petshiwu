import { Shield, Truck, CreditCard, HeadphonesIcon, Award, Lock } from 'lucide-react';

const TrustBadges = () => {
  const badges = [
    {
      icon: Shield,
      title: 'Secure Shopping',
      description: '256-bit SSL encryption'
    },
    {
      icon: Truck,
      title: 'Free Shipping',
      description: 'On orders over $49'
    },
    {
      icon: CreditCard,
      title: 'Safe Payment',
      description: 'Multiple payment methods'
    },
    {
      icon: HeadphonesIcon,
      title: '24/7 Support',
      description: 'Always here to help'
    },
    {
      icon: Award,
      title: 'Best Quality',
      description: 'Verified products only'
    },
    {
      icon: Lock,
      title: '100% Secure',
      description: 'Your data is protected'
    }
  ];

  return (
    <div className="hidden md:block bg-gradient-to-br from-gray-50 to-blue-50 py-8 border-y border-gray-200">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {badges.map((badge, index) => {
            const Icon = badge.icon;
            return (
              <div
                key={index}
                className="flex flex-col items-center text-center p-4 bg-white rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1 animate-fade-in-up"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                  <Icon size={24} className="text-white" />
                </div>
                <h3 className="font-bold text-sm text-gray-900 mb-1">{badge.title}</h3>
                <p className="text-xs text-gray-600">{badge.description}</p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default TrustBadges;

