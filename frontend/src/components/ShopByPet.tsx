import { useRef, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { PET_CATEGORIES } from '@/data/shopByPet';

const ShopByPet = () => {
  const navigate = useNavigate();
  const petTypesScrollRef = useRef<HTMLDivElement>(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(false);

  useEffect(() => {
    const scrollContainer = petTypesScrollRef.current;
    let rafId: number | null = null;
    const checkScrollPosition = () => {
      rafId = requestAnimationFrame(() => {
        if (petTypesScrollRef.current) {
          const { scrollLeft, scrollWidth, clientWidth } = petTypesScrollRef.current;
          setShowLeftArrow(scrollLeft > 0);
          setShowRightArrow(scrollLeft < scrollWidth - clientWidth - 10);
        }
      });
    };
    rafId = requestAnimationFrame(checkScrollPosition);
    if (scrollContainer) {
      scrollContainer.addEventListener('scroll', checkScrollPosition, { passive: true });
      window.addEventListener('resize', checkScrollPosition, { passive: true });
    }
    return () => {
      if (rafId !== null) cancelAnimationFrame(rafId);
      if (scrollContainer) {
        scrollContainer.removeEventListener('scroll', checkScrollPosition);
        window.removeEventListener('resize', checkScrollPosition);
      }
    };
  }, []);

  const scrollPetTypes = (direction: 'left' | 'right') => {
    if (petTypesScrollRef.current) {
      const scrollAmount = 300;
      const newScrollPosition =
        direction === 'left'
          ? petTypesScrollRef.current.scrollLeft - scrollAmount
          : petTypesScrollRef.current.scrollLeft + scrollAmount;
      petTypesScrollRef.current.scrollTo({ left: newScrollPosition, behavior: 'smooth' });
    }
  };

  const goToPet = (slug: string) => navigate(`/products?petType=${slug}`);

  return (
    <section className="bg-white border-b border-gray-100">
      <div className="container mx-auto px-3 sm:px-6 lg:px-8 py-3 md:py-10">
        <p className="md:hidden text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-2">
          Shop by pet
        </p>
        <div className="hidden md:block text-center mb-8">
          <h2 className="text-3xl md:text-4xl font-bold text-[#1E3A8A] mb-2">
            Shop by pet
          </h2>
          <p className="text-gray-500 text-base max-w-2xl mx-auto">Food and supplies for every pet</p>
        </div>

        {/* Mobile: all six pets on the first screen */}
        <div className="md:hidden grid grid-cols-6 gap-1">
          {PET_CATEGORIES.map((category, index) => (
            <button
              key={category.slug}
              type="button"
              onClick={() => goToPet(category.slug)}
              className="flex flex-col items-center gap-1 min-w-0"
            >
              <div className="relative w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-[#1E3A8A] p-[2px]">
                <div className="w-full h-full rounded-full overflow-hidden bg-white">
                  <img
                    src={category.image}
                    alt={category.name}
                    className="w-full h-full object-cover"
                    loading={index < 2 ? 'eager' : 'lazy'}
                    width={80}
                    height={80}
                  />
                </div>
              </div>
              <span className="text-[10px] font-bold text-gray-800 text-center leading-tight truncate w-full">
                {category.name}
              </span>
            </button>
          ))}
        </div>

        {/* Desktop */}
        <div className="hidden md:block relative">
          {showLeftArrow && (
            <button
              type="button"
              onClick={() => scrollPetTypes('left')}
              className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-white p-2 rounded-full shadow-lg"
              aria-label="Scroll pet types left"
            >
              <ChevronLeft size={20} />
            </button>
          )}
          {showRightArrow && (
            <button
              type="button"
              onClick={() => scrollPetTypes('right')}
              className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-white p-2 rounded-full shadow-lg"
              aria-label="Scroll pet types right"
            >
              <ChevronRight size={20} />
            </button>
          )}
          <div
            ref={petTypesScrollRef}
            className="flex justify-center items-center gap-8 overflow-x-auto pb-6 pt-6 scrollbar-hide snap-x px-8"
          >
            {PET_CATEGORIES.map((category) => (
              <button
                key={category.slug}
                type="button"
                className="flex-shrink-0 snap-center group"
                onClick={() => goToPet(category.slug)}
              >
                <div className="flex flex-col items-center gap-3">
                  <div className="relative w-32 h-32 rounded-full bg-[#1E3A8A] p-[3px] group-hover:scale-[1.03] transition-transform shadow-sm">
                    <div className="w-full h-full rounded-full overflow-hidden bg-white">
                      <img src={category.image} alt={category.name} className="w-full h-full object-cover" loading="lazy" />
                    </div>
                  </div>
                  <p className="text-lg font-bold text-gray-800 group-hover:text-blue-600 transition-colors">{category.name}</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default ShopByPet;
