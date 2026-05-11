import { useQuery } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import { productService } from '@/services/products';
import ProductCard from '@/components/ProductCard';
import LoadingSpinner from '@/components/LoadingSpinner';
import SEO from '@/components/SEO';
import TrustBadges from '@/components/TrustBadges';
import CategoryIcons from '@/components/CategoryIcons';
import { ChevronRight, ChevronLeft, Star, Gift, ShieldCheck, Sparkles, HeartPulse, MessageSquare, Crown, CheckCircle2 } from 'lucide-react';
import { useRef, useState, useEffect, useMemo } from 'react';
import { hasImageFailed } from '@/hooks/useImageLoadTracker';

// --- LUXURY HERO COMPONENT ---
const LuxuryHero = () => {
  const [activeSlide, setActiveSlide] = useState(0);
  const slides = [
    {
      image: "https://images.unsplash.com/photo-1516734212186-a967f81ad0d7?auto=format&fit=crop&q=80&w=1600",
      title: "Experts in Pets.",
      subtitle: "Devoted to Their Best.",
      desc: "Premium nutrition. Expert care. Healthier, happier lives."
    },
    {
      image: "https://images.unsplash.com/photo-1548191265-cc70d3d45ba1?auto=format&fit=crop&q=80&w=1600",
      title: "Science-Backed",
      subtitle: "Pet Nutrition Specialist",
      desc: "Tailored protocols for every breed and life stage."
    }
  ];

  useEffect(() => {
    const timer = setInterval(() => setActiveSlide((prev) => (prev + 1) % slides.length), 6000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="relative h-[500px] md:h-[650px] w-full overflow-hidden rounded-[3rem] shadow-3xl bg-[#001A4D]">
      {slides.map((slide, i) => (
        <div key={i} className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${i === activeSlide ? 'opacity-100' : 'opacity-0'}`}>
          <img src={slide.image} className="w-full h-full object-cover" alt="Hero" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#001A4D]/90 via-[#001A4D]/40 to-transparent"></div>
          <div className="absolute inset-0 flex flex-col justify-center px-8 md:px-20 text-white">
            <div className="inline-flex items-center gap-2 mb-6 text-blue-300 font-bold uppercase tracking-[0.3em] text-xs md:text-sm">
              <Crown size={16} className="text-yellow-400" /> Royal Blue Specialist
            </div>
            <h1 className="text-5xl md:text-8xl font-black mb-4 tracking-tighter leading-none">{slide.title}<br/><span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-200 to-white">{slide.subtitle}</span></h1>
            <p className="text-lg md:text-2xl text-blue-100/80 mb-10 max-w-xl font-light italic">"{slide.desc}"</p>
            <div className="flex gap-4">
              <Link to="/products" className="bg-white text-[#001A4D] px-10 py-5 rounded-2xl font-black text-lg hover:scale-105 transition-all shadow-xl">SHOP NOW</Link>
              <button onClick={() => window.dispatchEvent(new CustomEvent('open-ai-chat'))} className="bg-blue-600/20 backdrop-blur-md border border-white/20 text-white px-10 py-5 rounded-2xl font-black text-lg hover:bg-blue-600/40 transition-all">CONSULT AI</button>
            </div>
          </div>
        </div>
      ))}
      <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex gap-3">
        {slides.map((_, i) => <div key={i} className={`h-2 rounded-full transition-all duration-500 ${i === activeSlide ? 'w-12 bg-white' : 'w-2 bg-white/30'}`}></div>)}
      </div>
    </div>
  );
};

// --- MASTER BIRTHDAY BANNER ---
const BirthdayBanner = () => (
  <section className="relative overflow-hidden my-20 mx-4 lg:mx-auto max-w-7xl">
    <div className="relative rounded-[3rem] bg-gradient-to-br from-[#001A4D] via-[#003399] to-[#0055CC] p-1 shadow-[0_40px_100px_rgba(0,51,153,0.3)] overflow-hidden">
      <div className="absolute top-0 right-0 -mt-20 -mr-20 opacity-5 rotate-12 scale-150"><Gift size={400} color="white" /></div>
      <div className="relative z-10 py-20 px-8 lg:px-20 flex flex-col lg:flex-row items-center justify-between gap-16">
        <div className="flex-1 text-center lg:text-left text-white max-w-2xl">
          <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-white/10 backdrop-blur-xl border border-white/20 text-blue-200 text-xs font-black uppercase tracking-[0.3em] mb-10"><Crown size={14} className="text-yellow-400" /> Royal Birthday Club</div>
          <h2 className="text-5xl md:text-7xl font-black mb-8 leading-[1.05] tracking-tighter">Every Tail Wags for a <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-100 via-white to-blue-100 italic">Birthday Surprise</span></h2>
          <p className="text-xl md:text-2xl text-blue-100/80 mb-12 leading-relaxed font-light">Register your pet with our <span className="text-white font-medium">AI Specialist</span> to unlock a bespoke <span className="text-yellow-400 font-bold">FREE GIFT</span> every year. Because family deserves the best.</p>
          <button onClick={() => window.dispatchEvent(new CustomEvent('open-ai-chat'))} className="group relative bg-white text-[#001A4D] px-12 py-6 rounded-2xl font-black text-xl flex items-center gap-4 mx-auto lg:mx-0 shadow-2xl hover:shadow-white/20 hover:-translate-y-1.5 transition-all duration-500"><MessageSquare size={28} /> Consult AI Pet Advisor</button>
        </div>
        <div className="flex-1 relative w-full">
          <div className="relative p-3 rounded-[2.5rem] bg-gradient-to-tr from-white/30 to-transparent backdrop-blur-md border border-white/20 shadow-3xl overflow-hidden group">
            <img src="https://images.unsplash.com/photo-1516734212186-a967f81ad0d7?auto=format&fit=crop&q=80&w=1200" className="rounded-[2rem] w-full h-[500px] object-cover transition-transform duration-1000 group-hover:scale-105" alt="Luxury Pet" />
            <div className="absolute -top-8 -right-8 bg-gradient-to-br from-yellow-300 via-yellow-500 to-yellow-600 text-blue-900 w-32 h-32 rounded-full font-black shadow-2xl rotate-12 animate-bounce flex flex-col items-center justify-center border-4 border-white/20">
              <span className="text-[10px] uppercase tracking-widest">Premium</span><span className="text-3xl">FREE</span><span className="text-xs">GIFT</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
);

// --- MASTER SPECIALIST ROW ---
const SpecialistRow = () => (
  <section className="py-28 bg-gradient-to-b from-white via-blue-50/20 to-white border-y border-gray-100 my-20 relative overflow-hidden text-center">
    <div className="max-w-7xl mx-auto px-4 relative z-10">
      <div className="flex flex-col items-center mb-20">
        <div className="inline-flex items-center gap-3 mb-6 px-6 py-2 rounded-full bg-blue-50 border border-blue-100 text-[#001A4D] font-bold text-sm tracking-[0.2em] uppercase"><ShieldCheck size={18} /> Certified Quality</div>
        <h3 className="text-4xl md:text-6xl font-black text-gray-900 uppercase tracking-tighter mb-6">Expert Specialist</h3>
        <p className="text-gray-500 text-xl max-w-3xl font-light leading-relaxed">"Every product is vetted by our elite team of pet care specialists to ensure your companion receives only the gold standard of nutrition and care."</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
        {[
          { icon: <ShieldCheck className="w-10 h-10 text-white" />, title: "Specialist-Curated", desc: "A rigorous selection process led by industry experts for unmatched safety and excellence." },
          { icon: <Sparkles className="w-10 h-10 text-white" />, title: "AI-Powered Analysis", desc: "Utilizing advanced data science to match your pet with their ideal nutritional profile." },
          { icon: <HeartPulse className="w-10 h-10 text-white" />, title: "Life-Stage Precision", desc: "Targeted support designed specifically for your pet's current developmental milestone." }
        ].map((f, i) => (
          <div key={i} className="relative group p-12 rounded-[3rem] bg-white border border-gray-100 shadow-[0_15px_50px_rgba(0,0,0,0.02)] hover:shadow-[0_40px_80px_rgba(0,51,153,0.08)] transition-all duration-700 hover:-translate-y-4">
            <div className="bg-gradient-to-br from-[#001A4D] to-[#0044CC] w-24 h-24 rounded-3xl flex items-center justify-center mb-10 mx-auto shadow-xl group-hover:rotate-[15deg] transition-transform duration-700">{f.icon}</div>
            <h4 className="text-2xl font-black text-gray-900 mb-6 tracking-tight">{f.title}</h4>
            <p className="text-gray-500 leading-relaxed text-lg font-light">{f.desc}</p>
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
    <div className="relative bg-white">
      <SEO description="PetShiwu - The Elite Pet Specialist. Premium nutrition, expert-vetted supplies, and AI-powered care." />
      
      <div className="container mx-auto px-4 lg:px-8 mt-6">
        <LuxuryHero />
      </div>

      <section className="py-20 bg-gradient-to-b from-white to-blue-50/30">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-6xl font-black mb-4 tracking-tighter text-[#001A4D]">Shop by Pet Type</h2>
            <p className="text-gray-500 text-xl font-light max-w-2xl mx-auto">Premium solutions for every member of your family</p>
          </div>
          <div className="relative">
            <div className="hidden md:block relative px-12">
              {showLeftArrow && <button onClick={() => scrollPetTypes('left')} className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-white text-gray-800 p-4 rounded-full shadow-2xl transition-all"><ChevronLeft size={24} /></button>}
              {showRightArrow && <button onClick={() => scrollPetTypes('right')} className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-white text-gray-800 p-4 rounded-full shadow-2xl transition-all"><ChevronRight size={24} /></button>}
              <div ref={petTypesScrollRef} className="flex justify-center items-center gap-10 overflow-x-auto pb-10 pt-6 scrollbar-hide snap-x">
                {[
                  { name: 'Dog', slug: 'dog', image: 'https://images.unsplash.com/photo-1534361960057-19889db9621e?w=500&h=500&fit=crop&q=90' },
                  { name: 'Cat', slug: 'cat', image: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=500&h=500&fit=crop&q=90' },
                  { name: 'Fish', slug: 'fish', image: 'https://images.unsplash.com/photo-1522069169874-c58ec4b76be5?w=500&h=500&fit=crop&q=90' },
                  { name: 'Bird', slug: 'bird', image: 'https://images.unsplash.com/photo-1552728089-57bdde30beb3?w=500&h=500&fit=crop&q=90' },
                  { name: 'Reptile', slug: 'reptile', image: 'https://images.unsplash.com/photo-1504450874802-0ba2bcd9b5ae?w=500&h=500&fit=crop&q=90' },
                  { name: 'Small Pet', slug: 'small-pet', image: 'https://images.unsplash.com/photo-1548767797-d8c844163c4c?w=500&h=500&fit=crop&q=90' }
                ].map((category, index) => (
                  <div key={index} className="flex-shrink-0 snap-center group cursor-pointer" onClick={() => navigate(`/products?petType=${category.slug}`)}>
                    <div className="flex flex-col items-center gap-6">
                      <div className="relative w-40 h-40 rounded-full bg-gradient-to-br from-[#001A4D] to-blue-400 p-1.5 transform group-hover:scale-110 transition-all duration-500 shadow-xl">
                        <div className="w-full h-full rounded-full overflow-hidden bg-white border-4 border-white"><img src={category.image} alt={category.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" loading="lazy" /></div>
                      </div>
                      <p className="text-xl font-black text-[#001A4D] group-hover:text-blue-600 transition-colors">{category.name}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="md:hidden flex overflow-x-auto gap-6 px-4 pb-6 scrollbar-hide">
              {[
                { name: 'Dog', slug: 'dog', image: 'https://images.unsplash.com/photo-1534361960057-19889db9621e?w=500&h=500&fit=crop&q=90' },
                { name: 'Cat', slug: 'cat', image: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=500&h=500&fit=crop&q=90' },
                { name: 'Fish', slug: 'fish', image: 'https://images.unsplash.com/photo-1522069169874-c58ec4b76be5?w=500&h=500&fit=crop&q=90' },
                { name: 'Bird', slug: 'bird', image: 'https://images.unsplash.com/photo-1552728089-57bdde30beb3?w=500&h=500&fit=crop&q=90' },
                { name: 'Reptile', slug: 'reptile', image: 'https://images.unsplash.com/photo-1504450874802-0ba2bcd9b5ae?w=500&h=500&fit=crop&q=90' },
                { name: 'Small Pet', slug: 'small-pet', image: 'https://images.unsplash.com/photo-1548767797-d8c844163c4c?w=500&h=500&fit=crop&q=90' }
              ].map((category, index) => (
                <div key={index} className="flex flex-col items-center gap-3 flex-shrink-0 w-28" onClick={() => navigate(`/products?petType=${category.slug}`)}>
                  <div className="relative w-24 h-24 rounded-full bg-gradient-to-br from-[#001A4D] to-blue-400 p-1 shadow-lg active:scale-95 transition-all"><div className="w-full h-full rounded-full overflow-hidden bg-white"><img src={category.image} alt={category.name} className="w-full h-full object-cover" loading="lazy" /></div></div>
                  <p className="text-sm font-black text-[#001A4D]">{category.name}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <BirthdayBanner />
      <div className="my-10"><CategoryIcons /></div>
      <SpecialistRow />

      <section className="py-24 bg-gradient-to-b from-white to-blue-50/20">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 bg-[#001A4D] text-white px-6 py-2 rounded-full font-black text-xs uppercase tracking-widest mb-6 shadow-xl"><Star size={14} className="fill-yellow-400 text-yellow-400" /> Featured Selection</div>
            <h2 className="text-4xl md:text-6xl font-black mb-6 tracking-tighter text-[#001A4D]">Trending Essentials</h2>
            <p className="text-gray-500 text-xl font-light max-w-2xl mx-auto italic">"Vetted for quality, loved by pets."</p>
          </div>
          {isLoading ? <div className="py-20 flex justify-center"><LoadingSpinner size="lg" /></div> : (
            <div className="flex overflow-x-auto gap-8 pb-10 scrollbar-hide px-4">
              {filteredFeaturedProducts.map((product, index) => (
                <div key={product._id} className="flex-shrink-0 w-64 md:w-72 hover:-translate-y-2 transition-all duration-500"><ProductCard product={product} hideCartButton={true} index={index} /></div>
              ))}
            </div>
          )}
          <div className="mt-16 text-center">
            <Link to="/products?featured=true" className="inline-flex items-center gap-4 bg-[#001A4D] text-white px-12 py-6 rounded-2xl font-black text-xl hover:bg-[#003399] hover:shadow-2xl transition-all duration-300 group">Explore All Specialist Products <ChevronRight size={24} className="group-hover:translate-x-2 transition-transform" /></Link>
          </div>
        </div>
      </section>

      <div className="py-10 bg-white"><TrustBadges /></div>

      <section className="py-28 bg-[#001A4D] relative overflow-hidden text-white">
        <div className="container mx-auto px-4 lg:px-8 relative z-10 flex flex-col md:flex-row items-center justify-between gap-16">
          <div className="flex-1 text-center md:text-left">
            <h2 className="text-5xl md:text-7xl font-black mb-8 leading-tight tracking-tighter">Experience the <span className="text-blue-400">Specialist Difference</span></h2>
            <div className="flex flex-wrap gap-6 justify-center md:justify-start">
              <div className="flex items-center gap-3 bg-white/10 backdrop-blur-md px-6 py-3 rounded-2xl border border-white/10 font-bold"><CheckCircle2 className="text-blue-400" /> Premium Quality</div>
              <div className="flex items-center gap-3 bg-white/10 backdrop-blur-md px-6 py-3 rounded-2xl border border-white/10 font-bold"><CheckCircle2 className="text-blue-400" /> Expert Vetted</div>
            </div>
          </div>
          <Link to="/products?featured=true" className="group relative bg-gradient-to-br from-yellow-400 to-yellow-600 text-[#001A4D] px-16 py-10 rounded-[3rem] shadow-3xl hover:scale-105 transition-all duration-500 text-center">
            <p className="text-sm font-black uppercase tracking-[0.3em] mb-2">Exclusive Access</p><p className="text-4xl font-black">Shop Featured</p>
          </Link>
        </div>
      </section>
      <style>{`.scrollbar-hide::-webkit-scrollbar { display: none; } .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }`}</style>
    </div>
  );
};

export default Home;
