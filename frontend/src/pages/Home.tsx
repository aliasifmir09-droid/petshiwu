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
import BirthdayBanner from '@/components/BirthdayBanner';
import { ChevronRight, ChevronLeft, ArrowRight } from 'lucide-react';
import { useRef, useState, useEffect, useMemo } from 'react';
import { hasImageFailed } from '@/hooks/useImageLoadTracker';
import { normalizeImageUrl, generateSrcSet, getOptimizedImageUrl } from '@/utils/imageUtils';
import { decodeHtmlEntities } from '@/utils/htmlUtils';

const BRANDS = [
  { name: 'Purina',              logo: 'https://petshiwu-cdn.b-cdn.net/brands/purina.svg' },
  { name: 'Blue Buffalo',        logo: 'https://petshiwu-cdn.b-cdn.net/brands/bluebuffalo.svg' },
  { name: 'Royal Canin',         logo: 'https://petshiwu-cdn.b-cdn.net/brands/royalcanin.svg' },
  { name: "Hill's Science Diet", logo: 'https://petshiwu-cdn.b-cdn.net/brands/hills.svg' },
  { name: 'Wellness',            logo: 'https://petshiwu-cdn.b-cdn.net/brands/wellness.svg' },
  { name: 'Orijen',              logo: 'https://petshiwu-cdn.b-cdn.net/brands/orijen.svg' },
  { name: 'Nutro',               logo: 'https://petshiwu-cdn.b-cdn.net/brands/nutro.svg' },
  { name: 'Iams',                logo: 'https://petshiwu-cdn.b-cdn.net/brands/iams.png' },
  { name: 'Pedigree',            logo: 'https://petshiwu-cdn.b-cdn.net/brands/pedigree.png' },
  { name: "Nature's Recipe",     logo: 'https://petshiwu-cdn.b-cdn.net/brands/natures.svg' },
];

const PET_CATEGORIES = [
  { name: 'Dog',       slug: 'dog',       image: 'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=600&h=600&fit=crop&q=95' },
  { name: 'Cat',       slug: 'cat',       image: 'https://images.unsplash.com/photo-1574158622682-e40e69881006?w=600&h=600&fit=crop&q=95' },
  { name: 'Fish',      slug: 'fish',      image: 'https://images.unsplash.com/photo-1544552866-d3ed42536cfd?w=600&h=600&fit=crop&q=95' },
  { name: 'Bird',      slug: 'bird',      image: 'https://images.unsplash.com/photo-1444464666168-49d633b86797?w=600&h=600&fit=crop&q=95' },
  { name: 'Reptile',   slug: 'reptile',   image: 'https://images.unsplash.com/photo-1518020382113-a7e8fc38eac9?w=600&h=600&fit=crop&q=95' },
  { name: 'Small Pet', slug: 'small-pet', image: 'https://images.unsplash.com/photo-1425082661705-1834bfd09dca?w=600&h=600&fit=crop&q=95' },
];

// ─── Today's Deals — Hill's Science Diet 5% Off ──────────────────────────────
const DEAL_DISCOUNT = 0.05; // 5% extra off all Hill's products

const TodaysDeals = () => {
  const { data, isLoading } = useQuery({
    queryKey: ['products', 'hills-deals'],
    queryFn: () => productService.getProducts({ brand: "Hill's Science Diet", limit: 6, inStock: true }),
    staleTime: 5 * 60 * 1000,
  });

  // Countdown to end of day (midnight ET)
  const [timeLeft, setTimeLeft] = useState({ h: 0, m: 0, s: 0 });
  useEffect(() => {
    const tick = () => {
      const now = new Date();
      const midnight = new Date();
      midnight.setHours(24, 0, 0, 0);
      const diff = Math.max(0, Math.floor((midnight.getTime() - now.getTime()) / 1000));
      setTimeLeft({ h: Math.floor(diff / 3600), m: Math.floor((diff % 3600) / 60), s: diff % 60 });
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  const pad = (n: number) => String(n).padStart(2, '0');

  const products = data?.data || [];
  if (!isLoading && products.length === 0) return null;

  return (
    <section className="py-14 bg-gradient-to-br from-orange-50 via-red-50 to-yellow-50 border-t border-orange-100">
      <div className="container mx-auto px-4 lg:px-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div className="flex items-center gap-3">
            <span className="text-3xl">🔥</span>
            <div>
              <h2 className="text-2xl md:text-3xl font-black text-gray-900 leading-tight">
                Today's Deals
              </h2>
              <p className="text-sm text-orange-600 font-semibold mt-0.5">
                Extra 5% off all Hill's Science Diet — today only
              </p>
            </div>
          </div>
          {/* Countdown */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500 font-medium">Ends in:</span>
            {[pad(timeLeft.h), pad(timeLeft.m), pad(timeLeft.s)].map((val, i) => (
              <span key={i} className="flex items-center gap-1">
                <span className="bg-gray-900 text-white font-mono font-bold text-lg px-2.5 py-1 rounded-lg min-w-[2.5rem] text-center">
                  {val}
                </span>
                {i < 2 && <span className="text-gray-700 font-bold text-lg">:</span>}
              </span>
            ))}
          </div>
        </div>

        {/* Products */}
        {isLoading ? (
          <LoadingSpinner size="lg" />
        ) : (
          <div className="flex overflow-x-auto gap-4 pb-4 scrollbar-hide">
            {products.map((product, index) => {
              // Inject deal pricing — show original, discount 5%
              const dealPrice = parseFloat((product.basePrice * (1 - DEAL_DISCOUNT)).toFixed(2));
              const dealProduct = {
                ...product,
                basePrice: dealPrice,
                compareAtPrice: product.basePrice,
              };
              return (
                <div key={product._id} className="flex-shrink-0 w-56 md:w-64 relative">
                  {/* 5% OFF badge */}
                  <div className="absolute top-2 left-2 z-10 bg-red-500 text-white text-xs font-black px-2 py-1 rounded-full shadow-md">
                    5% OFF TODAY
                  </div>
                  <ProductCard product={dealProduct} hideCartButton={false} index={index} />
                </div>
              );
            })}
          </div>
        )}

        <div className="mt-6 flex items-center justify-between">
          <p className="text-xs text-gray-400">Discount applied automatically at checkout. Limited time offer.</p>
          <Link
            to="/products?brand=Hill%27s+Science+Diet"
            className="text-sm font-semibold text-orange-600 hover:text-orange-700 flex items-center gap-1"
          >
            Shop all Hill's → 
          </Link>
        </div>
      </div>
    </section>
  );
};
// ─────────────────────────────────────────────────────────────────────────────

const Home = () => {
  const navigate = useNavigate();
  const { data: featuredProducts, isLoading } = useQuery({
    queryKey: ['products', 'featured'],
    queryFn: () => productService.getProducts({ featured: true, limit: 8 }),
    staleTime: 10 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
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
      const newScrollPosition =
        direction === 'left'
          ? petTypesScrollRef.current.scrollLeft - scrollAmount
          : petTypesScrollRef.current.scrollLeft + scrollAmount;
      petTypesScrollRef.current.scrollTo({ left: newScrollPosition, behavior: 'smooth' });
    }
  };

  return (
    <div className="relative">
      <SEO
        title="Petshiwu — Premium Pet Food, Toys & Supplies Delivered to NYC"
        description="10,000+ pet products delivered to Queens, Brooklyn & all of NYC. Top brands — Purina, Blue Buffalo, Royal Canin. Free shipping over $49. Dog food, cat food, toys & more."
      />
      <StructuredData type="website" data={{}} />
      <StructuredData
        type="organization"
        data={{
          name: 'Petshiwu',
          url: 'https://www.petshiwu.com',
          logo: 'https://www.petshiwu.com/logo-square-512.png',
          description:
            'Petshiwu — premium pet food, toys, and supplies delivered to Queens, Brooklyn, Manhattan, and all of NYC. 10,000+ products, free shipping over $49.',
          contactPoint: { telephone: '+1-800-259-2605', contactType: 'customer service' },
          address: {
            streetAddress: '37-68 74th St',
            addressLocality: 'Jackson Heights',
            addressRegion: 'NY',
            postalCode: '11372',
            addressCountry: 'US',
          },
        }}
      />
      <StructuredData
        type="localBusiness"
        data={{
          businessType: ['PetStore', 'LocalBusiness'],
          name: 'Petshiwu',
          url: 'https://www.petshiwu.com',
          logo: 'https://www.petshiwu.com/logo-square-512.png',
          image: 'https://www.petshiwu.com/logo-square-512.png',
          description:
            'Premium pet food, toys and supplies delivered to Queens, Brooklyn, Manhattan, Bronx and all of New York City. 10,000+ products from top brands — Purina, Blue Buffalo, Royal Canin and more. Free delivery on orders over $49.',
          telephone: '+1-800-259-2605',
          email: 'support@petshiwu.com',
          address: {
            streetAddress: '37-68 74th St',
            addressLocality: 'Jackson Heights',
            addressRegion: 'NY',
            postalCode: '11372',
            addressCountry: 'US',
          },
          geo: { latitude: 40.7489, longitude: -73.885 },
          openingHoursSpecification: [
            {
              dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
              opens: '09:00',
              closes: '20:00',
            },
          ],
          priceRange: '$$',
          areaServed: ['Queens', 'Brooklyn', 'Manhattan', 'Bronx', 'Staten Island', 'New York City'],
          hasMap: 'https://maps.google.com/?q=Petshiwu+Jackson+Heights+NY+11372',
          paymentAccepted: 'Cash, Credit Card, Debit Card',
          currenciesAccepted: 'USD',
          sameAs: [
            'https://www.facebook.com/petshiwu',
            'https://www.instagram.com/petshiwu',
            'https://twitter.com/petshiwu',
          ],
        }}
      />
      {filteredFeaturedProducts && filteredFeaturedProducts.length > 0 && (
        <StructuredData
          type="itemList"
          data={{
            name: 'Featured Pet Products',
            description: 'Hand-picked premium pet supplies featured on Petshiwu.',
            numberOfItems: filteredFeaturedProducts.length,
            itemListElement: filteredFeaturedProducts.slice(0, 8).map((p, idx) => ({
              '@type': 'ListItem',
              position: idx + 1,
              url: `https://www.petshiwu.com/products/${p.slug}`,
              name: p.name,
              ...(p.basePrice ? { offers: { '@type': 'Offer', priceCurrency: 'USD', price: p.basePrice, availability: p.inStock ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock' } } : {})
            }))
          }}
        />
      )}

      {/* Hero Slideshow */}
      <div className="container mx-auto px-4 lg:px-8 mt-4">
        <HeroSlideshow />
      </div>

      {/* FREEDOM20 Banner — anti-autoship positioning */}
      <section className="container mx-auto px-4 lg:px-8 mt-6">
        <div className="relative overflow-hidden rounded-2xl shadow-lg bg-gradient-to-r from-[#1E3A8A] via-[#2563EB] to-[#9333EA]">
          <div className="absolute -top-8 -right-8 w-40 h-40 bg-white/10 rounded-full blur-2xl" />
          <div className="absolute -bottom-8 -left-8 w-48 h-48 bg-white/10 rounded-full blur-2xl" />
          <div className="relative px-6 py-6 sm:px-10 sm:py-8 flex flex-col sm:flex-row items-center gap-4 sm:gap-6">
            <div className="flex-shrink-0 bg-white/15 backdrop-blur-sm border border-white/30 rounded-full px-5 py-2 text-center">
              <div className="text-white font-black text-3xl sm:text-4xl tracking-tight">FREEDOM<span className="text-[#FCD34D]">20</span></div>
              <div className="text-white/90 text-[10px] sm:text-xs uppercase tracking-widest font-semibold mt-0.5">20% off · no autoship</div>
            </div>
            <div className="flex-1 text-center sm:text-left">
              <h2 className="text-white font-extrabold text-xl sm:text-2xl leading-tight">Most online pet stores force a subscription for their best prices. We don't.</h2>
              <p className="text-white/90 text-sm sm:text-base mt-1">Same vet-quality brands. Same great price on every order — first, tenth, or one-time. No subscription lock-in. Max $10 off your first order.</p>
            </div>
            <Link
              to="/products"
              className="flex-shrink-0 inline-flex items-center gap-2 bg-[#FCD34D] hover:bg-[#FBBF24] text-[#1E3A8A] font-bold text-sm sm:text-base px-6 py-3 rounded-full shadow-md transition-colors"
            >
              Shop now <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Birthday Banner */}
      <BirthdayBanner />

      {/* Shop by Pet Type */}
      <section className="py-16 bg-gradient-to-b from-white via-blue-50/30 to-white relative overflow-hidden">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center mb-12 relative z-30">
            <h2
              className="text-3xl md:text-5xl font-black mb-3"
              style={{
                background: 'linear-gradient(to right, #2563eb, #9333ea, #db2777)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                color: '#9333ea',
              }}
            >
              Shop by Pet Type
            </h2>
            <p className="text-gray-600 text-lg max-w-2xl mx-auto">Find everything your furry friend needs</p>
          </div>

          <div className="relative overflow-visible">
            {/* Desktop */}
            <div className="hidden md:block relative">
              {showLeftArrow && (
                <button
                  onClick={() => scrollPetTypes('left')}
                  className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-white p-2 rounded-full shadow-lg"
                >
                  <ChevronLeft size={20} />
                </button>
              )}
              {showRightArrow && (
                <button
                  onClick={() => scrollPetTypes('right')}
                  className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-white p-2 rounded-full shadow-lg"
                >
                  <ChevronRight size={20} />
                </button>
              )}
              <div
                ref={petTypesScrollRef}
                className="flex justify-center items-center gap-8 overflow-x-auto pb-6 pt-6 scrollbar-hide snap-x px-8"
              >
                {PET_CATEGORIES.map((category, index) => (
                  <div
                    key={index}
                    className="flex-shrink-0 snap-center group cursor-pointer"
                    onClick={() => navigate(`/products?petType=${category.slug}`)}
                  >
                    <div className="flex flex-col items-center gap-3">
                      <div className="relative w-32 h-32 rounded-full bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 p-[3px] group-hover:scale-110 transition-all shadow-lg">
                        <div className="w-full h-full rounded-full overflow-hidden bg-white">
                          <img src={category.image} alt={category.name} className="w-full h-full object-cover" loading="lazy" />
                        </div>
                      </div>
                      <p className="text-lg font-bold text-gray-800 group-hover:text-blue-600 transition-colors">{category.name}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Mobile */}
            <div className="md:hidden flex overflow-x-auto gap-3 px-2 pb-2 scrollbar-hide">
              {PET_CATEGORIES.map((category, index) => (
                <div
                  key={index}
                  className="flex flex-col items-center gap-1.5 flex-shrink-0 w-[90px]"
                  onClick={() => navigate(`/products?petType=${category.slug}`)}
                >
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

      <CategoryIcons />

      <TodaysDeals />

      {/* Trending Products */}
      <section className="py-16 bg-gradient-to-b from-white via-blue-50 to-white text-center">
        <div className="container mx-auto px-4 lg:px-8">
          <h2
            className="text-4xl md:text-5xl font-black mb-3"
            style={{
              background: 'linear-gradient(to right, #2563eb, #9333ea, #db2777)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              color: '#9333ea',
            }}
          >
            Trending Products
          </h2>
          {isLoading ? (
            <LoadingSpinner size="lg" />
          ) : (
            <div className="flex overflow-x-auto gap-4 md:gap-5 pb-4 scrollbar-hide">
              {filteredFeaturedProducts.map((product, index) => (
                <div key={product._id} className="flex-shrink-0 w-56 md:w-64">
                  <ProductCard product={product} hideCartButton={true} index={index} />
                </div>
              ))}
            </div>
          )}
          <div className="mt-8">
            <Link
              to="/products?featured=true"
              className="inline-flex items-center gap-3 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 text-white px-8 py-4 rounded-full font-bold text-lg hover:scale-105 transition-all"
            >
              <span>View All Products</span>
              <ChevronRight size={24} />
            </Link>
          </div>
        </div>
      </section>

      {/* Premium CTA */}
      <section className="py-16 bg-gradient-to-r from-purple-900 via-blue-900 to-indigo-900 text-white text-center md:text-left">
        <div className="container mx-auto px-4 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="flex-1">
            <h2 className="text-4xl md:text-6xl font-black mb-4 leading-tight">
              <span className="bg-gradient-to-r from-pink-400 via-yellow-300 to-pink-400 bg-clip-text text-transparent">
                Premium Pet Products
              </span>
            </h2>
            <p className="text-xl md:text-2xl opacity-95 mb-4">Quality You Can Trust</p>
          </div>
          <Link
            to="/products"
            className="bg-gradient-to-r from-orange-500 via-pink-500 to-purple-600 px-8 py-6 rounded-3xl shadow-2xl border-2 border-white/30 transform hover:scale-105 transition-all text-center"
          >
            <p className="text-base font-bold uppercase">Shop Now</p>
            <p className="text-2xl font-black">All Products</p>
          </Link>
        </div>
      </section>

      <TrustBadges />

      {/* What Makes Us Different */}
      <section className="py-20 bg-gradient-to-br from-blue-600 via-purple-700 to-pink-600 text-white text-center">
        <div className="container mx-auto px-4 lg:px-8">
          <h2 className="text-4xl md:text-5xl font-black mb-4">What Makes Us Different</h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mt-12">
            {[
              { icon: '🚚', title: 'Free Shipping', desc: 'Over $49' },
              { icon: '⭐', title: 'Premium Quality', desc: 'Trusted brands' },
              { icon: '💳', title: 'Secure Payment', desc: 'Safe & Encrypted' },
              { icon: '🔄', title: 'Easy Returns', desc: 'Hassle-free' },
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

      {/* Brands We Carry */}
      <section className="py-14 bg-gray-50 border-t border-gray-100">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl md:text-3xl font-black text-gray-900">Shop by Brand</h2>
              <p className="text-gray-500 text-sm mt-1">Click a brand to browse their products</p>
            </div>
            <Link
              to="/products"
              className="hidden md:flex items-center gap-1 text-blue-600 hover:text-blue-700 font-semibold text-sm border border-blue-200 rounded-full px-4 py-1.5 hover:bg-blue-50 transition-colors"
            >
              All brands →
            </Link>
          </div>

          {/* Scrollable brand strip */}
          <div className="flex gap-4 overflow-x-auto pb-3 scrollbar-hide snap-x snap-mandatory">
            {BRANDS.map((brand, i) => (
              <button
                key={i}
                onClick={() => navigate(`/products?brand=${encodeURIComponent(brand.name)}`)}
                className="group flex-none snap-start focus:outline-none"
                aria-label={`Shop ${brand.name} products`}
              >
                <div className="w-36 h-24 flex items-center justify-center rounded-2xl bg-white border-2 border-transparent shadow-sm group-hover:border-blue-400 group-hover:shadow-lg transition-all duration-200 overflow-hidden">
                  <img
                    src={brand.logo}
                    alt={brand.name}
                    className="w-full h-full object-cover rounded-2xl group-hover:scale-105 transition-transform duration-300"
                    loading="lazy"
                    onError={(e) => {
                      const target = e.currentTarget;
                      target.style.display = 'none';
                      const parent = target.parentElement;
                      if (parent) {
                        parent.style.background = '#f3f4f6';
                        parent.innerHTML = `<span style="font-weight:800;font-size:13px;text-align:center;color:#374151;padding:8px;line-height:1.3">${brand.name}</span>`;
                      }
                    }}
                  />
                </div>
                <p className="text-center text-xs text-gray-500 mt-2 font-semibold group-hover:text-blue-600 transition-colors truncate w-36">
                  {brand.name}
                </p>
              </button>
            ))}
          </div>

          <div className="text-center mt-6 md:hidden">
            <Link to="/products" className="text-blue-600 font-semibold text-sm">
              View all brands →
            </Link>
          </div>
        </div>
      </section>

      {/* Customer Testimonials */}
      <section className="py-16 bg-gradient-to-b from-blue-50 to-white">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="text-center mb-12">
            <h2
              className="text-3xl md:text-5xl font-black mb-3"
              style={{
                background: 'linear-gradient(to right, #2563eb, #9333ea, #db2777)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                color: '#9333ea',
              }}
            >
              What Pet Parents Say
            </h2>
            <p className="text-gray-500 text-lg">Real reviews from our NYC community</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                name: 'Maria G.',
                location: 'Queens, NY',
                pet: '🐕 Dog parent',
                stars: 5,
                text: "Best pet store I've found in Jackson Heights. My golden retriever loves the Blue Buffalo food and it arrived the next day. Amazing service!",
              },
              {
                name: 'Kevin T.',
                location: 'Brooklyn, NY',
                pet: '🐈 Cat parent',
                stars: 5,
                text: 'I order Royal Canin for my cats every month. The prices are great and the delivery is fast. Petshiwu has become my go-to pet store.',
              },
              {
                name: 'Sandra L.',
                location: 'Manhattan, NY',
                pet: '🐠 Fish & reptile owner',
                stars: 5,
                text: 'Finally a store that carries everything I need for my aquarium AND my bearded dragon. Huge selection and super helpful customer service.',
              },
            ].map((review, i) => (
              <div key={i} className="bg-white rounded-2xl shadow-md p-6 border border-gray-100 hover:-translate-y-1 transition-all">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <p className="font-bold text-gray-900">{review.name}</p>
                    <p className="text-gray-400 text-xs">
                      {review.location} · {review.pet}
                    </p>
                  </div>
                  <div className="text-yellow-400 text-lg">{'★'.repeat(review.stars)}</div>
                </div>
                <p className="text-gray-700 text-sm leading-relaxed">"{review.text}"</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Newsletter Signup */}
      <NewsletterSection />

      <style>{`.scrollbar-hide::-webkit-scrollbar{display:none}.scrollbar-hide{-ms-overflow-style:none;scrollbar-width:none}`}</style>
    </div>
  );
};

const API_URL = (import.meta as any).env?.VITE_API_URL || 'https://www.petshiwu.com/api';

const NewsletterSection = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [code, setCode] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${API_URL}/v1/newsletter/subscribe`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), source: 'homepage' }),
      });
      const data = await res.json();
      if (data.success || data.alreadySubscribed) {
        setSubmitted(true);
        setCode(data.code || 'WELCOME10');
      } else {
        setError(data.message || 'Something went wrong.');
      }
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="py-16 bg-gradient-to-r from-indigo-900 via-purple-900 to-blue-900 text-white">
      <div className="container mx-auto px-4 lg:px-8 text-center">
        <div className="max-w-2xl mx-auto">
          <div className="text-5xl mb-4">🐾</div>
          {!submitted ? (
            <>
              <h2 className="text-3xl md:text-4xl font-black mb-3">Get 10% Off Your First Order</h2>
              <p className="text-white/80 text-lg mb-8">
                Join NYC pet parents. Get exclusive deals, new product alerts, and expert pet care tips delivered to your inbox.
              </p>
              <form className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto" onSubmit={handleSubmit}>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  className="flex-1 px-5 py-3 rounded-full text-gray-900 text-base focus:outline-none focus:ring-2 focus:ring-purple-400"
                />
                <button
                  type="submit"
                  disabled={loading}
                  className="bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600 text-white font-bold px-7 py-3 rounded-full transition-all hover:scale-105 whitespace-nowrap disabled:opacity-60"
                >
                  {loading ? 'Sending...' : 'Get 10% Off'}
                </button>
              </form>
              {error && <p className="text-red-300 text-sm mt-2">{error}</p>}
              <p className="text-white/50 text-xs mt-4">No spam, ever. Unsubscribe anytime.</p>
            </>
          ) : (
            <>
              <h2 className="text-3xl md:text-4xl font-black mb-3">You're in! 🎉</h2>
              <p className="text-white/80 text-lg mb-4">Check your inbox. Your discount code:</p>
              <div className="inline-block bg-white/10 border-2 border-dashed border-white/40 rounded-2xl px-10 py-4 mb-6">
                <span className="text-4xl font-black tracking-widest text-yellow-300">{code}</span>
                <p className="text-white/70 text-sm mt-1">10% off your entire order</p>
              </div>
              <br />
              <a href="/products" className="inline-block bg-gradient-to-r from-orange-500 to-pink-500 text-white font-bold px-10 py-3 rounded-full hover:scale-105 transition-transform">
                Shop Now →
              </a>
            </>
          )}
        </div>
      </div>
    </section>
  );
};

export default Home;
