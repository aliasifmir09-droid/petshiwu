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
    <section className="bg-white">
      <div className="container mx-auto px-3 sm:px-6 lg:px-8 py-3 md:py-4">
        <div className="flex items-baseline justify-between mb-2 md:mb-3">
          <h2 className="text-lg md:text-xl font-extrabold text-[#1E3A8A]">
            Shop by pet
          </h2>
          <p className="hidden sm:block text-sm text-slate-500">Dogs, cats, birds, fish, reptiles, and small pets.</p>
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
            className="flex justify-start items-center gap-6 overflow-x-auto pb-2 pt-1 scrollbar-hide snap-x"
          >
            {PET_CATEGORIES.map((category) => (
              <button
                key={category.slug}
                type="button"
                className="flex-shrink-0 snap-center group"
                onClick={() => goToPet(category.slug)}
              >
                <div className="flex flex-col items-center gap-3">
                  <div className="relative w-16 h-16 lg:w-20 lg:h-20 rounded-full bg-[#1E3A8A] p-[2px] group-hover:scale-[1.04] transition-transform shadow-sm">
                    <div className="w-full h-full rounded-full overflow-hidden bg-white">
                      <img src={category.image} alt={category.name} className="w-full h-full object-cover" loading="lazy" />
                    </div>
                  </div>
                  <p className="text-sm font-bold text-gray-800 group-hover:text-[#1E3A8A] transition-colors">{category.name}</p>
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
