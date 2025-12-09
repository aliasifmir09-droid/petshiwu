import { useQuery } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import { productService } from '@/services/products';
import ProductCard from '@/components/ProductCard';
import LoadingSpinner from '@/components/LoadingSpinner';
import HeroSlideshow from '@/components/HeroSlideshow';
import SEO from '@/components/SEO';
import StructuredData from '@/components/StructuredData';
import TrustBadges from '@/components/TrustBadges';
import { ChevronRight, ChevronLeft, Star } from 'lucide-react';
import { useRef, useState, useEffect, useMemo } from 'react';
import { hasImageFailed } from '@/hooks/useImageLoadTracker';

const Home = () => {
  const navigate = useNavigate();
  const { data: featuredProducts, isLoading } = useQuery({
    queryKey: ['products', 'featured'],
    queryFn: () => productService.getProducts({ featured: true, limit: 8 })
  });

  const petTypesScrollRef = useRef<HTMLDivElement>(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(false);

  // Memoize filtered products - must be at top level, not in JSX
  const filteredFeaturedProducts = useMemo(() => {
    if (!featuredProducts?.data) return [];
    return featuredProducts.data.filter((product) => {
      const productId = product._id ? String(product._id) : null;
      return productId && !hasImageFailed(productId);
    });
  }, [featuredProducts?.data]);

  useEffect(() => {
    const scrollContainer = petTypesScrollRef.current;
    
    const checkScrollPosition = () => {
      if (petTypesScrollRef.current) {
        const { scrollLeft, scrollWidth, clientWidth } = petTypesScrollRef.current;
        
        // Show left arrow if we can scroll left
        setShowLeftArrow(scrollLeft > 0);
        
        // Show right arrow if we can scroll right
        setShowRightArrow(scrollLeft < scrollWidth - clientWidth - 10);
      }
    };
    
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
  }, []); // Empty deps are fine since we only want this to run once on mount

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

  return (
    <div className="relative">
      <SEO
        description="Shop premium pet food, dog food, cat food, toys, and supplies for dogs, cats, birds, and more. Quality products, fast shipping, great prices."
      />
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
            telephone: '+1-800-738-7449',
            contactType: 'customer service'
          }
        }}
      />


      {/* Hero Slideshow */}
      <div className="container mx-auto px-4 lg:px-8 mt-4">
        <HeroSlideshow />
      </div>

      {/* Special Offers Section */}
      <section className="py-12 md:py-16 mt-8 md:mt-12 bg-gradient-to-r from-purple-900 via-blue-900 to-indigo-900 relative overflow-hidden">
        {/* Animated Background Effects */}
        <div className="absolute inset-0 z-0">
          <div className="absolute top-0 left-0 w-96 h-96 bg-pink-500 rounded-full opacity-20 blur-3xl animate-pulse"></div>
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-blue-500 rounded-full opacity-20 blur-3xl animate-pulse" style={{animationDelay: '1s'}}></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-purple-500 rounded-full opacity-10 blur-3xl animate-pulse" style={{animationDelay: '2s'}}></div>
        </div>
        
        <div className="container mx-auto px-4 lg:px-8 relative z-10">
          <div className="flex flex-col md:flex-row items-center justify-between gap-8">
            {/* Left Side - Special Offers */}
            <div className="text-white text-center md:text-left relative z-30 flex-1">
              <div className="inline-block mb-4 px-4 py-2 bg-white/20 backdrop-blur-md rounded-full border border-white/30">
                <span className="text-sm font-bold uppercase tracking-wider">Special Offers</span>
              </div>
              <h2 className="text-4xl md:text-5xl lg:text-6xl font-black mb-4 relative z-30 leading-tight">
                <span className="bg-gradient-to-r from-pink-400 via-yellow-300 to-pink-400 bg-clip-text text-transparent animate-gradient">
                  Premium Pet Products
                </span>
              </h2>
              <p className="text-xl md:text-2xl opacity-95 mb-2 relative z-30 font-semibold">
                Quality You Can Trust
              </p>
              <p className="text-lg md:text-xl opacity-90 relative z-30">
                Discover our curated selection of <span className="font-bold text-yellow-300">verified premium products</span> for your beloved pets
              </p>
              <div className="mt-6 flex flex-wrap items-center gap-4 justify-center md:justify-start">
                <div className="flex items-center gap-2 bg-white/10 backdrop-blur-md px-4 py-2 rounded-lg border border-white/20">
                  <span className="text-sm font-semibold">Exclusive Deals</span>
                </div>
                <div className="flex items-center gap-2 bg-white/10 backdrop-blur-md px-4 py-2 rounded-lg border border-white/20">
                  <span className="text-sm font-semibold">Free Shipping Over $49</span>
                </div>
              </div>
            </div>
            
            {/* Right Side - Call to Action */}
            <div className="relative z-30 flex-shrink-0">
              <Link
                to="/products?featured=true"
                className="inline-block bg-gradient-to-r from-orange-500 via-pink-500 to-purple-600 text-white px-8 py-6 rounded-3xl shadow-2xl border-2 border-white/30 backdrop-blur-sm transform hover:scale-105 transition-all duration-300 text-center"
              >
                <div className="flex flex-col items-center gap-3">
                  <p className="text-base font-bold uppercase tracking-wider">Shop Now</p>
                  <p className="text-2xl font-black">Featured Products</p>
                </div>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Trust Badges */}
      <TrustBadges />

      {/* Shop by Pet Type - Enhanced Modern Design */}
      <section className="py-12 md:py-16 bg-gradient-to-b from-white via-blue-50/30 to-white relative overflow-hidden">
        {/* Decorative background elements */}
        <div className="absolute top-0 left-0 w-72 h-72 bg-blue-200 rounded-full opacity-10 blur-3xl z-0"></div>
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-purple-200 rounded-full opacity-10 blur-3xl z-0"></div>
        
        <div className="container mx-auto px-4 lg:px-8 relative z-10">
          <div className="text-center mb-12 relative z-30">
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-black mb-3 relative z-30" style={{ 
              background: 'linear-gradient(to right, #2563eb, #9333ea, #db2777)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              color: '#9333ea'
            }}>
              Shop by Pet Type
            </h2>
            <p className="text-gray-600 text-lg md:text-xl max-w-2xl mx-auto relative z-30">
              Find everything your furry, feathered, or scaly friend needs
            </p>
          </div>
          
          {/* Horizontal Scrollable Pet Types */}
          <div className="relative overflow-visible">
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

            <div ref={petTypesScrollRef} className="flex gap-6 md:gap-8 overflow-x-auto overflow-y-visible pb-6 pt-6 scrollbar-hide snap-x snap-mandatory">
              {[
                { 
                  name: 'Dog', 
                  petType: 'dog', 
                  slug: 'dog',
                  image: 'https://images.unsplash.com/photo-1534361960057-19889db9621e?w=500&h=500&fit=crop&q=90'
                },
                { 
                  name: 'Cat', 
                  petType: 'cat', 
                  slug: 'cat',
                  image: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=500&h=500&fit=crop&q=90'
                },
                { 
                  name: 'Fish', 
                  petType: 'fish', 
                  slug: 'fish',
                  image: 'https://res.cloudinary.com/dtmes0dha/image/upload/v1764591467/493202359_yqxjl5.jpg'
                },
                { 
                  name: 'Bird', 
                  petType: 'bird', 
                  slug: 'bird',
                  image: 'https://images.unsplash.com/photo-1552728089-57bdde30beb3?w=500&h=500&fit=crop&q=90'
                },
                { 
                  name: 'Reptile', 
                  petType: 'reptile', 
                  slug: 'reptile',
                  image: 'https://res.cloudinary.com/dtmes0dha/image/upload/v1764591422/OIP_d5mo8l.webp'
                },
                { 
                  name: 'Small Pet', 
                  petType: 'small-pet', 
                  slug: 'small-pet',
                  image: 'https://images.unsplash.com/photo-1548767797-d8c844163c4c?w=500&h=500&fit=crop&q=90'
                },
                { 
                  name: 'Chicken & Poultry', 
                  petType: 'chicken-poultry', 
                  slug: 'chicken-poultry',
                  image: 'https://images.unsplash.com/photo-1612170153139-6f881ff067e0?w=500&h=500&fit=crop&q=90'
                },
                { 
                  name: 'Cow', 
                  petType: 'cow', 
                  slug: 'cow',
                  image: 'https://images.unsplash.com/photo-1506755855567-92ff770e8d00?w=500&h=500&fit=crop&q=90'
                },
                { 
                  name: 'Duck', 
                  petType: 'duck', 
                  slug: 'duck',
                  image: 'https://images.unsplash.com/photo-1522926193341-e9ffd686c60f?w=500&h=500&fit=crop&q=90'
                },
                { 
                  name: 'Goat', 
                  petType: 'goat', 
                  slug: 'goat',
                  image: 'https://images.unsplash.com/photo-1544966503-7cc5ac882d5f?w=500&h=500&fit=crop&q=90'
                },
                { 
                  name: 'Horse', 
                  petType: 'horse', 
                  slug: 'horse',
                  image: 'https://images.unsplash.com/photo-1593113598332-cd288d649433?w=500&h=500&fit=crop&q=90&auto=format'
                },
                { 
                  name: 'Pig', 
                  petType: 'pig', 
                  slug: 'pig',
                  image: 'https://images.unsplash.com/photo-1583212292454-1fe6229603b7?w=500&h=500&fit=crop&q=90'
                },
                { 
                  name: 'Sheep', 
                  petType: 'sheep', 
                  slug: 'sheep',
                  image: 'https://images.unsplash.com/photo-1516467508483-a7212febe31a?w=500&h=500&fit=crop&q=90'
                },
                { 
                  name: 'Wild Bird', 
                  petType: 'wild-bird', 
                  slug: 'wild-bird',
                  image: 'https://images.unsplash.com/photo-1444464666168-49d633b86797?w=500&h=500&fit=crop&q=90'
                },
                { 
                  name: 'Pond', 
                  petType: 'pond', 
                  slug: 'pond',
                  image: 'https://images.unsplash.com/photo-1560774358-d8b19d75c5b9?w=500&h=500&fit=crop&q=90'
                }
              ].map((category, index) => (
                <div
                  key={`${category.slug}-${index}`}
                  className="flex-shrink-0 snap-center group cursor-pointer"
                  onClick={() => {
                    // Navigate to products page with specific pet type filter
                    navigate(`/products?petType=${category.slug}`);
                  }}
                >
                  <div className="flex flex-col items-center gap-3 w-full">
                    {/* Circular Image with Enhanced Gradient Border */}
                    <div className="relative w-32 h-32 md:w-40 md:h-40 lg:w-44 lg:h-44 rounded-full bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 p-[3px] transform group-hover:scale-110 transition-all duration-300 shadow-lg group-hover:shadow-2xl group-hover:from-blue-600 group-hover:via-purple-600 group-hover:to-pink-600 origin-center">
                      <div className="w-full h-full rounded-full overflow-hidden bg-white">
                        <img 
                          src={category.image} 
                          alt={category.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          onError={(e) => {
                            // Fallback to placeholder if image fails to load
                            const target = e.currentTarget;
                            // Use SVG data URI - no external requests needed
                            const svg = `<svg width="400" height="400" xmlns="http://www.w3.org/2000/svg"><rect width="400" height="400" fill="#f3f4f6"/><text x="50%" y="50%" font-family="Arial, sans-serif" font-size="18" font-weight="bold" fill="#6b7280" text-anchor="middle" dy=".3em">${category.name}</text></svg>`;
                            target.src = `data:image/svg+xml;base64,${btoa(svg)}`;
                          }}
                          loading="lazy"
                        />
                      </div>
                      {/* Decorative overlay on hover */}
                      <div className="absolute inset-0 rounded-full bg-gradient-to-t from-blue-600/20 via-purple-600/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                      {/* Pulse effect on hover */}
                      <div className="absolute inset-0 rounded-full border-2 border-blue-400 opacity-0 group-hover:opacity-50 group-hover:animate-ping"></div>
                    </div>
                    {/* Label with enhanced styling */}
                    <p className="text-sm md:text-base lg:text-lg font-bold text-gray-800 group-hover:text-blue-600 transition-colors duration-300 text-center px-2 max-w-[120px] md:max-w-[140px]">
                      {category.name}
                    </p>
                  </div>
                </div>
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

      {/* Featured Products with Enhanced Design */}
      <section className="py-16 bg-gradient-to-b from-white via-blue-50 to-white relative overflow-hidden">
        {/* Decorative Background Elements */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-200 rounded-full opacity-10 blur-3xl z-0"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-purple-200 rounded-full opacity-10 blur-3xl z-0"></div>

        <div className="container mx-auto px-4 lg:px-8 relative z-10">
          {/* Section Header with Psychological Trigger */}
          <div className="text-center mb-12 animate-fade-in-up relative z-30">
            <div className="inline-flex items-center gap-2 bg-gradient-to-r from-yellow-400 to-orange-500 text-white px-6 py-2 rounded-full font-bold text-sm mb-4 shadow-lg relative z-30">
              <Star size={16} className="fill-white" />
              <span>Featured Products</span>
              <Star size={16} className="fill-white" />
            </div>
            <h2 className="text-4xl md:text-5xl font-black mb-3 relative z-30" style={{ 
              background: 'linear-gradient(to right, #2563eb, #9333ea, #db2777)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              color: '#9333ea'
            }}>
              Trending Products
            </h2>
            <p className="text-gray-600 text-lg max-w-2xl mx-auto relative z-30">
              Trusted by pet parents nationwide - premium quality products for your furry friends
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
                  <div className="flex gap-4 md:gap-5 items-stretch">
                    {filteredFeaturedProducts.map((product, index) => (
                      <div key={product._id} className="flex-shrink-0 w-56 md:w-60 lg:w-64 animate-fade-in-up">
                        <ProductCard 
                          product={product} 
                          hideCartButton={true}
                          index={index}
                          priority={index < 4}
                        />
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

      {/* Features - What We Offer */}
      <section className="py-16 md:py-20 bg-gradient-to-br from-blue-600 via-purple-700 to-pink-600 relative overflow-hidden">
        {/* Animated Background Pattern */}
        <div className="absolute inset-0 opacity-10 z-0">
          <div className="absolute top-0 left-0 w-full h-full" style={{
            backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)',
            backgroundSize: '50px 50px'
          }}></div>
        </div>

        <div className="container mx-auto px-4 lg:px-8 relative z-10">
          <div className="text-center mb-12 text-white relative z-30">
            <h2 className="text-4xl md:text-5xl font-black mb-4 relative z-30">What Makes Us Different</h2>
            <p className="text-xl opacity-90 max-w-2xl mx-auto relative z-30">
              Your trusted partner for all your pet's needs
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8 stagger-animation">
            <div className="group bg-white/10 backdrop-blur-lg rounded-2xl p-8 text-center shadow-2xl hover:shadow-3xl transition-all hover:-translate-y-2 border border-white/20">
              <div className="bg-gradient-to-br from-blue-400 to-blue-600 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform shadow-xl">
                <div className="text-5xl float">🚚</div>
              </div>
              <h3 className="text-2xl font-black mb-3 text-white">Free Shipping</h3>
              <p className="text-white/90 leading-relaxed text-lg mb-4">
                Get free delivery on orders over $49
              </p>
            </div>
            <div className="group bg-white/10 backdrop-blur-lg rounded-2xl p-8 text-center shadow-2xl hover:shadow-3xl transition-all hover:-translate-y-2 border border-white/20">
              <div className="bg-gradient-to-br from-yellow-400 to-orange-500 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform shadow-xl">
                <div className="text-5xl float" style={{animationDelay: '1s'}}>⭐</div>
              </div>
              <h3 className="text-2xl font-black mb-3 text-white">Premium Quality</h3>
              <p className="text-white/90 leading-relaxed text-lg mb-4">
                Only verified & trusted brands
              </p>
            </div>
            <div className="group bg-white/10 backdrop-blur-lg rounded-2xl p-8 text-center shadow-2xl hover:shadow-3xl transition-all hover:-translate-y-2 border border-white/20">
              <div className="bg-gradient-to-br from-green-400 to-emerald-600 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform shadow-xl">
                <div className="text-5xl float" style={{animationDelay: '0.5s'}}>💳</div>
              </div>
              <h3 className="text-2xl font-black mb-3 text-white">Secure Payment</h3>
              <p className="text-white/90 leading-relaxed text-lg mb-4">
                Safe and encrypted transactions
              </p>
            </div>
            <div className="group bg-white/10 backdrop-blur-lg rounded-2xl p-8 text-center shadow-2xl hover:shadow-3xl transition-all hover:-translate-y-2 border border-white/20">
              <div className="bg-gradient-to-br from-purple-400 to-pink-600 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform shadow-xl">
                <div className="text-5xl float" style={{animationDelay: '1.5s'}}>🔄</div>
              </div>
              <h3 className="text-2xl font-black mb-3 text-white">Easy Returns</h3>
              <p className="text-white/90 leading-relaxed text-lg mb-4">
                Hassle-free return policy
              </p>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
};

export default Home;



