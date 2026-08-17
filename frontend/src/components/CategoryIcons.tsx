import { Link } from 'react-router-dom';
import { UtensilsCrossed, HeartPulse, Cookie, Fish, Box, Tag, ChevronLeft, ChevronRight } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';

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
      className="flex flex-col items-center text-center group cursor-pointer"
    >
      {/* Circular Icon/Image with Gradient Border - Enhanced with Home page styling */}
      <div className="relative w-28 h-28 sm:w-32 sm:h-32 md:w-36 md:h-36 lg:w-40 lg:h-40 rounded-full mb-3 overflow-hidden group-hover:scale-[1.03] transition-transform duration-200 shadow-sm">
        <div className="absolute inset-0 rounded-full bg-[#1E3A8A] p-[3px]">
          <div className="w-full h-full rounded-full bg-white flex items-center justify-center overflow-hidden">
            {category.image ? (
              /* Image Display - Always try to show image first */
              <>
                {/* Hidden fallback icon for error case */}
                <div className={`absolute inset-0 w-full h-full rounded-full bg-gradient-to-br ${category.color} flex items-center justify-center ${imageError ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
                  <Icon size={32} className="text-white sm:w-10 sm:h-10 md:w-12 md:h-12 lg:w-14 lg:h-14" />
                </div>
                {/* Image that should be visible - with modern format fallbacks */}
                <picture>
                  {category.image.endsWith('.avif') && (
                    <>
                      <source srcSet={category.image.replace('.avif', '.avif')} type="image/avif" />
                      <source srcSet={category.image.replace('.avif', '.webp')} type="image/webp" />
                      <source srcSet={category.image.replace('.avif', '.png')} type="image/png" />
                    </>
                  )}
                  {category.image.endsWith('.png') && (
                    <>
                      <source srcSet={category.image.replace('.png', '.avif')} type="image/avif" />
                      <source srcSet={category.image.replace('.png', '.webp')} type="image/webp" />
                    </>
                  )}
                  <img 
                    src={category.image} 
                    alt=""
                    width={170}
                    height={170}
                    className={`w-full h-full object-cover object-center ${imageError ? 'opacity-0 absolute' : 'opacity-100 relative'} transition-transform duration-300`}
                    onError={() => {
                      setImageError(true);
                    }}
                    onLoad={() => {
                      setImageError(false);
                    }}
                    loading="eager"
                    decoding="async"
                    style={{ display: imageError ? 'none' : 'block' }}
                    aria-hidden="true"
                  />
                </picture>
                <div className="absolute inset-0 rounded-full bg-[#1E3A8A]/10 opacity-0 group-hover:opacity-100 transition-opacity duration-200"></div>
              </>
            ) : (
              /* Icon Display - Only if no image path */
              <div className={`w-full h-full rounded-full bg-gradient-to-br ${category.color} flex items-center justify-center`}>
                <Icon size={32} className="text-white sm:w-10 sm:h-10 md:w-12 md:h-12 lg:w-14 lg:h-14" />
              </div>
            )}
          </div>
        </div>
      </div>
      {/* Label - Matching Home page text style */}
      <p className="text-xs sm:text-sm md:text-base lg:text-lg font-bold text-gray-800 group-hover:text-blue-600 transition-colors duration-300 text-center leading-tight px-2 max-w-[120px] sm:max-w-[140px] md:max-w-[160px]">
        {category.title}
      </p>
    </Link>
  );
};

const CategoryIcons = () => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(false);

  // Check scroll position to show/hide arrows
  useEffect(() => {
    const scrollContainer = scrollRef.current;
    
    const checkScrollPosition = () => {
      if (scrollContainer) {
        const { scrollLeft, scrollWidth, clientWidth } = scrollContainer;
        setShowLeftArrow(scrollLeft > 0);
        setShowRightArrow(scrollLeft < scrollWidth - clientWidth - 10);
      }
    };
    
    checkScrollPosition();
    const timer = setTimeout(checkScrollPosition, 100);
    
    if (scrollContainer) {
      scrollContainer.addEventListener('scroll', checkScrollPosition);
      window.addEventListener('resize', checkScrollPosition);
    }
    
    return () => {
      clearTimeout(timer);
      if (scrollContainer) {
        scrollContainer.removeEventListener('scroll', checkScrollPosition);
        window.removeEventListener('resize', checkScrollPosition);
      }
    };
  }, []);

  const scrollCategories = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const scrollAmount = 300;
      const newScrollPosition = direction === 'left' 
        ? scrollRef.current.scrollLeft - scrollAmount
        : scrollRef.current.scrollLeft + scrollAmount;
      
      scrollRef.current.scrollTo({
        left: newScrollPosition,
        behavior: 'smooth'
      });
    }
  };

  const categories = [
    {
      icon: UtensilsCrossed,
      title: 'Dog food',
      link: '/dog/food',
      color: 'from-blue-500 to-blue-600',
      image: '/category-dog-food.png'
    },
    {
      icon: HeartPulse,
      title: 'Vitamins & supplements',
      link: '/products?vitaminsFilter=true&supplementsFilter=true',
      color: 'from-green-500 to-emerald-600',
      image: '/category-vitamins-supplements.png'
    },
    {
      icon: Cookie,
      title: 'Dog treats',
      link: '/products?petType=dog&search=treats',
      color: 'from-pink-500 to-rose-600',
      image: '/category-dog-treats.png'
    },
    {
      icon: Fish,
      title: 'Cat food',
      link: '/cat/food',
      color: 'from-purple-500 to-purple-600',
      image: '/category-cat-food.png'
    },
    {
      icon: Box,
      title: 'Cat litter',
      link: '/products?petType=cat&search=litter',
      color: 'from-teal-500 to-cyan-600',
      image: '/category-cat-litter.png'
    },
    {
      icon: Tag,
      title: 'Deals',
      link: '/products?featured=true',
      color: 'from-orange-500 to-red-600',
      image: '/category-deals.png'
    }
  ];

  return (
    <section className="pt-8 sm:pt-12 md:pt-14 pb-4 sm:pb-6 md:pb-8 bg-white relative mb-0 sm:mb-2 md:mb-4">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center mb-8 sm:mb-10 relative z-30">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-[#1E3A8A] mb-2">
            Shop essentials
          </h2>
          <p className="text-slate-500 text-sm sm:text-base max-w-2xl mx-auto px-2">
            Food, treats, litter, and more — delivered in NYC
          </p>
        </div>
        
        {/* Category Grid with Horizontal Scroll on Smaller Screens */}
        <div className="relative max-w-6xl mx-auto">
          {/* Left Arrow - Only show when scrollable */}
          {showLeftArrow && (
            <button
              onClick={() => scrollCategories('left')}
              className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-white hover:bg-gray-100 text-gray-800 p-2 lg:p-3 rounded-full shadow-lg hover:shadow-xl transition-all transform hover:scale-110 hidden md:flex items-center justify-center"
              aria-label="Scroll left"
            >
              <ChevronLeft size={20} className="lg:w-6 lg:h-6" />
            </button>
          )}

          {/* Right Arrow - Only show when scrollable */}
          {showRightArrow && (
            <button
              onClick={() => scrollCategories('right')}
              className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-white hover:bg-gray-100 text-gray-800 p-2 lg:p-3 rounded-full shadow-lg hover:shadow-xl transition-all transform hover:scale-110 hidden md:flex items-center justify-center"
              aria-label="Scroll right"
            >
              <ChevronRight size={20} className="lg:w-6 lg:h-6" />
            </button>
          )}

          {/* Scrollable Container */}
          <div 
            ref={scrollRef}
            className="flex justify-center items-center gap-4 sm:gap-6 md:gap-8 overflow-x-auto overflow-y-visible pb-6 pt-6 scrollbar-hide snap-x snap-mandatory px-4 md:px-8"
            style={{ 
              scrollbarWidth: 'none', 
              msOverflowStyle: 'none',
              WebkitOverflowScrolling: 'touch',
              paddingTop: '1rem',
              paddingBottom: '1rem'
            }}
          >
            <style>{`
              .scrollbar-hide::-webkit-scrollbar {
                display: none;
              }
            `}</style>
            {/* Spacer for centering */}
            <div className="flex-shrink-0" style={{ width: '0px' }}></div>
            {categories.map((category, index) => (
              <div key={index} className="flex-shrink-0 snap-center py-2">
                <CategoryItemComponent category={category} />
              </div>
            ))}
            {/* Spacer for centering */}
            <div className="flex-shrink-0" style={{ width: '0px' }}></div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CategoryIcons;

