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
import { ChevronRight, ChevronLeft } from 'lucide-react';
import { useRef, useState, useEffect, useMemo } from 'react';
import { hasImageFailed } from '@/hooks/useImageLoadTracker';
import { normalizeImageUrl, generateSrcSet, getOptimizedImageUrl } from '@/utils/imageUtils';
import { decodeHtmlEntities } from '@/utils/htmlUtils';

const BRANDS = [
  { name: 'Purina',              logo: 'https://logo.clearbit.com/purina.com' },
  { name: 'Blue Buffalo',        logo: 'https://logo.clearbit.com/bluebuffalo.com' },
  { name: 'Royal Canin',         logo: 'https://logo.clearbit.com/royalcanin.com' },
  { name: "Hill's Science Diet", logo: 'https://logo.clearbit.com/hillspet.com' },
  { name: 'Wellness',            logo: 'https://logo.clearbit.com/wellnesspetfood.com' },
  { name: 'Orijen',              logo: 'https://logo.clearbit.com/orijen.ca' },
  { name: 'Nutro',               logo: 'https://logo.clearbit.com/nutro.com' },
  { name: 'Iams',                logo: 'https://logo.clearbit.com/iams.com' },
  { name: 'Pedigree',            logo: 'https://logo.clearbit.com/pedigree.com' },
  { name: "Nature's Recipe",     logo: 'https://logo.clearbit.com/naturesrecipe.com' },
];

const PET_CATEGORIES = [
  { name: 'Dog',       slug: 'dog',       image: 'https://images.unsplash.com/photo-1534361960057-19889db9621e?w=500&h=500&fit=crop&q=90' },
  { name: 'Cat',       slug: 'cat',       image: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=500&h=500&fit=crop&q=90' },
  { name: 'Fish',      slug: 'fish',      image: 'https://petshiwu-cdn.b-cdn.net/dtmes0dha/image/upload/v1764591467/493202359_yqxjl5.jpg' },
  { name: 'Bird',      slug: 'bird',      image: 'https://images.unsplash.com/photo-1552728089-57bdde30beb3?w=500&h=500&fit=crop&q=90' },
  { name: 'Reptile',   slug: 'reptile',   image: 'https://petshiwu-cdn.b-cdn.net/dtmes0dha/image/upload/v1764591422/OIP_d5mo8l.webp' },
  { name: 'Small Pet', slug: 'small-pet', image: 'https://images.unsplash.com/photo-1548767797-d8c844163c4c?w=500&h=500&fit=crop&q=90' },
];

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
        title="PetShiwu — Premium Pet Food, Toys & Supplies Delivered to NYC"
        description="10,000+ pet products delivered to Queens, Brooklyn & all of NYC. Top brands — Purina, Blue Buffalo, Royal Canin. Free shipping over $49. Dog food, cat food, toys & more."
      />
      <StructuredData type="website" data={{}} />
      <StructuredData
        type="organization"
        data={{
          name: 'PetShiwu',
          url: 'https://www.petshiwu.com',
          logo: 'https://www.petshiwu.com/logo-square-512.png',
          description:
            'PetShiwu — premium pet food, toys, and supplies delivered to Queens, Brooklyn, Manhattan, and all of NYC. 10,000+ products, free shipping over $49.',
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
          name: 'PetShiwu',
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
          hasMap: 'https://maps.google.com/?q=PetShiwu+Jackson+Heights+NY+11372',
          paymentAccepted: 'Cash, Credit Card, Debit Card',
          currenciesAccepted: 'USD',
          sameAs: [
            'https://www.facebook.com/petshiwu',
            'https://www.instagram.com/petshiwu',
            'https://twitter.com/petshiwu',
          ],
        }}
      />

      {/* Hero Slideshow */}
      <div className="container mx-auto px-4 lg:px-8 mt-4">
        <HeroSlideshow />
      </div>

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
      <section className="py-14 bg-white border-t border-gray-100">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="text-center mb-10">
            <h2 className="text-3xl md:text-4xl font-black text-gray-900 mb-2">Brands We Carry</h2>
            <p className="text-gray-500 text-base">Premium brands your pets love — all in one place</p>
          </div>
          <div className="flex flex-wrap justify-center items-center gap-6 md:gap-10">
            {BRANDS.map((brand, i) => (
              <div
                key={i}
                className="group cursor-pointer"
                onClick={() => navigate(`/products?brand=${encodeURIComponent(brand.name)}`)}
                title={brand.name}
              >
                <div className="w-32 h-20 flex items-center justify-center rounded-2xl bg-white border border-gray-200 px-4 py-3 group-hover:border-blue-400 group-hover:shadow-xl transition-all duration-200">
                  <img
                    src={brand.logo}
                    alt={brand.name}
                    className="max-w-full max-h-full object-contain filter grayscale group-hover:grayscale-0 transition-all duration-300 group-hover:scale-110"
                    loading="lazy"
                    onError={(e) => {
                      const target = e.currentTarget;
                      target.style.display = 'none';
                      const parent = target.parentElement;
                      if (parent) {
                        parent.innerHTML = `<span style="font-weight:700;font-size:12px;text-align:center;color:#374151;line-height:1.3">${brand.name}</span>`;
                      }
                    }}
                  />
                </div>
                <p className="text-center text-xs text-gray-400 mt-1.5 group-hover:text-blue-500 transition-colors font-medium">
                  {brand.name}
                </p>
              </div>
            ))}
          </div>
          <div className="text-center mt-10">
            <Link to="/products" className="text-blue-600 hover:text-blue-700 font-semibold text-sm hover:underline">
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
                text: 'I order Royal Canin for my cats every month. The prices are great and the delivery is fast. PetShiwu has become my go-to pet store.',
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
      <section className="py-16 bg-gradient-to-r from-indigo-900 via-purple-900 to-blue-900 text-white">
        <div className="container mx-auto px-4 lg:px-8 text-center">
          <div className="max-w-2xl mx-auto">
            <div className="text-5xl mb-4">🐾</div>
            <h2 className="text-3xl md:text-4xl font-black mb-3">Get 10% Off Your First Order</h2>
            <p className="text-white/80 text-lg mb-8">
              Join 5,000+ NYC pet parents. Get exclusive deals, new product alerts, and expert pet care tips delivered to your inbox.
            </p>
            <form
              className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto"
              onSubmit={(e) => {
                e.preventDefault();
                const input = (e.target as HTMLFormElement).querySelector('input[type="email"]') as HTMLInputElement;
                if (input?.value) {
                  alert('🐾 Thanks for joining! Your 10% discount code is on its way.');
                  input.value = '';
                }
              }}
            >
              <input
                type="email"
                required
                placeholder="your@email.com"
                className="flex-1 px-5 py-3 rounded-full text-gray-900 text-base focus:outline-none focus:ring-2 focus:ring-purple-400"
              />
              <button
                type="submit"
                className="bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600 text-white font-bold px-7 py-3 rounded-full transition-all hover:scale-105 whitespace-nowrap"
              >
                Get 10% Off
              </button>
            </form>
            <p className="text-white/50 text-xs mt-4">No spam, ever. Unsubscribe anytime.</p>
          </div>
        </div>
      </section>

      <style>{`.scrollbar-hide::-webkit-scrollbar{display:none}.scrollbar-hide{-ms-overflow-style:none;scrollbar-width:none}`}</style>
    </div>
  );
};

export default Home;
