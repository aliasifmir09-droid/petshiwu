import { Link } from 'react-router-dom';
import { UtensilsCrossed, HeartPulse, Cookie, Fish, Box, Tag } from 'lucide-react';
import { useState } from 'react';

interface CategoryItem {
  icon: any;
  title: string;
  link: string;
  color: string;
  image?: string;
}

const CategoryItemComponent = ({ category }: { category: CategoryItem }) => {
  const [imageError, setImageError] = useState(false);
  const Icon = category.icon;

  return (
    <Link
      to={category.link}
      className="flex flex-col items-center text-center group"
    >
      {/* Circular Icon/Image with Light Blue Background */}
      <div className="relative w-28 h-28 md:w-32 md:h-32 lg:w-36 lg:h-36 xl:w-40 xl:h-40 rounded-full bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center mb-3 group-hover:scale-110 transition-all duration-300 shadow-md group-hover:shadow-xl overflow-hidden">
        {category.image ? (
          /* Image Display - Always try to show image first */
          <>
            {/* Hidden fallback icon for error case */}
            <div className={`absolute inset-0 w-full h-full rounded-full bg-gradient-to-br ${category.color} flex items-center justify-center ${imageError ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
              <Icon size={40} className="text-white md:w-12 md:h-12 lg:w-14 lg:h-14 xl:w-16 xl:h-16" />
            </div>
            {/* Image that should be visible */}
            <div className={`w-full h-full rounded-full overflow-hidden bg-white flex items-center justify-center ${imageError ? 'opacity-0 absolute' : 'opacity-100 relative'}`}>
              <img 
                src={category.image} 
                alt={category.title}
                className="w-full h-full object-contain object-center p-1"
                onError={() => {
                  setImageError(true);
                }}
                onLoad={() => {
                  setImageError(false);
                }}
                loading="eager"
                style={{ display: imageError ? 'none' : 'block' }}
              />
            </div>
          </>
        ) : (
          /* Icon Display - Only if no image path */
          <div className={`w-24 h-24 md:w-28 md:h-28 lg:w-32 lg:h-32 xl:w-36 xl:h-36 rounded-full bg-gradient-to-br ${category.color} flex items-center justify-center`}>
            <Icon size={40} className="text-white md:w-12 md:h-12 lg:w-14 lg:h-14 xl:w-16 xl:h-16" />
          </div>
        )}
      </div>
      {/* Label */}
      <p className="text-base md:text-lg lg:text-xl font-bold text-gray-800 group-hover:text-blue-600 transition-colors duration-300">
        {category.title}
      </p>
    </Link>
  );
};

const CategoryIcons = () => {
  const categories = [
    {
      icon: UtensilsCrossed,
      title: 'Dog food',
      link: '/category/food',
      color: 'from-blue-500 to-blue-600',
      image: '/category-dog-food.avif'
    },
    {
      icon: HeartPulse,
      title: 'Health & pharmacy',
      link: '/products?search=pharmacy',
      color: 'from-green-500 to-emerald-600',
      image: '/category-health-pharmacy.avif'
    },
    {
      icon: Cookie,
      title: 'Dog treats',
      link: '/products?petType=dog&search=treats',
      color: 'from-pink-500 to-rose-600',
      image: '/category-dog-treats.avif'
    },
    {
      icon: Fish,
      title: 'Cat food',
      link: '/category/food',
      color: 'from-purple-500 to-purple-600',
      image: '/category-cat-food.avif'
    },
    {
      icon: Box,
      title: 'Cat litter',
      link: '/products?petType=cat&search=litter',
      color: 'from-teal-500 to-cyan-600',
      image: '/category-cat-litter.avif'
    },
    {
      icon: Tag,
      title: 'Deals',
      link: '/products?featured=true',
      color: 'from-orange-500 to-red-600',
      image: '/category-deals.avif'
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
        
        <div className="grid grid-cols-3 md:grid-cols-6 gap-4 md:gap-6">
          {categories.map((category, index) => (
            <CategoryItemComponent key={index} category={category} />
          ))}
        </div>
      </div>
    </section>
  );
};

export default CategoryIcons;

