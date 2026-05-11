import { useQuery } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import { productService } from '@/services/products';
import ProductCard from '@/components/ProductCard';
import LoadingSpinner from '@/components/LoadingSpinner';
import HeroSlideshow from '@/components/HeroSlideshow';
import SEO from '@/components/SEO';
import StructuredData from '@/components/StructuredData';
import TrustBadges from '@/components/TrustBadges';
import CategoryIcons from '@/components/CategoryIcons';
import { ChevronRight, ChevronLeft, Star, Gift, ShieldCheck, Sparkles, HeartPulse, MessageSquare } from 'lucide-react';
import { useRef, useState, useEffect, useMemo } from 'react';
import { hasImageFailed } from '@/hooks/useImageLoadTracker';
import { normalizeImageUrl, generateSrcSet, getOptimizedImageUrl } from '@/utils/imageUtils';
import { decodeHtmlEntities } from '@/utils/htmlUtils';

// --- ADDED: BIRTHDAY BANNER (ONLY) ---
const BirthdayBanner = () => (
  <section className="relative overflow-hidden bg-gradient-to-r from-[#003399] to-[#0055CC] py-16 px-4 my-12 rounded-3xl mx-4 lg:mx-auto max-w-7xl shadow-2xl">
    <div className="absolute top-0 right-0 -mt-10 -mr-10 opacity-10"><Gift size={300} color="white" /></div>
    <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-12">
      <div className="flex-1 text-center lg:text-left text-white">
        <h2 className="text-4xl md:text-5xl font-bold mb-6">Every Tail Wags for a <span className="text-blue-200 italic">Birthday Surprise!</span></h2>
        <p className="text-xl text-blue-100 mb-8">Tell our AI Advisor your pet's name and birthday to unlock a <span className="font-bold text-white">FREE BIRTHDAY GIFT</span> (under $5) every year.</p>
        <button onClick={() => window.dispatchEvent(new CustomEvent('open-ai-chat'))} className="bg-white text-[#003399] px-8 py-4 rounded-full font-bold text-lg flex items-center gap-3 mx-auto lg:mx-0 shadow-lg hover:scale-105 transition-all">
          <MessageSquare size={24} /> Chat with AI Pet Advisor
        </button>
      </div>
      <div className="flex-1 relative">
        <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/20">
          <img src="https://images.unsplash.com/photo-1516734212186-a967f81ad0d7?auto=format&fit=crop&q=80&w=800" className="rounded-xl shadow-inner w-full h-64 object-cover" alt="Happy Pet" />
          <div className="absolute -top-6 -right-6 bg-yellow-400 text-blue-900 p-4 rounded-full font-bold shadow-xl rotate-12 animate-bounce text-sm">FREE TREAT!</div>
        </div>
      </div>
    </div>
  </section>
);

// --- ADDED: SPECIALIST ROW (ONLY) ---
const SpecialistRow = () => (
  <section className="py-12 bg-white border-y border-gray-100 my-12">
    <div className="max-w-7xl mx-auto px-4 text-center">
      <h3 className="text-2xl font-bold text-gray-900 uppercase tracking-widest mb-2">Expert Specialist</h3>
      <p className="text-gray-500 mb-10">Thoughtfully chosen. Expertly recommended. Perfect for every pet.</p>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {[
          { icon: <ShieldCheck className="w-8 h-8 text-[#003399]" />, title: "Specialist-Curated", desc: "Handpicked by pet care experts for unmatched quality." },
          { icon: <Sparkles className="w-8 h-8 text-[#003399]" />, title: "AI-Powered Recs", desc: "Smart technology that understands your pet's unique needs." },
          { icon: <HeartPulse className="w-8 h-8 text-[#003399]" />, title: "Life-Stage Nutrition", desc: "Tailored nutrition for every stage of your pet's life." }
        ].map((f, i) => (
          <div key={i} className="flex flex-col items-center p-6 rounded-2xl bg-blue-50/50 hover:bg-blue-50 transition-all">
            <div className="bg-white p-4 rounded-full shadow-sm mb-4">{f.icon}</div>
            <h4 className="text-lg font-bold mb-2">{f.title}</h4>
            <p className="text-gray-600 text-sm">{f.desc}</p>
          </div>
        ))}
      </div>
    </div>
  </section>
);

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
      const newScrollPosition = direction === 'left' ? petTypesScrollRef.current.scrollLeft - scrollAmount : petTypesScrollRef.current.scrollLeft + scrollAmount;
      petTypesScrollRef.current.scrollTo({ left: newScrollPosition, behavior: 'smooth' });
    }
  };

  return (
    <div className="relative">
      <SEO description="Shop premium pet food, dog food, cat food, toys, and supplies." />
      <StructuredData type="localBusiness" data={{
        name: 'PetShiwu',
        url: 'https://www.petshiwu.com',
        telephone: '+1-626-342-0419',
        address: { streetAddress: '37-68 74th St', addressLocality: 'Jackson Heights', addressRegion: 'NY', postalCode: '11372', addressCountry: 'US' }
      }} />

      <div className="container mx-auto px-4 lg:px-8 mt-4">
        <HeroSlideshow />
      </div>

      <section className="py-16 bg-gradient-to-b from-white via-blue-50/30 to-white relative overflow-hidden">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center mb-12 relative z-30">
            <h2 className="text-3xl md:text-5xl font-black mb-3" style={{ background: 'linear-gradient(to right, #2563eb, #9333ea, #db2777)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text', color: '#9333ea' }}>Shop by Pet Type</h2>
            <p className="text-gray-600 text-lg max-w-2xl mx-auto">Find everything your furry friend needs</p>
          </div>
          <div className="relative overflow-visible">
            <div className="hidden md:block relative">
              {showLeftArrow && <button onClick={() => scrollPetTypes('left')} className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-white p-2 rounded-full shadow-lg"><ChevronLeft size={20} /></button>}
              {showRightArrow && <button onClick={() => scrollPetTypes('right')} className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-white p-2 rounded-full shadow-lg"><ChevronRight size={20} /></button>}
              <div ref={petTypesScrollRef} className="flex justify-center items-center gap-8 overflow-x-auto pb-6 pt-6 scrollbar-hide snap-x px-8">
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
                      <div className="relative w-32 h-32 rounded-full bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 p-[3px] group-hover:scale-110 transition-all shadow-lg">
                        <div className="w-full h-full rounded-full overflow-hidden bg-white"><img src={category.image} alt={category.name} className="w-full h-full object-cover" loading="lazy" /></div>
                      </div>
                      <p className="text-lg font-bold text-gray-800 group-hover:text-blue-600 transition-colors">{category.name}</p>
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
                  <div className="relative w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 p-[2px] active:scale-105 transition-all"><div className="w-full h-full rounded-full overflow-hidden bg-white"><img src={category.image} alt={category.name} className="w-full h-full object-cover" loading="lazy" /></div></div>
                  <p className="text-[10px] font-bold text-gray-800 text-center">{category.name}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <BirthdayBanner />
      <CategoryIcons />
      <SpecialistRow />

      <section className="py-16 bg-gradient-to-b from-white via-blue-50 to-white text-center">
        <div className="container mx-auto px-4 lg:px-8">
          <h2 className="text-4xl md:text-5xl font-black mb-3" style={{ background: 'linear-gradient(to right, #2563eb, #9333ea, #db2777)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text', color: '#9333ea' }}>Trending Products</h2>
          {isLoading ? <LoadingSpinner size="lg" /> : (
            <div className="flex overflow-x-auto gap-4 md:gap-5 pb-4 scrollbar-hide">
              {filteredFeaturedProducts.map((product, index) => (
                <div key={product._id} className="flex-shrink-0 w-56 md:w-64"><ProductCard product={product} hideCartButton={true} index={index} /></div>
              ))}
            </div>
          )}
          <div className="mt-8"><Link to="/products?featured=true" className="inline-flex items-center gap-3 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 text-white px-8 py-4 rounded-full font-bold text-lg hover:scale-105 transition-all"><span>View All Products</span><ChevronRight size={24} /></Link></div>
        </div>
      </section>

      <section className="py-16 bg-gradient-to-r from-purple-900 via-blue-900 to-indigo-900 text-white text-center md:text-left">
        <div className="container mx-auto px-4 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="flex-1"><h2 className="text-4xl md:text-6xl font-black mb-4 leading-tight"><span className="bg-gradient-to-r from-pink-400 via-yellow-300 to-pink-400 bg-clip-text text-transparent">Premium Pet Products</span></h2><p className="text-xl md:text-2xl opacity-95 mb-4">Quality You Can Trust</p></div>
          <Link to="/products?featured=true" className="bg-gradient-to-r from-orange-500 via-pink-500 to-purple-600 px-8 py-6 rounded-3xl shadow-2xl border-2 border-white/30 transform hover:scale-105 transition-all text-center"><p className="text-base font-bold uppercase">Shop Now</p><p className="text-2xl font-black">Featured Products</p></Link>
        </div>
      </section>

      <TrustBadges />

      <section className="py-20 bg-gradient-to-br from-blue-600 via-purple-700 to-pink-600 text-white text-center">
        <div className="container mx-auto px-4 lg:px-8">
          <h2 className="text-4xl md:text-5xl font-black mb-4">What Makes Us Different</h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mt-12">
            {[
              { icon: '🚚', title: 'Free Shipping', desc: 'Over $75' },
              { icon: '⭐', title: 'Premium Quality', desc: 'Trusted brands' },
              { icon: '💳', title: 'Secure Payment', desc: 'Safe & Encrypted' },
              { icon: '🔄', title: 'Easy Returns', desc: 'Hassle-free' }
            ].map((item, i) => (
              <div key={i} className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20 hover:-translate-y-2 transition-all"><div className="text-4xl mb-4">{item.icon}</div><h3 className="text-xl font-bold mb-1">{item.title}</h3><p className="text-white/90 text-sm">{item.desc}</p></div>
            ))}
          </div>
        </div>
      </section>
      <style>{`.scrollbar-hide::-webkit-scrollbar { display: none; } .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }`}</style>
    </div>
  );
};

export default Home;
