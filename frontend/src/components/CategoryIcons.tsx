import { Link } from 'react-router-dom';
import { UtensilsCrossed, HeartPulse, Cookie, Fish, Box, Tag } from 'lucide-react';

const CategoryIcons = () => {
  const categories = [
    {
      icon: UtensilsCrossed,
      title: 'Dog food',
      link: '/products?petType=dog&category=Food',
      color: 'from-blue-500 to-blue-600'
    },
    {
      icon: HeartPulse,
      title: 'Health & pharmacy',
      link: '/products?search=pharmacy',
      color: 'from-green-500 to-emerald-600'
    },
    {
      icon: Cookie,
      title: 'Dog treats',
      link: '/products?petType=dog&search=treats',
      color: 'from-pink-500 to-rose-600'
    },
    {
      icon: Fish,
      title: 'Cat food',
      link: '/products?petType=cat&category=Food',
      color: 'from-purple-500 to-purple-600'
    },
    {
      icon: Box,
      title: 'Cat litter',
      link: '/products?petType=cat&search=litter',
      color: 'from-teal-500 to-cyan-600'
    },
    {
      icon: Tag,
      title: 'Deals',
      link: '/products?featured=true',
      color: 'from-orange-500 to-red-600'
    }
  ];

  return (
    <section className="py-12 md:py-16 bg-gradient-to-b from-white to-gray-50">
      <div className="container mx-auto px-4 lg:px-8">
        <div className="text-center mb-8">
          <h2 className="text-3xl md:text-4xl font-black mb-3 text-gray-900">
            Find all your pet's must-haves
          </h2>
        </div>
        
        {/* Mobile: Horizontal Scrollable, Desktop: Grid */}
        <div className="flex md:grid md:grid-cols-6 gap-4 md:gap-6 overflow-x-auto pb-4 scrollbar-hide snap-x snap-mandatory md:overflow-x-visible">
          {categories.map((category, index) => {
            const Icon = category.icon;
            return (
              <Link
                key={index}
                to={category.link}
                className="flex-shrink-0 snap-center flex flex-col items-center text-center group w-28 md:w-auto"
              >
                {/* Circular Icon with Light Blue Background */}
                <div className="relative w-24 h-24 md:w-24 md:h-24 lg:w-28 lg:h-28 rounded-full bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center mb-3 group-hover:scale-110 transition-all duration-300 shadow-md group-hover:shadow-xl">
                  {/* Inner Gradient Circle */}
                  <div className={`w-20 h-20 md:w-20 md:h-20 lg:w-24 lg:h-24 rounded-full bg-gradient-to-br ${category.color} flex items-center justify-center`}>
                    <Icon size={28} className="text-white md:w-10 md:h-10 lg:w-12 lg:h-12" />
                  </div>
                </div>
                {/* Label */}
                <p className="text-sm md:text-base font-bold text-gray-800 group-hover:text-blue-600 transition-colors duration-300 whitespace-nowrap">
                  {category.title}
                </p>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default CategoryIcons;

