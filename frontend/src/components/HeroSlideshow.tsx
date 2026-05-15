import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';

// ── Static banner slides (images served from /public) ────────────
const SLIDES = [
  {
    id: 'slide-1',
    src: '/banner-one-stop.jpg',
    alt: 'Your One-Stop Shop for Every Pet\'s Joy',
    link: '/products',
  },
  {
    id: 'slide-2',
    src: '/banner-birthday.png',
    alt: 'Celebrate Your Pet\'s Birthday – 20% OFF + Free Gift',
    link: '/products',
  },
  {
    id: 'slide-3',
    src: '/banner-premium-care.jpg',
    alt: 'Petshiwu: Premium Care for Your Best Friends',
    link: '/products',
  },
  {
    id: 'slide-4',
    src: '/banner-nyc-delivery.jpg',
    alt: 'NYC\'s Fastest Pet Delivery',
    link: '/products',
  },
];

const HeroSlideshow = () => {
  const [currentSlide, setCurrentSlide] = useState(0);

  // Auto-advance every 5 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % SLIDES.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  const nextSlide = () => setCurrentSlide((prev) => (prev + 1) % SLIDES.length);
  const prevSlide = () => setCurrentSlide((prev) => (prev - 1 + SLIDES.length) % SLIDES.length);
  const goToSlide = (index: number) => setCurrentSlide(index);

  return (
    <div className="w-full mt-4">
      <div className="container mx-auto px-4 md:px-6 lg:px-8 mt-4">
        <div className="relative w-full overflow-hidden rounded-xl shadow-lg">

          {/* Slides */}
          <div className="relative w-full aspect-[16/6]">
            {SLIDES.map((slide, index) => (
              <Link
                key={slide.id}
                to={slide.link}
                className={`absolute inset-0 transition-all duration-1000 ${
                  index === currentSlide ? 'opacity-100 z-10' : 'opacity-0 z-0'
                }`}
              >
                <img
                  src={slide.src}
                  alt={slide.alt}
                  width={1920}
                  height={720}
                  loading={index === 0 ? 'eager' : 'lazy'}
                  fetchPriority={index === 0 ? 'high' : 'auto'}
                  decoding={index === 0 ? 'sync' : 'async'}
                  className="w-full h-full object-cover"
                />
              </Link>
            ))}
          </div>

          {/* Arrows */}
          <button
            onClick={prevSlide}
            className="absolute left-2 md:left-4 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white text-gray-800 hover:text-blue-600 p-2 md:p-3 rounded-full transition-all shadow-lg hover:shadow-xl z-20 transform hover:scale-110 duration-300"
            aria-label="Previous slide"
            style={{ minWidth: '44px', minHeight: '44px' }}
          >
            <ChevronLeft size={20} className="md:w-6 md:h-6" />
          </button>
          <button
            onClick={nextSlide}
            className="absolute right-2 md:right-4 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white text-gray-800 hover:text-blue-600 p-2 md:p-3 rounded-full transition-all shadow-lg hover:shadow-xl z-20 transform hover:scale-110 duration-300"
            aria-label="Next slide"
            style={{ minWidth: '44px', minHeight: '44px' }}
          >
            <ChevronRight size={20} className="md:w-6 md:h-6" />
          </button>

          {/* Dot indicators */}
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-2 z-20 bg-white/70 backdrop-blur-sm px-3 py-1.5 rounded-full shadow-md">
            {SLIDES.map((_, index) => (
              <button
                key={index}
                onClick={() => goToSlide(index)}
                className={`rounded-full transition-all duration-300 ${
                  index === currentSlide
                    ? 'bg-gradient-to-r from-blue-600 to-purple-600 w-8 h-2'
                    : 'bg-gray-400 hover:bg-gray-600 w-2 h-2'
                }`}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>

        </div>
      </div>
    </div>
  );
};

export default HeroSlideshow;
