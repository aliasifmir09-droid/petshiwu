import { useQuery } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import { productService } from '@/services/products';
import ProductCard from '@/components/ProductCard';
import LoadingSpinner from '@/components/LoadingSpinner';
import HeroSlideshow from '@/components/HeroSlideshow';
import SEO from '@/components/SEO';
import TrustBadges from '@/components/TrustBadges';
import CategoryIcons from '@/components/CategoryIcons';
import { ChevronRight, ChevronLeft, Star, Gift, ShieldCheck, Sparkles, HeartPulse, MessageSquare, Crown } from 'lucide-react';
import { useRef, useState, useEffect, useMemo } from 'react';
import { hasImageFailed } from '@/hooks/useImageLoadTracker';
import { normalizeImageUrl, generateSrcSet, getOptimizedImageUrl } from '@/utils/imageUtils';
import { decodeHtmlEntities } from '@/utils/htmlUtils';

// --- ULTRA-PREMIUM ROYAL BLUE COMPONENTS ---
const BirthdayBanner = () => (
  <section className="relative overflow-hidden my-16 mx-4 lg:mx-auto max-w-7xl">
    {/* Main Container with Deep Luxury Gradient */}
    <div className="relative rounded-[2.5rem] bg-gradient-to-br from-[#001A4D] via-[#003399] to-[#0044CC] p-1 shadow-[0_20px_50px_rgba(0,51,153,0.3)] overflow-hidden">
      
      {/* Decorative Background Glows */}
      <div className="absolute -top-24 -left-24 w-96 h-96 bg-blue-400 rounded-full opacity-20 blur-[100px]"></div>
      <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-purple-500 rounded-full opacity-20 blur-[100px]"></div>
      
      {/* Background Decorative Gift Icon */}
      <div className="absolute top-0 right-0 -mt-16 -mr-16 opacity-5 rotate-12">
        <Gift size={400} color="white" />
      </div>

      <div className="relative z-10 py-16 px-8 lg:px-16 flex flex-col lg:flex-row items-center justify-between gap-16">
        {/* Luxury Text Content */}
        <div className="flex-1 text-center lg:text-left text-white max-w-2xl">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-blue-200 text-sm font-bold uppercase tracking-[0.2em] mb-8">
            <Crown size={16} /> Exclusive Celebration
          </div>
          <h2 className="text-5xl md:text-7xl font-black mb-8 leading-[1.1] tracking-tight">
            Every Tail Wags for a <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-200 via-white to-blue-200 italic">Birthday Surprise</span>
          </h2>
          <p className="text-xl md:text-2xl text-blue-100/90 mb-10 leading-relaxed font-light">
            Tell our AI Advisor your pet's name and birthday to unlock a 
            <span className="font-bold text-white"> FREE BIRTHDAY GIFT </span> 
            every year. Experience the gold standard of pet care.
          </p>
          <button 
            onClick={() => window.dispatchEvent(new CustomEvent('open-ai-chat'))} 
            className="group relative bg-white text-[#003399] px-10 py-5 rounded-2xl font-black text-xl flex items-center gap-4 mx-auto lg:mx-0 shadow-[0_10px_30px_rgba(255,255,255,0.2)] hover:shadow-[0_15px_40px_rgba(255,255,255,0.4)] hover:-translate-y-1 transition-all duration-300"
          >
            <MessageSquare size={28} className="group-hover:rotate-12 transition-transform" /> 
            Chat with AI Pet Advisor
            <div className="absolute inset-0 rounded-2xl border-2 border-white opacity-0 group-hover:opacity-100 group-hover:scale-110 transition-all duration-500"></div>
          </button>
        </div>

        {/* Ultra-Premium Image Content */}
        <div className="flex-1 relative w-full lg:w-auto">
          <div className="relative p-2 rounded-[2rem] bg-gradient-to-tr from-white/20 to-transparent backdrop-blur-sm border border-white/10 shadow-2xl overflow-hidden group">
            <img 
              src="https://images.unsplash.com/photo-1516734212186-a967f81ad0d7?auto=format&fit=crop&q=80&w=1000" 
              className="rounded-[1.8rem] w-full h-[450px] object-cover transition-transform duration-700 group-hover:scale-110" 
              alt="Luxury Pet Celebration" 
            />
            {/* Glass Overlay on Image */}
            <div className="absolute inset-0 bg-gradient-to-t from-[#001A4D]/60 via-transparent to-transparent opacity-60"></div>
            
            {/* Floating Luxury Badge */}
            <div className="absolute -top-6 -right-6 bg-gradient-to-br from-yellow-300 via-yellow-500 to-yellow-600 text-blue-900 px-8 py-8 rounded-full font-black shadow-[0_10px_30px_rgba(234,179,8,0.4)] rotate-12 animate-bounce flex flex-col items-center justify-center">
              <span className="text-xs uppercase tracking-tighter">Complimentary</span>
              <span className="text-2xl">FREE</span>
              <span className="text-sm">TREAT</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
);

const SpecialistRow = () => (
  <section className="py-24 bg-gradient-to-b from-white to-blue-50/50 border-y border-gray-100 my-16 relative overflow-hidden">
    {/* Decorative Elements */}
    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full opacity-[0.03] pointer-events-none">
      <div className="grid grid-cols-6 h-full w-full">
        {[...Array(24)].map((_, i) => <div key={i} className="border-l border-t border-[#003399]"></div>)}
      </div>
    </div>

    <div className="max-w-7xl mx-auto px-4 text-center relative z-10">
      <div className="flex flex-col items-center mb-16">
        <div className="w-20 h-1 bg-gradient-to-r from-transparent via-[#003399] to-transparent mb-6"></div>
        <h3 className="text-3xl md:text-4xl font-black text-gray-900 uppercase tracking-[0.3em] mb-4">Expert Specialist</h3>
        <p className="text-gray-500 text-lg max-w-2xl font-light italic">"Thoughtfully chosen. Expertly recommended. Perfect for every pet."</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
        {[
          { 
            icon: <ShieldCheck className="w-10 h-10 text-white" />, 
            title: "Specialist-Curated", 
            desc: "Handpicked by elite pet care experts for unmatched quality and safety." 
          },
          { 
            icon: <Sparkles className="w-10 h-10 text-white" />, 
            title: "AI-Powered Recs", 
            desc: "Advanced neural networks that understand your pet's unique biological needs." 
          },
          { 
            icon: <HeartPulse className="w-10 h-10 text-white" />, 
            title: "Life-Stage Nutrition", 
            desc: "Precision nutrition protocols tailored for every stage of your pet's life journey." 
          }
        ].map((f, i) => (
          <div 
            key={i} 
            className="relative group p-10 rounded-[2.5rem] bg-white border border-gray-100 shadow-[0_10px_40px_rgba(0,0,0,0.03)] hover:shadow-[0_30px_60px_rgba(0,51,153,0.1)] transition-all duration-500 hover:-translate-y-3"
          >
            <div className="bg-gradient-to-br from-[#003399] to-[#0066FF] w-20 h-20 rounded-2xl flex items-center justify-center mb-8 mx-auto shadow-lg group-hover:rotate-[10deg] transition-transform duration-500">
              {f.icon}
            </div>
            <h4 className="text-2xl font-bold text-gray-900 mb-4 tracking-tight">{f.title}</h4>
            <p className="text-gray-500 leading-relaxed font-light">{f.desc}</p>
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-0 h-1 bg-[#003399] group-hover:w-1/2 transition-all duration-500 rounded-full"></div>
          </div>
        ))}
      </div>
    </div>
  </section>
);
// --- END OF ULTRA-PREMIUM COMPONENTS ---

const Home = () => {
  const navigate = useNavigate();
  const { data: featuredProducts, isLoading } = useQuery({
    queryKey: ['products', 'featured'],
    queryFn: () => productService.getProducts({ featured: true, limit: 8 }),
    staleTime: 10 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: false
  });

  const petTypesScrollRef = useRef<HTMLDivElement>(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(false);

  const filteredFeaturedProducts = useMemo(() => {
    if (!featuredProducts?.data) return [];
    return featuredProducts.data.filter((product) => {
      const productId = product._id ? String(product._id) : null;
      return productId && !hasImageFailed(productId);
    });
  }, [featuredProducts?.data]);

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
      const newScrollPosition = direction === 'left' 
        ? petTypesScrollRef.current.scrollLeft - scrollAmount
        : petTypesScrollRef.current.scrollLeft + scrollAmount;
      petTypesScrollRef.current.scrollTo({ left: newScrollPosition, behavior: 'smooth' });
    }
  };

  return (
    <div className="relative">
      <SEO
        description="Shop premium pet food, dog food, cat food, toys, and supplies for dogs, cats, birds, and more. Quality products, fast shipping, great prices."
      />

      <div className="container mx-auto px-4 lg:px-8 mt-4">
        <HeroSlideshow />
      </div>

      <section className="py-8 sm:py-12 md:py-16 bg-gradient-to-b from-white via-blue-50/30 to-white relative overflow-hidden">
        <div className="absolute top-0 left-0 w-48 h-48 bg-blue-200 rounded-full opacity-10 blur-3xl z-0"></div>
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center mb-8 sm:mb-12 relative z-30">
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black mb-2 sm:mb-3" style={{ background: 'linear-gradient(to right, #2563eb, #9333ea, #db2777)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text', color: '#9333ea' }}>Shop by Pet Type</h2>
            <p className="text-gray-600 text-sm sm:text-base md:text-lg lg:text-xl max-w-2xl mx-auto">Find everything your furry, feathered, or scaly friend needs</p>
          </div>
          
          <div className="relative overflow-visible">
            <div className="hidden md:block relative">
              {showLeftArrow && (
                <button onClick={() => scrollPetTypes('left')} className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-white hover:bg-gray-100 text-gray-800 p-2 rounded-full shadow-lg hover:scale-110 transition-all"><ChevronLeft size={20} /></button>
              )}
              {showRightArrow && (
                <button onClick={() => scrollPetTypes('right')} className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-white hover:bg-gray-100 text-gray-800 p-2 rounded-full shadow-lg hover:scale-110 transition-all"><ChevronRight size={20} /></button>
              )}
              <div ref={petTypesScrollRef} className="flex justify-center items-center gap-4 md:gap-6 lg:gap-8 overflow-x-auto pb-6 pt-6 scrollbar-hide snap-x px-4 md:px-8">
                {[
                  { name: 'Dog', slug: 'dog', image: 'https://images.unsplash.com/photo-1534361960057-19889db9621e?w=500&h=500&fit=crop&q=90' },
                  { name: 'Cat', slug: 'cat', image: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=500&h=500&fit=crop&q=90' },
                  { name: 'Fish', slug: 'fish', image: 'https://res.cloudinary.com/dtmes0dha/image/upload/v1764591467/493202359_yqxjl5.jpg' },
                  { name: 'Bird', slug: 'bird', image: 'https://images.unsplash.com/photo-1552728089-57bdde30beb3?w=500&h=500&fit=crop&q=90' },
                  { name: 'Reptile', slug: 'reptile', image: 'https://res.cloudinary.com/dtmes0dha/image/upload/v1764591422/OIP_d5mo8l.webp' },
                  { name: 'Small Pet', slug: 'small-pet', image: 'https://images.unsplash.com/photo-1548767797-d8c844163c4c?w=500&h=500&fit=crop&q=90' }
                ].map((category, index) => (
                  <div key={index} className="flex-shrink-0 snap-center group cursor-pointer" onClick={() => navigate(`/products?petType=${category.slug}`)}>
                    <div className="flex flex-col items-center gap-3">
                      <div className="relative w-32 h-32 sm:w-40 sm:h-40 rounded-full bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 p-[3px] transform group-hover:scale-110 transition-all duration-300 shadow-lg group-hover:shadow-2xl">
                        <div className="w-full h-full rounded-full overflow-hidden bg-white">
                          <img src={category.image} alt={category.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" loading="lazy" />
                        </div>
                      </div>
                      <p className="text-base lg:text-lg font-bold text-gray-800 group-hover:text-blue-600 transition-colors duration-300">{category.name}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="md:hidden flex overflow-x-auto gap-3 px-2 pb-2 scrollbar-hide">
              {[
                { name: 'Dog', slug: 'dog', image: 'https://images.unsplash.com/photo-1534361960057-19889db9621e?w=500&h=500&fit=crop&q=90' },
                { name: 'Cat', slug: 'cat', image: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=500&h=500&fit=crop&q=90' },
                { name: 'Fish', slug: 'fish', image: 'https://res.cloudinary.com/dtmes0dha/image/upload/v1764591467/493202359_yqxjl5.jpg' },
                { name: 'Bird', slug: 'bird', image: 'https://images.unsplash.com/photo-1552728089-57bdde30beb3?w=500&h=500&fit=crop&q=90' },
                { name: 'Reptile', slug: 'reptile', image: 'https://res.cloudinary.com/dtmes0dha/image/upload/v1764591422/OIP_d5mo8l.webp' },
                { name: 'Small Pet', slug: 'small-pet', image: 'https://images.unsplash.com/photo-1548767797-d8c844163c4c?w=500&h=500&fit=crop&q=90' }
              ].map((category, index) => (
                <div key={index} className="flex flex-col items-center gap-1.5 flex-shrink-0 w-[90px]" onClick={() => navigate(`/products?petType=${category.slug}`)}>
                  <div className="relative w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 p-[2px] active:scale-105 transition-all">
                    <div className="w-full h-full rounded-full overflow-hidden bg-white">
                      <img src={category.image} alt={category.name} className="w-full h-full object-cover" loading="lazy" />
                    </div>
                  </div>
                  <p className="text-[10px] font-bold text-gray-800 text-center">{category.name}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ULTRA-PREMIUM BIRTHDAY BANNER */}
      <BirthdayBanner />

      <CategoryIcons />

      {/* ULTRA-PREMIUM SPECIALIST ROW */}
      <SpecialistRow />

      <section className="py-16 bg-gradient-to-b from-white via-blue-50 to-white relative overflow-hidden text-center">
        <div className="container mx-auto px-4 lg:px-8 relative z-10">
          <div className="inline-flex items-center gap-2 bg-gradient-to-r from-yellow-400 to-orange-500 text-white px-6 py-2 rounded-full font-bold text-sm mb-4 shadow-lg"><Star size={16} className="fill-white" /><span>Featured Products</span><Star size={16} className="fill-white" /></div>
          <h2 className="text-4xl md:text-5xl font-black mb-3" style={{ background: 'linear-gradient(to right, #2563eb, #9333ea, #db2777)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text', color: '#9333ea' }}>Trending Products</h2>
          <p className="text-gray-600 text-lg max-w-2xl mx-auto mb-8">Trusted by pet parents nationwide - premium quality products</p>
          {isLoading ? <div className="py-12"><LoadingSpinner size="lg" /></div> : (
            <div className="flex overflow-x-auto gap-4 md:gap-5 pb-4 scrollbar-hide">
              {filteredFeaturedProducts.map((product, index) => (
                <div key={product._id} className="flex-shrink-0 w-56 md:w-64"><ProductCard product={product} hideCartButton={true} index={index} /></div>
              ))}
            </div>
          )}
          <div className="mt-8"><Link to="/products?featured=true" className="inline-flex items-center gap-3 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 text-white px-8 py-4 rounded-full font-bold text-lg hover:scale-105 transition-all"><span>View All Products</span><ChevronRight size={24} /></Link></div>
        </div>
      </section>

      <section className="py-12 md:py-16 mt-8 bg-gradient-to-r from-purple-900 via-blue-900 to-indigo-900 relative overflow-hidden text-white text-center md:text-left">
        <div className="container mx-auto px-4 lg:px-8 relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="flex-1">
            <h2 className="text-4xl md:text-6xl font-black mb-4 leading-tight"><span className="bg-gradient-to-r from-pink-400 via-yellow-300 to-pink-400 bg-clip-text text-transparent">Premium Pet Products</span></h2>
            <p className="text-xl md:text-2xl opacity-95 mb-4">Quality You Can Trust</p>
            <div className="flex flex-wrap gap-4 justify-center md:justify-start">
              <div className="bg-white/10 backdrop-blur-md px-4 py-2 rounded-lg border border-white/20 text-sm font-semibold">Exclusive Deals</div>
              <div className="bg-white/10 backdrop-blur-md px-4 py-2 rounded-lg border border-white/20 text-sm font-semibold">Free Shipping Over $75</div>
            </div>
          </div>
          <Link to="/products?featured=true" className="bg-gradient-to-r from-orange-500 via-pink-500 to-purple-600 px-8 py-6 rounded-3xl shadow-2xl border-2 border-white/30 transform hover:scale-105 transition-all text-center"><p className="text-base font-bold uppercase">Shop Now</p><p className="text-2xl font-black">Featured Products</p></Link>
        </div>
      </section>

      <TrustBadges />

      <section className="py-16 md:py-20 bg-gradient-to-br from-blue-600 via-purple-700 to-pink-600 relative overflow-hidden text-white text-center">
        <div className="container mx-auto px-4 lg:px-8 relative z-10">
          <h2 className="text-4xl md:text-5xl font-black mb-4">What Makes Us Different</h2>
          <p className="text-xl opacity-90 mb-12">Your trusted partner for all your pet's needs</p>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: '🚚', title: 'Free Shipping', desc: 'Over $75' },
              { icon: '⭐', title: 'Premium Quality', desc: 'Trusted brands' },
              { icon: '💳', title: 'Secure Payment', desc: 'Safe & Encrypted' },
              { icon: '🔄', title: 'Easy Returns', desc: 'Hassle-free' }
            ].map((item, i) => (
              <div key={i} className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20 hover:-translate-y-2 transition-all">
                <div className="text-4xl mb-4">{item.icon}</div>
                <h3 className="text-xl font-bold mb-1">{item.title}</h3>
                <p className="text-white/90 text-sm">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
      <style>{`.scrollbar-hide::-webkit-scrollbar { display: none; } .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }`}</style>
    </div>
  );
};

export default Home;
