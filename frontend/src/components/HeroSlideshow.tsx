import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';

interface Slide {
  id: number;
  title: string;
  subtitle: string;
  description: string;
  buttonText: string;
  buttonLink: string;
  leftImage: string;
  rightImage?: string;
  backgroundColor: string;
  theme: 'holiday' | 'product' | 'wellness' | 'treats';
}

const HeroSlideshow = () => {
  const [currentSlide, setCurrentSlide] = useState(0);

  const slides: Slide[] = [
    {
      id: 1,
      title: 'Everything Your Pet Needs',
      subtitle: 'Premium Pet Food, Toys & Supplies',
      description: 'Trusted by pet parents nationwide. Quality products, fast shipping.',
      buttonText: 'Shop Now',
      buttonLink: '/products',
      leftImage: 'https://images.unsplash.com/photo-1574158622682-e40e69881006?w=800&h=600&fit=crop&q=80', // White cat with Christmas theme
      backgroundColor: 'bg-gradient-to-br from-blue-50 via-white to-purple-50',
      theme: 'holiday'
    },
    {
      id: 2,
      title: 'Up to 40% Off',
      subtitle: 'Premium Pet Food & Treats',
      description: 'Premium quality at great prices',
      buttonText: 'Shop Deals',
      buttonLink: '/products?featured=true',
      leftImage: 'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=800&h=600&fit=crop&q=80', // Happy dog
      backgroundColor: 'bg-gradient-to-br from-orange-50 via-white to-amber-50',
      theme: 'product'
    },
    {
      id: 3,
      title: 'Health & Wellness',
      subtitle: 'Keep Your Pets Happy & Healthy',
      description: 'Vitamins, Supplements & More',
      buttonText: 'Explore Now',
      buttonLink: '/products?search=vitamins',
      leftImage: 'https://images.unsplash.com/photo-1583337130417-3346a1be7dee?w=800&h=600&fit=crop&q=80', // Healthy pet
      backgroundColor: 'bg-gradient-to-br from-green-50 via-white to-emerald-50',
      theme: 'wellness'
    },
    {
      id: 4,
      title: 'Premium Nutrition',
      subtitle: 'Science-Backed Formulas',
      description: 'For Every Life Stage',
      buttonText: 'Shop Food',
      buttonLink: '/products?search=food',
      leftImage: 'https://images.unsplash.com/photo-1548199973-03cce0bbc87b?w=800&h=600&fit=crop&q=80', // Pet eating
      backgroundColor: 'bg-gradient-to-br from-purple-50 via-white to-pink-50',
      theme: 'product'
    },
    {
      id: 5,
      title: 'Delicious Treats',
      subtitle: 'Premium Rewards They Love',
      description: 'Make every moment special',
      buttonText: 'Shop Treats',
      buttonLink: '/products?search=treats',
      leftImage: 'https://images.unsplash.com/photo-1517849845537-4d257902454a?w=800&h=600&fit=crop&q=80', // Dog with treat
      backgroundColor: 'bg-gradient-to-br from-red-50 via-white to-rose-50',
      theme: 'treats'
    }
  ];

  // Auto-advance slides every 5 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 5000);

    return () => clearInterval(timer);
  }, [slides.length]);

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % slides.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
  };

  const goToSlide = (index: number) => {
    setCurrentSlide(index);
  };

  return (
    <div className="w-full mt-4">
      {/* Main Slideshow */}
      <div className="container mx-auto px-4 md:px-6 lg:px-8 mt-4">
        <div className="relative w-full overflow-hidden bg-white rounded-xl shadow-lg">
          {/* Slides Container */}
          <div className="relative w-full h-[260px] md:h-[280px] lg:h-[300px]">
            {slides.map((slide, index) => (
              <div
                key={slide.id}
                className={`absolute inset-0 transition-all duration-1000 ${
                  index === currentSlide ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
                }`}
              >
                <div className={`w-full h-full ${slide.backgroundColor}`}>
                  <div className="grid md:grid-cols-2 h-full gap-0">
                    
                    {/* Left Side - Content (Clean, Focused Design) */}
                    <div className="relative flex items-center justify-center p-6 md:p-8">
                      {/* ✅ REMOVED: Busy striped pattern - too distracting */}
                      {/* ✅ REMOVED: Animated gradient overlay - unnecessary noise */}
                      
                      {/* Content Card - Simplified Design */}
                      <div className="relative bg-white rounded-2xl p-6 md:p-8 shadow-xl max-w-lg">
                        {/* ✅ REMOVED: SALE badge - not needed on hero, feels "salesy" */}
                        
                        {/* ✅ PRIMARY: Large, bold value proposition */}
                        <h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-gray-900 mb-4 leading-tight">
                          {slide.title}
                        </h1>
                        
                        {/* ✅ SECONDARY: Supporting text with clear hierarchy */}
                        <p className="text-xl md:text-2xl font-semibold text-gray-700 mb-3">
                          {slide.subtitle}
                        </p>
                        
                        {/* ✅ TRUST: Social proof and benefits */}
                        <p className="text-base md:text-lg text-gray-600 mb-6">
                          {slide.description}
                        </p>
                        
                        {/* ✅ PROMINENT: Large, clear CTA button */}
                        <Link
                          to={slide.buttonLink}
                          className="inline-block bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-4 rounded-xl font-bold text-lg shadow-2xl hover:shadow-3xl transform hover:scale-105 transition-all duration-300 border-2 border-white/50"
                        >
                          {slide.buttonText} →
                        </Link>
                      </div>
                    </div>

                    {/* Right Side - Pet Image (Clean Design) */}
                    <div className="relative flex items-center justify-center overflow-hidden bg-gradient-to-br from-gray-100 to-gray-200">
                      <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
                      <img
                        src={slide.leftImage}
                        alt={slide.title}
                        className="w-full h-full object-cover"
                      />
                      {/* ✅ REMOVED: Trust badge - trust should be in copy, not badges */}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Enhanced Navigation Arrows */}
          <button
            onClick={prevSlide}
            className="absolute left-2 md:left-4 top-1/2 -translate-y-1/2 bg-white hover:bg-blue-600 text-gray-800 hover:text-white p-2 md:p-3 rounded-full transition-all shadow-lg hover:shadow-xl z-10 transform hover:scale-110 duration-300"
            aria-label="Previous slide"
          >
            <ChevronLeft size={20} />
          </button>
          <button
            onClick={nextSlide}
            className="absolute right-2 md:right-4 top-1/2 -translate-y-1/2 bg-white hover:bg-blue-600 text-gray-800 hover:text-white p-2 md:p-3 rounded-full transition-all shadow-lg hover:shadow-xl z-10 transform hover:scale-110 duration-300"
            aria-label="Next slide"
          >
            <ChevronRight size={20} />
          </button>

          {/* Modern Slide Indicators */}
          <div className="absolute bottom-3 md:bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-10 bg-white/70 backdrop-blur-sm px-3 py-1.5 rounded-full shadow-md">
            {slides.map((_, index) => (
              <button
                key={index}
                onClick={() => goToSlide(index)}
                className={`h-2 rounded-full transition-all duration-300 ${
                  index === currentSlide
                    ? 'bg-gradient-to-r from-blue-600 to-purple-600 w-8'
                    : 'bg-gray-400 w-2 hover:bg-gray-600 hover:w-4'
                }`}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Enhanced Promotional Cards Section */}
    </div>
  );
};

export default HeroSlideshow;

