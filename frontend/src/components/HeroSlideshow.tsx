import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { slideshowService } from '@/services/slideshow';
import LoadingSpinner from './LoadingSpinner';
import { Helmet } from 'react-helmet-async';

const HeroSlideshow = () => {
  const [currentSlide, setCurrentSlide] = useState(0);

  // Fetch slides from API
  const { data: slides = [], isLoading } = useQuery({
    queryKey: ['slideshow', 'active'],
    queryFn: slideshowService.getActiveSlides,
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    gcTime: 10 * 60 * 1000, // Keep in cache for 10 minutes
    refetchOnWindowFocus: false
  });

  // Preload the first slide image (LCP image) for better performance
  const firstSlideImage = slides.length > 0 ? (slides[0].leftImage || slides[0].imageUrl) : null;

  // Auto-advance slides every 5 seconds (only if slides exist)
  useEffect(() => {
    if (slides.length === 0) return;
    
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

  // Show loading spinner while fetching
  if (isLoading) {
    return (
      <div className="w-full mt-4">
        <div className="container mx-auto px-4 md:px-6 lg:px-8 mt-4">
          <div className="relative w-full overflow-hidden bg-white rounded-xl shadow-lg h-[260px] md:h-[280px] lg:h-[300px] flex items-center justify-center">
            <LoadingSpinner />
          </div>
        </div>
      </div>
    );
  }

  // Don't render if no slides
  if (slides.length === 0) {
    return null;
  }

  return (
    <>
      {/* Preload LCP image for first slide */}
      {firstSlideImage && (
        <Helmet>
          <link rel="preload" as="image" href={firstSlideImage} fetchPriority="high" />
        </Helmet>
      )}
      <div className="w-full mt-4">
        {/* Main Slideshow */}
        <div className="container mx-auto px-4 md:px-6 lg:px-8 mt-4">
        <div className="relative w-full overflow-hidden bg-white rounded-xl shadow-lg">
          {/* Slides Container */}
          <div className="relative w-full h-[260px] md:h-[280px] lg:h-[300px]">
            {slides.map((slide, index) => (
              <div
                key={slide._id || slide.id}
                className={`absolute inset-0 transition-all duration-1000 ${
                  index === currentSlide ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
                }`}
              >
                <div className={`w-full h-full ${slide.backgroundColor || 'bg-gradient-to-br from-blue-50 via-white to-purple-50'}`}>
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
                        src={slide.leftImage || slide.imageUrl}
                        alt={slide.title}
                        width={576}
                        height={432}
                        loading={index === 0 ? "eager" : "lazy"}
                        fetchPriority={index === 0 ? "high" : "auto"}
                        className="w-full h-full object-cover transform hover:scale-110 transition-transform duration-700"
                        onError={(e) => {
                          // Fallback to imageUrl if leftImage fails
                          if (slide.leftImage && slide.imageUrl && (e.target as HTMLImageElement).src !== slide.imageUrl) {
                            (e.target as HTMLImageElement).src = slide.imageUrl;
                          }
                        }}
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
    </div>
    </>
  );
};

export default HeroSlideshow;

