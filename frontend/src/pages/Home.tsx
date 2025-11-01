import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { productService } from '@/services/products';
import ProductCard from '@/components/ProductCard';
import LoadingSpinner from '@/components/LoadingSpinner';
import HeroSlideshow from '@/components/HeroSlideshow';
import SEO from '@/components/SEO';
import StructuredData from '@/components/StructuredData';
import LiveStats from '@/components/LiveStats';
import CountdownTimer from '@/components/CountdownTimer';
import TrustBadges from '@/components/TrustBadges';
import FloatingDiscount from '@/components/FloatingDiscount';
import CategoryIcons from '@/components/CategoryIcons';
import { ChevronRight, ChevronLeft, Star, Shield, TrendingUp } from 'lucide-react';
import { useRef, useState, useEffect } from 'react';

const Home = () => {
  const { data: featuredProducts, isLoading } = useQuery({
    queryKey: ['products', 'featured'],
    queryFn: () => productService.getProducts({ featured: true, limit: 8 })
  });

  const petTypesScrollRef = useRef<HTMLDivElement>(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(false);

  const checkScrollPosition = () => {
    if (petTypesScrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = petTypesScrollRef.current;
      
      // Show left arrow if we can scroll left
      setShowLeftArrow(scrollLeft > 0);
      
      // Show right arrow if we can scroll right
      setShowRightArrow(scrollLeft < scrollWidth - clientWidth - 10);
    }
  };

  const scrollPetTypes = (direction: 'left' | 'right') => {
    if (petTypesScrollRef.current) {
      const scrollAmount = 300;
      const newScrollPosition = direction === 'left' 
        ? petTypesScrollRef.current.scrollLeft - scrollAmount
        : petTypesScrollRef.current.scrollLeft + scrollAmount;
      
      petTypesScrollRef.current.scrollTo({
        left: newScrollPosition,
        behavior: 'smooth'
      });
    }
  };

  useEffect(() => {
    const scrollContainer = petTypesScrollRef.current;
    
    // Check initial scroll position
    checkScrollPosition();
    
    // Check again after a short delay to ensure content is loaded
    const timer = setTimeout(checkScrollPosition, 100);
    
    // Add scroll event listener
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

  return (
    <div className="relative">
      <SEO />
      <StructuredData
        type="website"
        data={{}}
      />
      <StructuredData
        type="organization"
        data={{
          name: 'petshiwu',
          url: 'https://petshiwu.com',
          logo: 'https://petshiwu.com/logo.png',
          description: 'Everything Your Pet Needs - Quality Pet Supplies Online',
          contactPoint: {
            telephone: '+1-555-PETSHOP',
            contactType: 'customer service'
          }
        }}
      />

      {/* Live Stats Bar - Social Proof */}
      <LiveStats />

      {/* Hero Slideshow */}
      <div className="container mx-auto px-4 lg:px-8 mt-4">
        <HeroSlideshow />
      </div>

      {/* Flash Deal Section with Countdown */}
      <section className="py-8 bg-gradient-to-r from-purple-900 via-blue-900 to-indigo-900">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="text-white text-center md:text-left">
              <h2 className="text-3xl md:text-4xl font-black mb-2 gradient-text-vibrant">
                ⚡ Flash Sale Today Only!
              </h2>
              <p className="text-lg opacity-90">Hurry! Limited quantities available</p>
            </div>
            <CountdownTimer title="Ends in" />
          </div>
        </div>
      </section>

      {/* Trust Badges */}
      <TrustBadges />

      {/* Shop by Pet Type - New Design */}
      <section className="py-12 md:py-16 bg-gradient-to-b from-white to-gray-50">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-black mb-3 text-gray-900">Shop by Pet Type</h2>
            <p className="text-gray-600 text-lg">Find everything your furry, feathered, or scaly friend needs</p>
          </div>
          
          {/* Horizontal Scrollable Pet Types */}
          <div className="relative">
            {/* Left Arrow - Only show when scrollable */}
            {showLeftArrow && (
              <button
                onClick={() => scrollPetTypes('left')}
                className="hidden md:flex absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-white hover:bg-gray-100 text-gray-800 p-3 rounded-full shadow-lg hover:shadow-xl transition-all transform hover:scale-110"
                aria-label="Scroll left"
              >
                <ChevronLeft size={24} />
              </button>
            )}

            {/* Right Arrow - Only show when scrollable */}
            {showRightArrow && (
              <button
                onClick={() => scrollPetTypes('right')}
                className="hidden md:flex absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-white hover:bg-gray-100 text-gray-800 p-3 rounded-full shadow-lg hover:shadow-xl transition-all transform hover:scale-110"
                aria-label="Scroll right"
              >
                <ChevronRight size={24} />
              </button>
            )}

            <div ref={petTypesScrollRef} className="flex gap-6 md:gap-8 overflow-x-auto pb-6 scrollbar-hide snap-x snap-mandatory">
              {[
                { 
                  name: 'Dog', 
                  petType: 'dog', 
                  image: 'https://images.unsplash.com/photo-1534361960057-19889db9621e?w=400&h=400&fit=crop&q=90'
                },
                { 
                  name: 'Cat', 
                  petType: 'cat', 
                  image: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=400&h=400&fit=crop&q=90'
                },
                { 
                  name: 'Pet Parent', 
                  petType: 'dog', 
                  image: 'https://images.unsplash.com/photo-1450778869180-41d0601e046e?w=400&h=400&fit=crop&q=90'
                },
                { 
                  name: 'Horse', 
                  petType: 'other-animals', 
                  image: 'https://images.unsplash.com/photo-1593113598332-cd288d649433?w=400&h=400&fit=crop&q=90&auto=format'
                },
                { 
                  name: 'Wild bird', 
                  petType: 'other-animals', 
                  image: 'https://images.unsplash.com/photo-1444464666168-49d633b86797?w=400&h=400&fit=crop&q=90'
                },
                { 
                  name: 'Chicken', 
                  petType: 'other-animals', 
                  image: 'https://images.unsplash.com/photo-1612170153139-6f881ff067e0?w=400&h=400&fit=crop&q=90'
                },
                { 
                  name: 'Wildlife', 
                  petType: 'other-animals', 
                  image: 'https://images.unsplash.com/photo-1484406566174-9da000fda645?w=400&h=400&fit=crop&q=90'
                },
                { 
                  name: 'Pet bird', 
                  petType: 'other-animals', 
                  image: 'https://images.unsplash.com/photo-1552728089-57bdde30beb3?w=400&h=400&fit=crop&q=90'
                },
                { 
                  name: 'Small pet', 
                  petType: 'other-animals', 
                  image: 'https://images.unsplash.com/photo-1548767797-d8c844163c4c?w=400&h=400&fit=crop&q=90'
                },
                { 
                  name: 'Livestock', 
                  petType: 'other-animals', 
                  image: 'https://images.unsplash.com/photo-1506755855567-92ff770e8d00?w=400&h=400&fit=crop&q=90'
                },
                { 
                  name: 'Reptile', 
                  petType: 'other-animals', 
                  image: 'https://images.unsplash.com/photo-1551963831-b3b1ca40c98e?w=400&h=400&fit=crop&q=90&auto=format'
                },
                { 
                  name: 'Fish', 
                  petType: 'other-animals', 
                  image: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=400&h=400&fit=crop&q=90&auto=format'
                }
              ].map((category, index) => (
                <Link
                  key={index}
                  to={`/products?petType=${category.petType}`}
                  className="flex-shrink-0 snap-center group"
                >
                  <div className="flex flex-col items-center gap-3">
                    {/* Circular Image with Uniform Gradient Border */}
                    <div className="relative w-32 h-32 md:w-40 md:h-40 rounded-full bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 p-1 transform group-hover:scale-110 transition-all duration-300 shadow-lg group-hover:shadow-2xl">
                      <div className="w-full h-full rounded-full overflow-hidden bg-white">
                        <img 
                          src={category.image} 
                          alt={category.name}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            // Fallback to placeholder if image fails to load
                            const target = e.currentTarget;
                            target.src = `https://via.placeholder.com/400x400/cccccc/666666?text=${encodeURIComponent(category.name)}`;
                          }}
                          loading="lazy"
                        />
                      </div>
                      {/* Decorative overlay on hover */}
                      <div className="absolute inset-0 rounded-full bg-gradient-to-t from-blue-600/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    </div>
                    {/* Label */}
                    <p className="text-base md:text-lg font-bold text-gray-800 group-hover:text-blue-600 transition-colors duration-300">
                      {category.name}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
            
            {/* Scroll Indicator for Mobile */}
            <div className="flex md:hidden justify-center gap-2 mt-4">
              <div className="w-2 h-2 rounded-full bg-blue-600"></div>
              <div className="w-2 h-2 rounded-full bg-gray-300"></div>
              <div className="w-2 h-2 rounded-full bg-gray-300"></div>
            </div>
          </div>
        </div>
      </section>

      {/* Category Icons - Find all your pet's must-haves */}
      <CategoryIcons />

      {/* Featured Products with Enhanced Design */}
      <section className="py-16 bg-gradient-to-b from-white via-blue-50 to-white relative overflow-hidden">
        {/* Decorative Background Elements */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-200 rounded-full opacity-10 blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-purple-200 rounded-full opacity-10 blur-3xl"></div>

        <div className="container mx-auto px-4 lg:px-8 relative z-10">
          {/* Section Header with Psychological Trigger */}
          <div className="text-center mb-12 animate-fade-in-up">
            <div className="inline-flex items-center gap-2 bg-gradient-to-r from-yellow-400 to-orange-500 text-white px-6 py-2 rounded-full font-bold text-sm mb-4 shadow-lg animate-pulse-slow">
              <Star size={16} className="fill-white" />
              <span>Most Popular This Week</span>
              <Star size={16} className="fill-white" />
            </div>
            <h2 className="text-4xl md:text-5xl font-black mb-3 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
              Trending Products
            </h2>
            <p className="text-gray-600 text-lg max-w-2xl mx-auto">
              Join thousands of happy pet parents who trust these best-selling products
            </p>
          </div>

          {isLoading ? (
            <div className="py-12">
              <LoadingSpinner size="lg" />
            </div>
          ) : (
            <>
              {/* Horizontal Scrolling Container */}
              <div className="relative mb-8">
                <div 
                  className="overflow-x-auto scrollbar-hide pb-4" 
                  style={{ 
                    scrollbarWidth: 'none', 
                    msOverflowStyle: 'none',
                    WebkitOverflowScrolling: 'touch'
                  }}
                >
                  <style>{`
                    .scrollbar-hide::-webkit-scrollbar {
                      display: none;
                    }
                  `}</style>
                  <div className="flex gap-4 md:gap-5">
                    {featuredProducts?.data.map((product) => (
                      <div key={product._id} className="flex-shrink-0 w-56 md:w-60 lg:w-64 animate-fade-in-up h-full">
                        <div className="h-full flex flex-col">
                          <ProductCard product={product} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* View All Button */}
              <div className="text-center">
                <Link
                  to="/products?featured=true"
                  className="inline-flex items-center gap-3 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 text-white px-8 py-4 rounded-full font-bold text-lg hover:shadow-2xl transition-all transform hover:scale-105 btn-ripple"
                >
                  <span>View All Products</span>
                  <ChevronRight size={24} />
                </Link>
              </div>
            </>
          )}
        </div>
      </section>

      {/* Features - Enhanced with Statistics */}
      <section className="py-16 md:py-20 bg-gradient-to-br from-blue-600 via-purple-700 to-pink-600 relative overflow-hidden">
        {/* Animated Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-full h-full" style={{
            backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)',
            backgroundSize: '50px 50px'
          }}></div>
        </div>

        <div className="container mx-auto px-4 lg:px-8 relative z-10">
          <div className="text-center mb-12 text-white">
            <h2 className="text-4xl md:text-5xl font-black mb-4">Why 50,000+ Pet Parents Choose Us</h2>
            <p className="text-xl opacity-90 max-w-2xl mx-auto">
              Join our growing community of happy customers
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 stagger-animation">
            <div className="group bg-white/10 backdrop-blur-lg rounded-2xl p-8 text-center shadow-2xl hover:shadow-3xl transition-all hover:-translate-y-2 border border-white/20">
              <div className="bg-gradient-to-br from-blue-400 to-blue-600 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform shadow-xl">
                <div className="text-5xl float">🚚</div>
              </div>
              <h3 className="text-2xl font-black mb-3 text-white">Free Shipping</h3>
              <p className="text-white/90 leading-relaxed text-lg mb-4">
                Get free delivery on orders over $49
              </p>
              <div className="bg-white/20 backdrop-blur-md rounded-lg px-4 py-2 inline-block">
                <p className="text-sm font-bold text-white">🎯 98% On-Time Delivery</p>
              </div>
            </div>
            <div className="group bg-white/10 backdrop-blur-lg rounded-2xl p-8 text-center shadow-2xl hover:shadow-3xl transition-all hover:-translate-y-2 border border-white/20">
              <div className="bg-gradient-to-br from-green-400 to-green-600 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform shadow-xl">
                <div className="text-5xl float" style={{animationDelay: '0.5s'}}>🔄</div>
              </div>
              <h3 className="text-2xl font-black mb-3 text-white">Autoship & Save 10%</h3>
              <p className="text-white/90 leading-relaxed text-lg mb-4">
                Never run out! Automatic deliveries
              </p>
              <div className="bg-white/20 backdrop-blur-md rounded-lg px-4 py-2 inline-block">
                <p className="text-sm font-bold text-white">💰 Average Savings: $240/year</p>
              </div>
            </div>
            <div className="group bg-white/10 backdrop-blur-lg rounded-2xl p-8 text-center shadow-2xl hover:shadow-3xl transition-all hover:-translate-y-2 border border-white/20">
              <div className="bg-gradient-to-br from-yellow-400 to-orange-500 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform shadow-xl">
                <div className="text-5xl float" style={{animationDelay: '1s'}}>⭐</div>
              </div>
              <h3 className="text-2xl font-black mb-3 text-white">Premium Quality</h3>
              <p className="text-white/90 leading-relaxed text-lg mb-4">
                Only verified & trusted brands
              </p>
              <div className="bg-white/20 backdrop-blur-md rounded-lg px-4 py-2 inline-block">
                <p className="text-sm font-bold text-white">⭐ 4.8/5 Average Rating</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Call to Action - Enhanced with Social Proof */}
      <section className="py-20 md:py-28 bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 text-white relative overflow-hidden">
        {/* Animated Background Shapes */}
        <div className="absolute inset-0">
          <div className="absolute top-10 left-10 w-64 h-64 bg-blue-500 rounded-full opacity-20 blur-3xl animate-pulse"></div>
          <div className="absolute bottom-10 right-10 w-96 h-96 bg-pink-500 rounded-full opacity-20 blur-3xl animate-pulse" style={{animationDelay: '1s'}}></div>
        </div>
        
        <div className="container mx-auto px-4 lg:px-8 text-center relative z-10">
          <div className="max-w-4xl mx-auto">
            {/* Social Proof Badge */}
            <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-md text-white px-6 py-3 rounded-full font-bold text-sm mb-6 shadow-lg animate-fade-in-up">
              <Shield size={18} />
              <span>Trusted by 50,000+ Pet Parents</span>
            </div>

            <div className="text-7xl md:text-8xl mb-6 animate-bounce-slow">🎁</div>
            <h2 className="text-4xl md:text-6xl font-black mb-6 leading-tight">
              Never Run Out. Save 10% Every Order.
            </h2>
            <p className="text-xl md:text-2xl mb-4 leading-relaxed opacity-95">
              Join our <span className="font-black text-yellow-300">Autoship Program</span> and get your pet's favorites delivered automatically
            </p>
            <p className="text-lg mb-10 opacity-80">
              ✓ Free shipping ✓ Cancel anytime ✓ Flexible scheduling ✓ Skip or modify orders
            </p>

            {/* Stats Row */}
            <div className="grid grid-cols-3 gap-4 md:gap-8 mb-10 max-w-2xl mx-auto">
              <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/20">
                <p className="text-3xl font-black mb-1">10%</p>
                <p className="text-sm opacity-90">You Save</p>
              </div>
              <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/20">
                <p className="text-3xl font-black mb-1">45K+</p>
                <p className="text-sm opacity-90">Active Autoship</p>
              </div>
              <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/20">
                <p className="text-3xl font-black mb-1">FREE</p>
                <p className="text-sm opacity-90">Shipping</p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/products"
                className="inline-flex items-center justify-center gap-2 bg-white text-indigo-900 px-10 py-5 rounded-xl font-black text-lg hover:bg-gray-100 hover:shadow-2xl transition-all transform hover:scale-105 btn-ripple shadow-xl"
              >
                <span>Start Shopping Now</span>
                <ChevronRight size={24} />
              </Link>
              <Link
                to="/autoship"
                className="inline-flex items-center justify-center gap-2 bg-transparent border-3 border-white text-white px-10 py-5 rounded-xl font-black text-lg hover:bg-white hover:text-indigo-900 transition-all transform hover:scale-105"
              >
                <span>How It Works</span>
              </Link>
            </div>

            {/* Trust Indicators */}
            <div className="mt-12 flex items-center justify-center gap-8 flex-wrap opacity-75">
              <div className="flex items-center gap-2">
                <Shield size={20} />
                <span className="text-sm">Secure Checkout</span>
              </div>
              <div className="flex items-center gap-2">
                <Star size={20} className="fill-yellow-300 text-yellow-300" />
                <span className="text-sm">4.8/5 Rating</span>
              </div>
              <div className="flex items-center gap-2">
                <TrendingUp size={20} />
                <span className="text-sm">#1 Pet Store</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Floating Discount Popup */}
      <FloatingDiscount />
    </div>
  );
};

export default Home;



