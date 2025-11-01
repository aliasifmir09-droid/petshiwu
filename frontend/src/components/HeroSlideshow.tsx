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
      title: 'Free $20 eGift Card',
      subtitle: 'With your $49+ order.',
      description: 'Shop the best for your pets!',
      buttonText: 'Shop now',
      buttonLink: '/products',
      leftImage: 'https://images.unsplash.com/photo-1574158622682-e40e69881006?w=800&h=600&fit=crop&q=80', // White cat with Christmas theme
      backgroundColor: 'bg-gradient-to-br from-blue-50 via-white to-purple-50',
      theme: 'holiday'
    },
    {
      id: 2,
      title: 'Up to 40% Off',
      subtitle: 'Premium Pet Food & Treats',
      description: 'Limited time offer!',
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
      {/* Top Promotional Banner - Slim Version */}
      <Link to="/products">
        <div className="relative overflow-hidden bg-gradient-to-r from-emerald-400 via-green-400 to-teal-400 py-2.5 text-center shadow-sm hover:shadow-md transition-all duration-300 cursor-pointer group">
          <div className="absolute inset-0 bg-gradient-to-r from-yellow-200 via-transparent to-yellow-200 opacity-0 group-hover:opacity-20 transition-opacity duration-500"></div>
          <p className="text-sm md:text-base font-semibold text-white drop-shadow-sm relative z-10">
            🎁 FREE $20 eGift Card with $49+ Order • Limited Time! 🎁
          </p>
        </div>
      </Link>

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
                    
                    {/* Left Side - Content with Enhanced Striped Background */}
                    <div className="relative flex items-center justify-center p-4 md:p-6 overflow-hidden">
                      {/* Modern Diagonal Striped Pattern */}
                      <div className="absolute inset-0 opacity-80" style={{
                        backgroundImage: `repeating-linear-gradient(
                          45deg,
                          #1E3A8A 0px,
                          #1E3A8A 30px,
                          #3B82F6 30px,
                          #3B82F6 50px,
                          #ffffff 50px,
                          #ffffff 60px,
                          #EF4444 60px,
                          #EF4444 90px,
                          #ffffff 90px,
                          #ffffff 100px,
                          #1E3A8A 100px,
                          #1E3A8A 130px
                        )`
                      }}></div>

                      {/* Animated Gradient Overlay */}
                      <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 via-transparent to-purple-500/10 animate-pulse"></div>

                      {/* Content Card with Glass Effect */}
                      <div className="relative bg-white/95 backdrop-blur-sm rounded-2xl p-4 md:p-6 shadow-xl max-w-sm border border-white/50 transform hover:scale-105 transition-transform duration-300">
                        <div className="absolute -top-2 -right-2 bg-gradient-to-r from-red-500 to-pink-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-md">
                          SALE
                        </div>
                        <h1 className="text-2xl md:text-3xl lg:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600 mb-2 leading-tight">
                          {slide.title}
                        </h1>
                        <p className="text-base md:text-lg font-semibold text-gray-700 mb-1">
                          {slide.subtitle}
                        </p>
                        <p className="text-xs md:text-sm text-gray-600 mb-3">
                          {slide.description}
                        </p>
                        <Link
                          to={slide.buttonLink}
                          className="inline-block bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-2.5 rounded-full font-bold text-sm hover:from-blue-700 hover:to-purple-700 transition-all shadow-md hover:shadow-lg transform hover:-translate-y-0.5 duration-300"
                        >
                          {slide.buttonText} →
                        </Link>
                        <p className="text-xs text-gray-500 mt-2 italic">
                          *Exclusions apply.
                        </p>
                      </div>
                    </div>

                    {/* Right Side - Pet Image with Overlay */}
                    <div className="relative flex items-center justify-center overflow-hidden bg-gradient-to-br from-gray-100 to-gray-200">
                      <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
                      <img
                        src={slide.leftImage}
                        alt={slide.title}
                        className="w-full h-full object-cover transform hover:scale-110 transition-transform duration-700"
                      />
                      {/* Decorative Corner Badge */}
                      <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm px-4 py-2 rounded-full shadow-lg">
                        <p className="text-xs font-bold text-blue-600">🐾 Trusted Quality</p>
                      </div>
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
      <div className="container mx-auto px-4 md:px-6 lg:px-8 mt-6 mb-8">
        <div className="grid md:grid-cols-3 gap-5">
          {/* Hey Friend Card - Enhanced */}
          <div className="relative bg-gradient-to-br from-gray-50 to-gray-100 p-5 rounded-xl shadow-md hover:shadow-lg transition-all duration-300 border border-gray-200 group hover:scale-105 min-h-[100px]">
            <div className="absolute top-0 right-0 w-24 h-24 bg-blue-200 rounded-full -mr-12 -mt-12 opacity-20 group-hover:scale-150 transition-transform duration-500 overflow-hidden"></div>
            <div className="relative z-10">
              <h2 className="text-xl md:text-2xl font-black text-gray-800 flex items-center gap-2 mb-3">
                <span className="text-2xl">👋</span> Hey, friend!
              </h2>
              <Link
                to="/login"
                className="block w-full bg-gradient-to-r from-blue-600 via-purple-600 to-purple-700 text-white px-4 py-3 rounded-full font-bold text-sm sm:text-base hover:from-blue-700 hover:via-purple-700 hover:to-purple-800 transition-all shadow-sm hover:shadow-md transform hover:-translate-y-0.5 duration-300 text-center"
              >
                Sign In or Create Account
              </Link>
            </div>
          </div>

          {/* Autoship Promo - Enhanced */}
          <Link
            to="/products"
            className="hidden md:block relative bg-gradient-to-br from-blue-50 to-blue-100 p-5 rounded-xl shadow-md hover:shadow-lg transition-all duration-300 border border-blue-200 group hover:scale-105 min-h-[100px]"
          >
            <div className="absolute top-0 right-0 w-24 h-24 bg-blue-300 rounded-full -mr-12 -mt-12 opacity-20 group-hover:scale-150 transition-transform duration-500 overflow-hidden"></div>
            <div className="absolute top-2 right-2 bg-gradient-to-r from-orange-500 to-red-500 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-md z-20">
              35% OFF
            </div>
            <div className="relative z-10 flex items-center gap-4">
              <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-3.5 rounded-xl shadow-md group-hover:scale-110 transition-transform duration-300 flex-shrink-0">
                <svg className="w-7 h-7 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M9 16.2L4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4L9 16.2z"/>
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-base md:text-lg text-gray-800 group-hover:text-blue-600 transition-colors mb-1">
                  Save 35% on first order
                </p>
                <p className="text-sm text-gray-600">
                  Set up an Autoship
                </p>
              </div>
            </div>
          </Link>

          {/* Pharmacy Promo - Enhanced */}
          <Link
            to="/products?search=pharmacy"
            className="hidden md:block relative bg-gradient-to-br from-purple-50 to-purple-100 p-5 rounded-xl shadow-md hover:shadow-lg transition-all duration-300 border border-purple-200 group hover:scale-105 min-h-[100px]"
          >
            <div className="absolute top-0 right-0 w-24 h-24 bg-purple-300 rounded-full -mr-12 -mt-12 opacity-20 group-hover:scale-150 transition-transform duration-500 overflow-hidden"></div>
            <div className="absolute top-2 right-2 bg-gradient-to-r from-green-500 to-emerald-500 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-md z-20">
              20% OFF
            </div>
            <div className="relative z-10 flex items-center gap-4">
              <div className="bg-gradient-to-br from-purple-500 to-purple-600 p-3.5 rounded-xl shadow-md group-hover:scale-110 transition-transform duration-300 flex-shrink-0">
                <svg className="w-7 h-7 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M21,7L9,19L3.5,13.5L4.91,12.09L9,16.17L19.59,5.59L21,7Z"/>
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-base md:text-lg text-gray-800 group-hover:text-purple-600 transition-colors mb-1">
                  Save 20% on pharmacy
                </p>
                <p className="text-sm text-gray-600">
                  Fill a prescription
                </p>
              </div>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default HeroSlideshow;

