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
import ShopByPet from '@/components/ShopByPet';
import TonightDeliveryHowItWorks from '@/components/TonightDeliveryHowItWorks';
import OrdersOpenBanner from '@/components/OrdersOpenBanner';
import { ORDERS_OPEN_LABEL, areOrdersOpen } from '@/config/launch';
import { ChevronRight } from 'lucide-react';
import { useMemo, useState } from 'react';
import { hasImageFailed } from '@/hooks/useImageLoadTracker';
import { generateProductUrl } from '@/utils/productUrl';

const BRANDS: { name: string; logo: string; dark?: boolean }[] = [
  { name: 'Purina',              logo: '/brands/purina.svg' },
  { name: 'Blue Buffalo',        logo: '/brands/bluebuffalo.png' },
  { name: 'Royal Canin',         logo: '/brands/royalcanin.svg' },
  { name: "Hill's Science Diet", logo: '/brands/hills.png' },
  { name: 'Wellness',            logo: '/brands/wellness.png' },
  { name: 'Orijen',              logo: '/brands/orijen.svg' },
  { name: 'Nutro',               logo: '/brands/nutro.png' },
  { name: 'Iams',                logo: '/brands/iams.png' },
  { name: 'Pedigree',            logo: '/brands/pedigree.png', dark: true },
  { name: "Nature's Recipe",     logo: '/brands/natures.svg' },
];

const TodaysDeals = () => {
  const { data, isLoading } = useQuery({
    queryKey: ['products', 'hills-deals'],
    queryFn: () => productService.getProducts({ brand: "Hill's Science Diet", limit: 6, inStock: true }),
    staleTime: 5 * 60 * 1000,
  });

  const products = data?.data || [];
  if (!isLoading && products.length === 0) return null;

  return (
    <section className="py-12 bg-white border-y border-slate-100">
      <div className="container mx-auto px-4 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 mb-8">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold text-[#1E3A8A] leading-tight">
              Hill's Science Diet
            </h2>
            <p className="text-sm text-slate-500 mt-1">
              Vet-recommended nutrition, delivered in NYC
            </p>
          </div>
          <Link
            to="/products?brand=Hill%27s+Science+Diet"
            className="text-sm font-semibold text-[#1E3A8A] hover:underline"
          >
            Shop all Hill's
          </Link>
        </div>

        {isLoading ? (
          <LoadingSpinner size="lg" />
        ) : (
          <div className="flex overflow-x-auto gap-4 pb-4 scrollbar-hide">
            {products.map((product, index) => (
                <div key={product._id} className="flex-shrink-0 w-56 md:w-64 relative">
                  <ProductCard product={product} hideCartButton={false} index={index} />
                </div>
            ))}
          </div>
        )}
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

  const filteredFeaturedProducts = useMemo(() => {
    if (!featuredProducts?.data) return [];
    return featuredProducts.data.filter((product) => {
      const productId = product._id ? String(product._id) : null;
      return productId && !hasImageFailed(productId);
    });
  }, [featuredProducts?.data]);

  return (
    <div className="relative">
      {/* Single semantic H1 for the homepage (visually hidden — the hero is a
          designed image slideshow). Gives browsers a real H1 that matches the
          page title/description without altering the visual layout. */}
      <h1 className="sr-only">Petshiwu — Premium Pet Food, Toys & Supplies Delivered to NYC & Nationwide</h1>
      <SEO
        title="Petshiwu — Premium Pet Food, Toys & Supplies Delivered to NYC"
        description={
          areOrdersOpen()
            ? '10,000+ pet products delivered to Queens, Brooklyn & all of NYC. Top brands — Purina, Blue Buffalo, Royal Canin. Free shipping over $49. Dog food, cat food, toys & more.'
            : `10,000+ pet products delivered to Queens, Brooklyn & all of NYC. We start taking orders ${ORDERS_OPEN_LABEL}. Free shipping over $49.`
        }
      />
      <StructuredData type="website" data={{}} />
      <StructuredData
        type="faq"
        data={{
          mainEntity: [
            {
              '@type': 'Question',
              name: 'Does Petshiwu deliver same-day pet supplies in NYC?',
              acceptedAnswer: {
                '@type': 'Answer',
                text: 'Yes. Petshiwu offers same-day pet supply delivery across all five NYC boroughs — Manhattan, Brooklyn, Queens, Bronx, and Staten Island. Order by 3 PM EST on weekdays (1 PM EST on weekends) for same-day delivery before 11 PM. We are based in Jackson Heights, Queens and ship from our warehouse at 37-68 74th Street.'
              }
            },
            {
              '@type': 'Question',
              name: 'What brands does Petshiwu carry?',
              acceptedAnswer: {
                '@type': 'Answer',
                text: 'Petshiwu carries 10,000+ products from 200+ premium brands including Hill\'s Science Diet, Royal Canin, Purina Pro Plan, Blue Buffalo, Wellness, Orijen, Acana, Fromm, Stella & Chewy\'s, Taste of the Wild, and many more. We carry both regular and veterinary-prescription diets.'
              }
            },
            {
              '@type': 'Question',
              name: 'Does Petshiwu require an autoship subscription?',
              acceptedAnswer: {
                '@type': 'Answer',
                text: 'No. Petshiwu never requires autoship or any subscription. Order once for one-time delivery, or opt into autoship for 5% off recurring orders — your choice. Use FREEDOM20 for 20% off your first order (max $10 off, no subscription commitment).'
              }
            },
            {
              '@type': 'Question',
              name: 'Can I get prescription veterinary diets from Petshiwu?',
              acceptedAnswer: {
                '@type': 'Answer',
                text: 'Yes. We carry Hill\'s Prescription Diet, Royal Canin Veterinary Diet, and Purina Pro Plan Veterinary Diets. Your vet can upload or fax the prescription at checkout, and we ship same-day for most prescription orders.'
              }
            },
            {
              '@type': 'Question',
              name: 'How much does Petshiwu delivery cost?',
              acceptedAnswer: {
                '@type': 'Answer',
                text: 'Delivery is free on orders over $49 across all five NYC boroughs. Orders under $49 have a flat $6 shipping fee. Same-day delivery is available for orders placed before 3 PM EST on weekdays (1 PM EST on weekends).'
              }
            },
            {
              '@type': 'Question',
              name: 'Is Petshiwu a walk-in store in Jackson Heights?',
              acceptedAnswer: {
                '@type': 'Answer',
                text: 'No. Petshiwu is delivery only. The office and warehouse at 37-68 74th Street, Jackson Heights, NY 11372 is for packing orders, not walk-in shopping. Order online and we deliver same-day across all five NYC boroughs when you order before cutoff.'
              }
            },
            {
              '@type': 'Question',
              name: 'Does Petshiwu deliver cat supplies too?',
              acceptedAnswer: {
                '@type': 'Answer',
                text: 'Yes. We carry full cat supply lines — food (Hill\'s, Royal Canin, Purina, Orijen), litter, toys, scratching posts, and prescription diets. Same delivery speeds as dog supplies.'
              }
            },
            {
              '@type': 'Question',
              name: 'How do I contact Petshiwu customer service?',
              acceptedAnswer: {
                '@type': 'Answer',
                text: 'Call +1 (800) 259-2605 anytime — support is 24/7. You can also email support@petshiwu.com or use the contact form on our /contact page. The Jackson Heights address is office and warehouse only — not open for walk-in shopping.'
              }
            }
          ]
        }}
      />
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
          businessType: ['OnlineStore', 'LocalBusiness'],
          name: 'Petshiwu',
          url: 'https://www.petshiwu.com',
          logo: 'https://www.petshiwu.com/logo-square-512.png',
          image: 'https://www.petshiwu.com/logo-square-512.png',
          description:
            'Same-day pet food and supplies delivery in New York City. Jackson Heights is office and warehouse only — not a walk-in store. 10,000+ products from top brands. Free delivery on orders over $49.',
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
              opens: '00:00',
              closes: '23:59',
            },
          ],
          priceRange: '$$',
          areaServed: ['Queens', 'Brooklyn', 'Manhattan', 'Bronx', 'Staten Island', 'New York City'],
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
              url: `https://www.petshiwu.com${generateProductUrl(p as any)}`,
              name: p.name,
              ...(p.basePrice ? { offers: { '@type': 'Offer', priceCurrency: 'USD', price: p.basePrice, availability: p.inStock ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock' } } : {})
            }))
          }}
        />
      )}

      <ShopByPet />

      <OrdersOpenBanner />

      <div className="mt-4">
        <HeroSlideshow />
      </div>

      <TonightDeliveryHowItWorks />

      <CategoryIcons />

      <TodaysDeals />

      <section className="py-14 bg-white text-center">
        <div className="container mx-auto px-4 lg:px-8">
          <h2 className="text-2xl md:text-3xl font-bold text-[#1E3A8A] mb-8">
            Featured this week
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
              className="inline-flex items-center gap-2 bg-[#1E3A8A] text-white px-6 py-3 rounded-lg font-semibold hover:bg-[#1e40af] transition-colors"
            >
              <span>View all products</span>
              <ChevronRight size={20} />
            </Link>
          </div>
        </div>
      </section>

      <section className="py-10 bg-[#1E3A8A] text-white">
        <div className="container mx-auto px-4 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold mb-1">Same-day NYC delivery</h2>
            <p className="text-white/80">
              {areOrdersOpen()
                ? 'Order by 3 PM weekdays (1 PM weekends). No autoship. Free over $49.'
                : `We start taking orders ${ORDERS_OPEN_LABEL}. Browse now — checkout opens that day.`}
            </p>
          </div>
          <Link
            to="/products"
            className="bg-white text-[#1E3A8A] px-6 py-3 rounded-lg font-semibold hover:bg-slate-100 transition-colors"
          >
            {areOrdersOpen() ? 'Shop tonight' : 'Browse products'}
          </Link>
        </div>
      </section>

      <TrustBadges />

      <section className="py-14 bg-slate-50 text-center">
        <div className="container mx-auto px-4 lg:px-8">
          <h2 className="text-2xl md:text-3xl font-bold text-[#1E3A8A] mb-8">Why Petshiwu</h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { title: 'Same-day NYC', desc: 'Order by 3 PM · before 11 PM' },
              { title: 'No autoship', desc: 'Buy once. No subscription trap.' },
              { title: 'Free over $49', desc: 'Flat $6 under that' },
              { title: '365-day returns', desc: 'Unused items · no hassle' },
            ].map((item) => (
              <div key={item.title} className="bg-white rounded-xl p-5 border border-slate-100">
                <h3 className="text-base font-semibold text-[#1E3A8A] mb-1">{item.title}</h3>
                <p className="text-slate-500 text-sm">{item.desc}</p>
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
              <h2 className="text-2xl md:text-3xl font-bold text-[#1E3A8A]">Shop by brand</h2>
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
                <div
                  className={`w-36 h-24 flex items-center justify-center rounded-2xl border-2 border-transparent shadow-sm group-hover:border-blue-400 group-hover:shadow-lg transition-all duration-200 overflow-hidden ${
                    brand.dark ? 'bg-zinc-900' : 'bg-white'
                  }`}
                >
                  <img
                    src={brand.logo}
                    alt={`${brand.name} official logo`}
                    className="max-h-[4.5rem] max-w-[7.5rem] w-auto h-auto object-contain p-2 group-hover:scale-105 transition-transform duration-300"
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

      <section className="py-14 bg-white">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="text-center mb-10">
            <h2 className="text-2xl md:text-3xl font-bold text-[#1E3A8A] mb-2">
              From NYC pet parents
            </h2>
            <p className="text-slate-500">Queens, Brooklyn, and Manhattan</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {[
              {
                name: 'Maria G.',
                initials: 'MG',
                location: 'Queens, NY',
                pet: 'Dog parent',
                text: "Best pet delivery I've used in Queens. My golden retriever loves the Blue Buffalo food and it arrived the next day.",
              },
              {
                name: 'Kevin T.',
                initials: 'KT',
                location: 'Brooklyn, NY',
                pet: 'Cat parent',
                text: 'I order Royal Canin for my cats every month. The prices are fair and delivery is fast. This is my go-to shop now.',
              },
              {
                name: 'Sandra L.',
                initials: 'SL',
                location: 'Manhattan, NY',
                pet: 'Fish and reptile',
                text: 'Finally a store that carries food for my aquarium and my bearded dragon. Helpful when I called with a question.',
              },
            ].map((review) => (
              <div key={review.name} className="bg-slate-50 rounded-xl p-6 border border-slate-100">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-full bg-[#1E3A8A] text-white text-sm font-semibold flex items-center justify-center">
                    {review.initials}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">{review.name}</p>
                    <p className="text-slate-400 text-xs">
                      {review.location} · {review.pet}
                    </p>
                  </div>
                </div>
                <p className="text-slate-700 text-sm leading-relaxed">"{review.text}"</p>
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
    <section className="py-14 bg-[#1E3A8A] text-white">
      <div className="container mx-auto px-4 lg:px-8 text-center">
        <div className="max-w-2xl mx-auto">
          {!submitted ? (
            <>
              <h2 className="text-2xl md:text-3xl font-bold mb-3">Get delivery updates</h2>
              <p className="text-white/80 mb-8">
                NYC same-day notes. First order: FREEDOM20 (20% off, max $10, no autoship).
              </p>
              <form className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto" onSubmit={handleSubmit}>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  className="flex-1 px-5 py-3 rounded-lg text-gray-900 text-base focus:outline-none focus:ring-2 focus:ring-white/40"
                />
                <button
                  type="submit"
                  disabled={loading}
                  className="bg-white text-[#1E3A8A] font-semibold px-7 py-3 rounded-lg whitespace-nowrap disabled:opacity-60"
                >
                  {loading ? 'Sending...' : 'Subscribe'}
                </button>
              </form>
              {error && <p className="text-red-200 text-sm mt-2">{error}</p>}
              <p className="text-white/50 text-xs mt-4">No spam. Unsubscribe anytime.</p>
            </>
          ) : (
            <>
              <h2 className="text-2xl md:text-3xl font-bold mb-3">You're in</h2>
              <p className="text-white/80 mb-4">Check your inbox. Your code:</p>
              <div className="inline-block bg-white/10 border border-white/30 rounded-xl px-10 py-4 mb-6">
                <span className="text-3xl font-bold tracking-widest">{code}</span>
                <p className="text-white/70 text-sm mt-1">10% off your order</p>
              </div>
              <br />
              <a href="/products" className="inline-block bg-white text-[#1E3A8A] font-semibold px-8 py-3 rounded-lg">
                Shop now
              </a>
            </>
          )}
        </div>
      </div>
    </section>
  );
};

export default Home;
