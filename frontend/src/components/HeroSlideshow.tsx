import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { slideshowService } from '@/services/slideshow';
import LoadingSpinner from './LoadingSpinner';
import { Helmet } from 'react-helmet-async';
import { normalizeImageUrl, generateSrcSet } from '@/utils/imageUtils';

const HeroSlideshow = () => {
  const [currentSlide, setCurrentSlide] = useState(0);

  // Fetch slides from API - Optimized for LCP
  const { data: slides = [], isLoading } = useQuery({
    queryKey: ['slideshow', 'active'],
    queryFn: slideshowService.getActiveSlides,
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    gcTime: 10 * 60 * 1000, // Keep in cache for 10 minutes
    refetchOnWindowFocus: false,
    retry: 1,
    retryDelay: 100
  });

  // Preload hero images for better LCP
  useEffect(() => {
    if (slides.length === 0) return;
    
    // Preload first 2 slides - optimized for 1920x720 (16:6 ratio)
    const imagesToPreload = slides.slice(0, 2).map(slide => 
      normalizeImageUrl(slide.leftImage || slide.imageUrl, { 
        width: 1920, 
        height: 720, 
        format: 'auto'
      })
    );
    
    imagesToPreload.forEach(src => {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.as = 'image';
      link.href = src;
      document.head.appendChild(link);
    });
    
    imagesToPreload.forEach(src => {
      const img = new Image();
      img.src = src;
    });
  }, [slides]);

  // Preload the first slide image (LCP image)
  const firstSlideImage = slides.length > 0 
    ? normalizeImageUrl(slides[0].leftImage || slides[0].imageUrl, { 
        width: 1920, 
        height: 720, 
        format: 'auto'
      })
    : null;

  // Auto-advance slides every 5 seconds
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
          <div className="relative w-full overflow-hidden bg-gray-100 rounded-xl shadow-lg aspect-[16/6] flex items-center justify-center">
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
        <div className="container mx-auto px-4 md:px-6 lg:px-8 mt-4">
          <div className="relative w-full overflow-hidden rounded-xl shadow-lg">
            {/* Slides Container - Full-width banner images with consistent 16:6 ratio for all devices */}
            <div 
              className="relative w-full aspect-[16/6]"
              style={{ contain: 'layout style paint' }}
            >
              {slides.map((slide, index) => {
                const imageUrl = slide.leftImage || slide.imageUrl;
                const slideContent = (
                  <div
                    key={slide._id || slide.id}
                    className={`absolute inset-0 transition-all duration-1000 ${
                      index === currentSlide ? 'opacity-100 z-10' : 'opacity-0 z-0'
                    }`}
                  >
                    <img
                      src={normalizeImageUrl(imageUrl, { 
                        width: 1920, 
                        height: 720, 
                        format: 'auto'
                      })}
                      srcSet={generateSrcSet(imageUrl, [640, 768, 1024, 1280, 1920], { format: 'auto' })}
                      sizes="100vw"
                      alt={slide.title || 'Banner'}
                      width={1920}
                      height={720}
                      loading={index === 0 ? "eager" : "lazy"}
                      fetchPriority={index === 0 ? "high" : "auto"}
                      decoding={index === 0 ? "sync" : "async"}
                      className="w-full h-full object-cover"
                      style={{ 
                        objectFit: 'cover',
                        willChange: index === 0 ? 'contents' : undefined
                      }}
                      onError={(e) => {
                        // Fallback handling
                        const target = e.target as HTMLImageElement;
                        if (target.src !== imageUrl) {
                          target.src = imageUrl;
                        }
                      }}
                    />
                  </div>
                );

                // Make banner clickable if buttonLink is provided
                if (slide.buttonLink) {
                  return (
                    <Link
                      key={slide._id || slide.id}
                      to={slide.buttonLink}
                      className="block"
                    >
                      {slideContent}
                    </Link>
                  );
                }

                return slideContent;
              })}
            </div>

            {/* Navigation Arrows */}
            {slides.length > 1 && (
              <>
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
              </>
            )}

            {/* Slide Indicators */}
            {slides.length > 1 && (
              <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-2 z-20 bg-white/70 backdrop-blur-sm px-3 py-1.5 rounded-full shadow-md">
                {slides.map((_, index) => (
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
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default HeroSlideshow;
