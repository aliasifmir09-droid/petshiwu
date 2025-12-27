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
      <div className="relative w-28 h-28 sm:w-32 sm:h-32 md:w-36 md:h-36 lg:w-40 lg:h-40 rounded-full mb-3 overflow-hidden group-hover:scale-110 transition-all duration-300 shadow-lg group-hover:shadow-2xl">
        {/* Gradient Border - Blue to Purple to Pink (matching screenshot) */}
        <div className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 p-[3px] transform group-hover:from-blue-600 group-hover:via-purple-600 group-hover:to-pink-600 transition-all duration-300">
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
                    className={`w-full h-full object-contain object-center p-2 sm:p-3 ${imageError ? 'opacity-0 absolute' : 'opacity-100 relative'} transition-transform duration-300`}
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
                {/* Decorative overlay on hover - matching Home page style */}
                <div className="absolute inset-0 rounded-full bg-gradient-to-t from-blue-600/20 via-purple-600/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                {/* Pulse effect on hover - matching Home page style */}
                <div className="absolute inset-0 rounded-full border-2 border-blue-400 opacity-0 group-hover:opacity-50 group-hover:animate-ping"></div>
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
      link: '/category/food?petType=dog',
      color: 'from-blue-500 to-blue-600',
      // Image: Blue bag with paw print + blue bowl with kibble
      image: '/category-dog-food.avif'
    },
    {
      icon: HeartPulse,
      title: 'Vitamins & supplements',
      link: '/products?search=vitamins+supplements',
      color: 'from-green-500 to-emerald-600',
      // Image: Blue pill bottle with paw print label + white bone
      image: '/category-vitamins-supplements.png'
    },
    {
      icon: Cookie,
      title: 'Dog treats',
      link: '/products?petType=dog&search=treats',
      color: 'from-pink-500 to-rose-600',
      // Image: Blue jar with white flower-shaped treats + white bone
      image: '/category-dog-treats.avif'
    },
    {
      icon: Fish,
      title: 'Cat food',
      link: '/category/food?petType=cat',
      color: 'from-purple-500 to-purple-600',
      // Image: Stack of three blue cat food cans
      image: '/category-cat-food.avif'
    },
    {
      icon: Box,
      title: 'Cat litter',
      link: '/products?petType=cat&search=litter',
      color: 'from-teal-500 to-cyan-600',
      // Image: Blue litter box with white hood
      image: '/category-cat-litter.avif'
    },
    {
      icon: Tag,
      title: 'Deals',
      link: '/products?featured=true',
      color: 'from-orange-500 to-red-600',
      // Image: Blue gift box + blue price tag with $ sign
      image: '/category-deals.avif'
    }
  ];

  return (
    <section className="pt-8 sm:pt-12 md:pt-16 pb-4 sm:pb-6 md:pb-8 bg-gradient-to-b from-white via-blue-50/30 to-white relative overflow-hidden mb-0 sm:mb-2 md:mb-4">
      {/* Decorative background elements - matching Home page style */}
      <div className="absolute top-0 left-0 w-48 h-48 sm:w-72 sm:h-72 bg-blue-200 rounded-full opacity-10 blur-3xl z-0"></div>
      <div className="absolute bottom-0 right-0 w-64 h-64 sm:w-96 sm:h-96 bg-purple-200 rounded-full opacity-10 blur-3xl z-0"></div>
      
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Section Header - matching Home page gradient text style */}
        <div className="text-center mb-8 sm:mb-12 relative z-30">
          <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black mb-2 sm:mb-3 relative z-30" style={{ 
            background: 'linear-gradient(to right, #2563eb, #9333ea, #db2777)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            color: '#9333ea'
          }}>
            Find all your pet's must-haves
          </h2>
          <p className="text-gray-600 text-sm sm:text-base md:text-lg lg:text-xl max-w-2xl mx-auto relative z-30 px-2">
            Discover essential products for your furry, feathered, or scaly friends
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

