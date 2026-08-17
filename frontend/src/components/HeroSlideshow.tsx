import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { slideDisplaySrc } from '@/utils/slideImage';

/** One store promise on the first screen — big brands pick one line. */
export const HERO_SLIDES = [
  {
    id: 'slide-nyc-tonight',
    src: '/banner-nyc-tonight.jpg',
    webp: '/banner-nyc-tonight.webp',
    alt: 'Same-day NYC pet delivery — order by 3 PM, delivered tonight',
    link: '/products',
  },
];

const HeroSlideshow = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const hasCarousel = HERO_SLIDES.length > 1;
  const slide = HERO_SLIDES[currentSlide];
  const nextSlideData = HERO_SLIDES[(currentSlide + 1) % HERO_SLIDES.length];
  const displaySrc = slideDisplaySrc(slide);

  useEffect(() => {
    if (!hasCarousel) return;
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % HERO_SLIDES.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [hasCarousel]);

  // Preload only the next slide so we don't download all banners at once.
  useEffect(() => {
    if (!hasCarousel) return;
    const img = new Image();
    img.src = slideDisplaySrc(nextSlideData);
  }, [hasCarousel, nextSlideData]);

  const nextSlide = () => setCurrentSlide((prev) => (prev + 1) % HERO_SLIDES.length);
  const prevSlide = () => setCurrentSlide((prev) => (prev - 1 + HERO_SLIDES.length) % HERO_SLIDES.length);
  const goToSlide = (index: number) => setCurrentSlide(index);

  return (
    <div className="w-full">
      <div className="container mx-auto px-4 md:px-6 lg:px-8">
        <div className="relative w-full overflow-hidden rounded-xl shadow-md bg-slate-950">
          {/* 16:9 frame + object-contain: the full banner stays visible. object-cover was clipping sides. */}
          <div className="relative w-full aspect-[16/9]">
            <Link key={slide.id} to={slide.link} className="absolute inset-0 z-10 block">
              <picture className="absolute inset-0 block h-full w-full">
                {slide.webp.endsWith('.webp') && (
                  <source srcSet={slide.webp} type="image/webp" />
                )}
                <img
                  src={displaySrc}
                  alt={slide.alt}
                  width={1920}
                  height={1080}
                  loading="eager"
                  fetchPriority="high"
                  decoding="async"
                  className="h-full w-full object-contain object-center"
                />
              </picture>
            </Link>
          </div>

          {hasCarousel && (
            <>
              <button
                onClick={prevSlide}
                className="absolute left-2 md:left-4 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white text-gray-800 hover:text-blue-600 p-2 md:p-3 rounded-full transition-colors shadow-md z-20"
                aria-label="Previous slide"
                style={{ minWidth: '44px', minHeight: '44px' }}
              >
                <ChevronLeft size={20} className="md:w-6 md:h-6" />
              </button>
              <button
                onClick={nextSlide}
                className="absolute right-2 md:right-4 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white text-gray-800 hover:text-blue-600 p-2 md:p-3 rounded-full transition-colors shadow-md z-20"
                aria-label="Next slide"
                style={{ minWidth: '44px', minHeight: '44px' }}
              >
                <ChevronRight size={20} className="md:w-6 md:h-6" />
              </button>

              <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-2 z-20 bg-white/70 backdrop-blur-sm px-3 py-1.5 rounded-full shadow-md">
                {HERO_SLIDES.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => goToSlide(index)}
                    className={`rounded-full transition-all duration-300 ${
                      index === currentSlide
                        ? 'bg-[#1E3A8A] w-8 h-2'
                        : 'bg-gray-400 hover:bg-gray-600 w-2 h-2'
                    }`}
                    aria-label={`Go to slide ${index + 1}`}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default HeroSlideshow;
