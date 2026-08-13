import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { slideDisplaySrc } from '@/utils/slideImage';

const SLIDES = [
  {
    id: 'slide-1',
    src: '/banner-one-stop.jpg',
    webp: '/banner-one-stop.webp',
    alt: 'Your One-Stop Shop for Every Pet\'s Joy',
    link: '/products',
  },
  {
    id: 'slide-nyc-tonight',
    src: '/banner-nyc-tonight.jpg',
    webp: '/banner-nyc-tonight.webp',
    alt: 'Same-day NYC pet delivery — order by 3 PM, delivered tonight',
    link: '/products',
  },
  {
    id: 'slide-neural',
    src: '/banner-neural-twin.jpg',
    webp: '/banner-neural-twin.webp',
    alt: 'Scan your pet. Generate their Twin — Petshiwu Neural',
    link: '/neural',
  },
  {
    id: 'slide-2',
    src: '/banner-birthday.png',
    webp: '/banner-birthday.webp',
    alt: 'Celebrate Your Pet\'s Birthday – 20% OFF + Free Gift',
    link: '/products',
  },
  {
    id: 'slide-fall',
    src: '/banner-fall-bowl.jpg',
    webp: '/banner-fall-bowl.webp',
    alt: 'Fall starts in the bowl — seasonal food, joints and coats',
    link: '/products',
  },
  {
    id: 'slide-3',
    src: '/banner-premium-care.jpg',
    webp: '/banner-premium-care.webp',
    alt: 'Petshiwu: Premium Care for Your Best Friends',
    link: '/products',
  },
  {
    id: 'slide-4',
    src: '/banner-nyc-delivery.jpg',
    webp: '/banner-nyc-delivery.webp',
    alt: 'NYC\'s Fastest Pet Delivery',
    link: '/products',
  },
];

const HeroSlideshow = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const slide = SLIDES[currentSlide];
  const nextSlideData = SLIDES[(currentSlide + 1) % SLIDES.length];
  const displaySrc = slideDisplaySrc(slide);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % SLIDES.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const img = new Image();
    img.src = slideDisplaySrc(nextSlideData);
  }, [nextSlideData]);

  const nextSlide = () => setCurrentSlide((prev) => (prev + 1) % SLIDES.length);
  const prevSlide = () => setCurrentSlide((prev) => (prev - 1 + SLIDES.length) % SLIDES.length);
  const goToSlide = (index: number) => setCurrentSlide(index);

  return (
    <div className="w-full mt-4">
      <div className="container mx-auto px-4 md:px-6 lg:px-8 mt-4">
        <div className="relative w-full overflow-hidden rounded-xl shadow-lg">
          <div className="relative w-full aspect-[16/6]">
            <Link key={slide.id} to={slide.link} className="absolute inset-0 z-10">
              <picture>
                {slide.webp.endsWith('.webp') && (
                  <source srcSet={slide.webp} type="image/webp" />
                )}
                <img
                  src={displaySrc}
                  alt={slide.alt}
                  width={1920}
                  height={720}
                  loading="eager"
                  fetchPriority="high"
                  decoding="async"
                  className="w-full h-full object-cover"
                />
              </picture>
            </Link>
          </div>

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
