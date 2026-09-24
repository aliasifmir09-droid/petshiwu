import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
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
import HomeWelcomeTrust from '@/components/HomeWelcomeTrust';
import HomeFeaturedLearning from '@/components/HomeFeaturedLearning';
import NycHubLinkGrid from '@/components/NycHubLinkGrid';
import OrdersOpenBanner from '@/components/OrdersOpenBanner';
import RestockDashboard from '@/components/RestockDashboard';
import { ORDERING_PAUSED, ORDERING_PAUSED_HEADLINE } from '@/config/ordering';
import { HOMEPAGE_DESCRIPTION, HOMEPAGE_TITLE } from '@/config/publicSeo';
import { CATALOG_BRANDS_FAQ, CATALOG_BRANDS_SHORT, CATALOG_PRODUCT_COUNT_LABEL } from '@/config/catalog';
import { NEWSLETTER_CODE, NEWSLETTER_CODE_COPY } from '@/config/constants';
import { HOME_STRIP_BRANDS } from '@/data/shopBrands';
import { ChevronRight } from 'lucide-react';
import { useMemo, useState } from 'react';
import { hasImageFailed } from '@/hooks/useImageLoadTracker';
import { generateProductUrl } from '@/utils/productUrl';
import { useAuthStore } from '@/stores/authStore';

const TodaysDeals = () => {
  const { data, isLoading } = useQuery({
    queryKey: ['products', 'hills-deals'],
    queryFn: () => productService.getProducts({ brand: "Hill's Science Diet", limit: 6, inStock: true }),
    staleTime: 5 * 60 * 1000,
  });

  const products = data?.data || [];
  if (!isLoading && products.length === 0) return null;

  return (
    <section className="py-14 bg-white">
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
            to="/brand/hills-science-diet"
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
        title={HOMEPAGE_TITLE}
        description={
          ORDERING_PAUSED
            ? `${CATALOG_PRODUCT_COUNT_LABEL} pet products from ${CATALOG_BRANDS_SHORT}. ${ORDERING_PAUSED_HEADLINE}. Free shipping over $49. No autoship.`
            : HOMEPAGE_DESCRIPTION
        }
      />
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
                text: 'Shipping is free on orders over $49. Orders under $49 have a flat $6 shipping fee. Same-day in NYC. Nationwide shipping soon.'
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
                text: 'Same-day in New York City. Nationwide shipping soon. The Jackson Heights address is warehouse and office, not a walk-in shop.'
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

      <HomeWelcomeTrust />

      <ShopByPet />

      <CategoryIcons />

      <TrustBadges />

      <HomeFeaturedLearning />

      <OrdersOpenBanner />

      <div className="mt-4">
        <HeroSlideshow />
      </div>

      <TodaysDeals />

      <section className="py-16 bg-[#F7F4EE] text-center">
        <div className="container mx-auto px-4 lg:px-8">
          <p className="text-[11px] font-semibold tracking-[0.18em] uppercase text-[#1E3A8A]/60 mb-2">Featured</p>
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
              className="inline-flex items-center gap-2 bg-[#1E3A8A] text-white px-7 py-3 rounded-full font-semibold shadow-sm hover:bg-[#163074] hover:shadow-md transition-all"
            >
              <span>Shop all products</span>
              <ChevronRight size={20} />
            </Link>
          </div>
        </div>
      </section>

      {/* Brands We Carry */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl md:text-3xl font-extrabold text-[#1E3A8A]">Shop top brands</h2>
              <p className="text-gray-500 text-sm mt-1">Hill’s, Royal Canin, Purina, Blue Buffalo, and more</p>
            </div>
            <Link
              to="/brand"
              className="hidden md:flex items-center gap-1 text-[#1E3A8A] hover:text-[#163074] font-semibold text-sm border border-[#1E3A8A]/20 rounded-lg px-4 py-1.5 hover:bg-blue-50 transition-colors"
            >
              All brands →
            </Link>
          </div>

          {/* Scrollable brand strip */}
          <div className="flex gap-4 overflow-x-auto pb-3 scrollbar-hide snap-x snap-mandatory">
            {HOME_STRIP_BRANDS.map((brand) => (
              <Link
                key={brand.slug}
                to={`/brand/${brand.slug}`}
                className="group flex-none snap-start focus:outline-none"
                aria-label={`Shop ${brand.name} products`}
              >
                <div
                  className={`w-36 h-24 flex items-center justify-center rounded-2xl border border-slate-200/80 shadow-sm group-hover:border-[#1E3A8A] group-hover:shadow-md transition-all duration-200 overflow-hidden ${
                    brand.dark ? 'bg-zinc-900' : 'bg-[#F7F4EE]'
                  }`}
                >
                  {brand.logo ? (
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
                  ) : (
                    <span className="font-extrabold text-[13px] text-center text-[#374151] px-2 leading-tight">
                      {brand.name}
                    </span>
                  )}
                </div>
                <p className="text-center text-xs text-gray-500 mt-2 font-semibold group-hover:text-[#1E3A8A] transition-colors truncate w-36">
                  {brand.name}
                </p>
              </Link>
            ))}
          </div>

          <div className="text-center mt-6 md:hidden">
            <Link to="/brand" className="text-[#1E3A8A] font-semibold text-sm">
              View all brands →
            </Link>
          </div>
        </div>
      </section>

      <TonightPromiseCard />

      <NycHubLinkGrid />

      <TonightDeliveryHowItWorks />

      <section className="py-16 bg-[#F7F4EE]">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="text-center mb-10">
            <p className="text-[11px] font-semibold tracking-[0.18em] uppercase text-[#1E3A8A]/60 mb-2">Why Petshiwu</p>
            <h2 className="text-3xl md:text-4xl font-extrabold text-[#1E3A8A] mb-2">
              What you get
            </h2>
            <p className="text-slate-500">Hill’s, Royal Canin, Purina. No autoship. 365-day returns.</p>
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
                title: '365-day returns, PayPal, and 24/7 support',
                text: 'Unused items come back easy. Pay with PayPal or card. Call +1 (800) 259-2605 any time. Currently delivering in NYC. Nationwide shipping opens in a few days.',
              },
            ].map((item) => (
              <div key={item.title} className="bg-white rounded-3xl p-7 border border-[#1E3A8A]/8 shadow-sm hover:shadow-md transition-shadow">
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
      <div className="container mx-auto px-4 lg:px-8 py-16 text-center">
        <div className="max-w-2xl mx-auto">
          {!submitted ? (
            <>
              <p className="text-[11px] font-semibold tracking-[0.18em] uppercase text-white/60 mb-3">Welcome offer</p>
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
                  className="flex-1 px-5 py-3.5 rounded-full text-gray-900 text-base focus:outline-none focus:ring-2 focus:ring-white/40"
                />
                <button
                  type="submit"
                  disabled={loading}
                  className="bg-white text-[#1E3A8A] font-semibold px-8 py-3.5 rounded-full whitespace-nowrap disabled:opacity-60 hover:bg-slate-100 shadow-sm"
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
              <div className="inline-block bg-white/10 border border-white/30 rounded-2xl px-10 py-4 mb-6">
                <span className="text-3xl font-bold tracking-widest">{code}</span>
                <p className="text-white/70 text-sm mt-1">{NEWSLETTER_CODE_COPY}</p>
              </div>
              <br />
              <a href="/products" className="inline-block bg-white text-[#1E3A8A] font-semibold px-8 py-3 rounded-full">
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
