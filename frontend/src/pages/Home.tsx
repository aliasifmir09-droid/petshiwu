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
import TonightPromiseCard from '@/components/TonightPromiseCard';
import HomeHeroSlogans from '@/components/HomeHeroSlogans';
import HomeFeaturedLearning from '@/components/HomeFeaturedLearning';
import OrdersOpenBanner from '@/components/OrdersOpenBanner';
import RestockDashboard from '@/components/RestockDashboard';
import { ORDERS_OPEN_LABEL, areOrdersOpen } from '@/config/launch';
import { ORDERING_PAUSED, ORDERING_PAUSED_HEADLINE } from '@/config/ordering';
import { SOCIAL_PROFILES } from '@/config/social';
import { CATALOG_BRANDS_FAQ, CATALOG_BRANDS_SHORT, CATALOG_PRODUCT_COUNT_LABEL } from '@/config/catalog';
import { NEWSLETTER_CODE, NEWSLETTER_CODE_COPY } from '@/config/constants';
import { ChevronRight } from 'lucide-react';
import { useMemo, useState } from 'react';
import { hasImageFailed } from '@/hooks/useImageLoadTracker';
import { generateProductUrl } from '@/utils/productUrl';
import { useAuthStore } from '@/stores/authStore';

const BRANDS: { name: string; query: string; logo: string; dark?: boolean }[] = [
  { name: 'Purina',              query: 'Purina',              logo: '/brands/purina.svg' },
  { name: 'Blue Buffalo',        query: 'Blue Buffalo',        logo: '/brands/bluebuffalo.png' },
  { name: 'Royal Canin',         query: 'Royal Canin',         logo: '/brands/royalcanin.svg' },
  { name: "Hill's Science Diet", query: "Hill's Science Diet", logo: '/brands/hills.png' },
  { name: 'Wellness',            query: 'Wellness',            logo: '/brands/wellness.png' },
  { name: 'Nutro',               query: 'NUTRO',               logo: '/brands/nutro.png' },
  { name: 'Iams',                query: 'Iams',                logo: '/brands/iams.png' },
  { name: 'Pedigree',            query: 'Pedigree',            logo: '/brands/pedigree.png', dark: true },
  { name: "Nature's Recipe",     query: "Nature's Recipe",     logo: '/brands/natures.svg' },
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
              Vet-recommended nutrition
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
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const authLoading = useAuthStore((state) => state.isLoading);
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
    <div className="relative bg-white">
      <SEO
        title="Petshiwu — Pet Food, Treats & Supplies"
        description={
          ORDERING_PAUSED
            ? `${CATALOG_PRODUCT_COUNT_LABEL} pet products from ${CATALOG_BRANDS_SHORT}. ${ORDERING_PAUSED_HEADLINE}. Free shipping over $49. No autoship.`
            : areOrdersOpen()
            ? `${CATALOG_PRODUCT_COUNT_LABEL} pet products from ${CATALOG_BRANDS_SHORT}. Free shipping over $49. No autoship. Currently delivering in NYC. Nationwide shipping opens in a few days.`
            : `${CATALOG_PRODUCT_COUNT_LABEL} pet products from ${CATALOG_BRANDS_SHORT}. We start taking orders ${ORDERS_OPEN_LABEL}. Free shipping over $49.`
        }
      />
      <StructuredData type="website" data={{}} />
      <StructuredData
        type="faq"
        data={{
          mainEntity: [
            {
              '@type': 'Question',
              name: 'What brands does Petshiwu carry?',
              acceptedAnswer: {
                '@type': 'Answer',
                text: `Petshiwu carries ${CATALOG_PRODUCT_COUNT_LABEL} products from premium brands including ${CATALOG_BRANDS_FAQ}. We carry both regular and veterinary-prescription diets.`
              }
            },
            {
              '@type': 'Question',
              name: 'Does Petshiwu require an autoship subscription?',
              acceptedAnswer: {
                '@type': 'Answer',
                text: 'No. There is no required subscription. First order: FREEDOM20, 20% off max $10. Repeat: 10% off max $10, no autoship. Optional restock reminders only charge when you confirm.'
              }
            },
            {
              '@type': 'Question',
              name: 'How much does Petshiwu shipping cost?',
              acceptedAnswer: {
                '@type': 'Answer',
                text: 'Shipping is free on orders over $49. Orders under $49 have a flat $6 shipping fee. We are currently delivering in NYC, with nationwide shipping opening in a few days.'
              }
            },
            {
              '@type': 'Question',
              name: 'Can I get prescription veterinary diets from Petshiwu?',
              acceptedAnswer: {
                '@type': 'Answer',
                text: 'Yes. We carry Hill\'s Prescription Diet, Royal Canin Veterinary Diet, and Purina Pro Plan Veterinary Diets. Your vet can upload or fax the prescription at checkout.'
              }
            },
            {
              '@type': 'Question',
              name: 'Where does Petshiwu deliver right now?',
              acceptedAnswer: {
                '@type': 'Answer',
                text: 'We currently deliver in New York City — all five boroughs — with same-day when you order by 3 PM EST weekdays (1 PM EST weekends). Nationwide shipping opens in a few days. We are an online store only; the Jackson Heights address is warehouse and office, not a walk-in shop.'
              }
            },
            {
              '@type': 'Question',
              name: 'Does Petshiwu carry cat supplies too?',
              acceptedAnswer: {
                '@type': 'Answer',
                text: `Yes. We carry full cat supply lines — food (${CATALOG_BRANDS_SHORT}), litter, toys, scratching posts, and prescription diets.`
              }
            },
            {
              '@type': 'Question',
              name: 'How do I contact Petshiwu customer service?',
              acceptedAnswer: {
                '@type': 'Answer',
                text: 'Call +1 (800) 259-2605 anytime — support is 24/7. You can also email support@petshiwu.com or use the contact form on our /contact page.'
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
            `Petshiwu is an online pet store for food, treats, toys, and supplies. ${CATALOG_PRODUCT_COUNT_LABEL} products, free shipping over $49. No autoship.`,
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
            `Online pet store for food, treats, and supplies. Currently delivering in NYC, with nationwide shipping opening soon. Warehouse and office only — not a walk-in store. ${CATALOG_PRODUCT_COUNT_LABEL} products from top brands. Free delivery on orders over $49.`,
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
          areaServed: ['United States', 'New York City'],
          paymentAccepted: 'Cash, Credit Card, Debit Card',
          currenciesAccepted: 'USD',
          sameAs: [...SOCIAL_PROFILES],
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

      {!authLoading && isAuthenticated ? <RestockDashboard /> : null}

      <HomeHeroSlogans />

      <ShopByPet />

      <CategoryIcons />

      <TrustBadges />

      <HomeFeaturedLearning />

      <OrdersOpenBanner />

      <div className="mt-4">
        <HeroSlideshow />
      </div>

      <TodaysDeals />

      <section className="py-14 bg-white text-center">
        <div className="container mx-auto px-4 lg:px-8">
          <p className="text-xs font-semibold tracking-wide uppercase text-slate-500 mb-2">Featured</p>
          <h2 className="text-3xl md:text-4xl font-extrabold text-[#1E3A8A] mb-8">
            Top picks for dogs and cats
          </h2>
          {isLoading ? (
            <LoadingSpinner size="lg" />
          ) : filteredFeaturedProducts.length === 0 ? (
            <p className="text-slate-500">
              Browse the shop — featured picks from {CATALOG_BRANDS_SHORT} will appear here.
            </p>
          ) : (
            <div className="flex overflow-x-auto gap-4 md:gap-5 pb-4 scrollbar-hide">
              {filteredFeaturedProducts.map((product, index) => (
                <div key={product._id} className="flex-shrink-0 w-56 md:w-64">
                  <ProductCard product={product} hideCartButton={false} index={index} />
                </div>
              ))}
            </div>
          )}
          <div className="mt-8">
            <Link
              to="/products?featured=true"
              className="inline-flex items-center gap-2 bg-[#1E3A8A] text-white px-6 py-3 rounded-lg font-semibold hover:bg-[#1e40af] transition-colors"
            >
              <span>Shop all products</span>
              <ChevronRight size={20} />
            </Link>
          </div>
        </div>
      </section>

      {/* Brands We Carry */}
      <section className="py-14 bg-gray-50 border-y border-gray-100">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl md:text-3xl font-extrabold text-[#1E3A8A]">Shop top brands</h2>
              <p className="text-gray-500 text-sm mt-1">Hill’s, Royal Canin, Purina, Blue Buffalo, and more</p>
            </div>
            <Link
              to="/products"
              className="hidden md:flex items-center gap-1 text-[#1E3A8A] hover:text-[#163074] font-semibold text-sm border border-[#1E3A8A]/20 rounded-lg px-4 py-1.5 hover:bg-blue-50 transition-colors"
            >
              All brands →
            </Link>
          </div>

          {/* Scrollable brand strip */}
          <div className="flex gap-4 overflow-x-auto pb-3 scrollbar-hide snap-x snap-mandatory">
            {BRANDS.map((brand, i) => (
              <button
                key={i}
                onClick={() => navigate(`/products?brand=${encodeURIComponent(brand.query)}`)}
                className="group flex-none snap-start focus:outline-none"
                aria-label={`Shop ${brand.name} products`}
              >
                <div
                  className={`w-36 h-24 flex items-center justify-center rounded-2xl border-2 border-transparent shadow-sm group-hover:border-[#1E3A8A] group-hover:shadow-lg transition-all duration-200 overflow-hidden ${
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
                <p className="text-center text-xs text-gray-500 mt-2 font-semibold group-hover:text-[#1E3A8A] transition-colors truncate w-36">
                  {brand.name}
                </p>
              </button>
            ))}
          </div>

          <div className="text-center mt-6 md:hidden">
            <Link to="/products" className="text-[#1E3A8A] font-semibold text-sm">
              View all brands →
            </Link>
          </div>
        </div>
      </section>

      <TonightPromiseCard />

      <TonightDeliveryHowItWorks />

      <section className="py-14 bg-white">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="text-center mb-10">
            <p className="text-xs font-semibold tracking-wide uppercase text-slate-500 mb-2">Why Petshiwu</p>
            <h2 className="text-3xl md:text-4xl font-extrabold text-[#1E3A8A] mb-2">
              A national pet store, online
            </h2>
            <p className="text-slate-500">Shop by pet. Shop by brand. No autoship. 365-day returns.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {[
              {
                title: 'Shop by pet, then by aisle',
                text: 'Dogs, cats, birds, fish, reptiles, and small pets. Food, treats, litter, toys, and prescription diets — the aisles you expect from a national pet retailer.',
              },
              {
                title: 'Vet-quality brands, no subscription trap',
                text: `${CATALOG_BRANDS_SHORT} — plus prescription diets. Order once or restock when you want. We never charge in the background.`,
              },
              {
                title: '365-day returns and 24/7 support',
                text: 'Unused items come back easy. Call +1 (800) 259-2605 any time. Currently delivering in NYC. Nationwide shipping opens in a few days.',
              },
            ].map((item) => (
              <div key={item.title} className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
                <h3 className="font-semibold text-[#1E3A8A] mb-2">{item.title}</h3>
                <p className="text-slate-700 text-sm leading-relaxed">{item.text}</p>
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
  const [emailSent, setEmailSent] = useState(false);
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
        setCode(data.code || NEWSLETTER_CODE);
        setEmailSent(Boolean(data.emailSent));
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
    <section className="bg-[#1E3A8A] text-white">
      <div className="h-px w-full bg-white/20" />
      <div className="container mx-auto px-4 lg:px-8 py-14 text-center">
        <div className="max-w-2xl mx-auto">
          {!submitted ? (
            <>
              <h2 className="text-2xl md:text-3xl font-extrabold mb-3">Save on your next order</h2>
              <p className="text-white/80 mb-8">
                First order: FREEDOM20 (20% off, max $10). Repeat: 10% off, max $10. No autoship.
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
                  className="bg-white text-[#1E3A8A] font-semibold px-7 py-3 rounded-md whitespace-nowrap disabled:opacity-60 hover:bg-slate-100"
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
              <p className="text-white/80 mb-4">
                {emailSent ? 'Check your inbox. Your code:' : 'Save this code and enter it at checkout:'}
              </p>
              <div className="inline-block bg-white/10 border border-white/30 rounded-xl px-10 py-4 mb-6">
                <span className="text-3xl font-bold tracking-widest">{code}</span>
                <p className="text-white/70 text-sm mt-1">{NEWSLETTER_CODE_COPY}</p>
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
