import { useEffect, Suspense } from 'react';
import { lazyWithRetry } from './utils/lazyWithRetry';
import { BrowserRouter, Routes, Route, Navigate, useLocation, useNavigate, useParams } from 'react-router-dom';
import { ALL_NEIGHBORHOOD_PAGES } from './data/neighborhoodPages';
import NeighborhoodCategoryPage from './pages/seo/NeighborhoodCategoryPage';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAuthStore } from './stores/authStore';
import { useWishlistStore } from './stores/wishlistStore';
import { authService } from './services/auth';
import Header from './components/Header';
import Footer from './components/Footer';
import LoadingSpinner from './components/LoadingSpinner';
import ErrorBoundaryWithReporting from './components/ErrorBoundaryWithReporting';
import { initAnalytics, trackPageView } from './utils/analytics';
import BottomNav from './components/BottomNav';
import CookieConsent from './components/CookieConsent';
import EmailPopup from './components/EmailPopup';
import StructuredData from './components/StructuredData';
import { SOCIAL_PROFILES } from './config/social';
import { AREA_SERVED_NOW, ORGANIZATION_DESCRIPTION, PAYMENT_ACCEPTED } from './config/publicSeo';
import RequireAuth from './components/RequireAuth';
import Home from './pages/Home';
import { hashAuthRedirect } from './utils/hashAuthRedirect';
import { isRestockCoupon, rememberRestockCoupon } from './utils/restock';
import { useCustomerSessionTimeout } from './hooks/useCustomerSessionTimeout';
import { readLastActiveAt, shouldExpireCustomerSession } from './utils/sessionTimeout';
import './index.css';

const Products = lazyWithRetry(() => import('./pages/Products'));
const ProductDetail = lazyWithRetry(() => import('./pages/ProductDetail'));
const Category = lazyWithRetry(() => import('./pages/Category'));
const PetType = lazyWithRetry(() => import('./pages/PetType'));
const Cart = lazyWithRetry(() => import('./pages/Cart'));
const Checkout = lazyWithRetry(() => import('./pages/Checkout'));
const Login = lazyWithRetry(() => import('./pages/Login'));
const Register = lazyWithRetry(() => import('./pages/Register'));
const VerifyEmail = lazyWithRetry(() => import('./pages/VerifyEmail'));
const ResendVerification = lazyWithRetry(() => import('./pages/ResendVerification'));
const ForgotPassword = lazyWithRetry(() => import('./pages/ForgotPassword'));
const ResetPassword = lazyWithRetry(() => import('./pages/ResetPassword'));
const Profile = lazyWithRetry(() => import('./pages/Profile'));
const ProductComparison = lazyWithRetry(() => import('./pages/ProductComparison'));
const Returns = lazyWithRetry(() => import('./pages/Returns'));
const ReturnPolicy = lazyWithRetry(() => import('./pages/ReturnPolicy'));
const AddressManagement = lazyWithRetry(() => import('./pages/AddressManagement'));
const StockAlerts = lazyWithRetry(() => import('./pages/StockAlerts'));
const AdvancedSearch = lazyWithRetry(() => import('./pages/AdvancedSearch'));
const MyOrders = lazyWithRetry(() => import('./pages/MyOrders'));
const Restock = lazyWithRetry(() => import('./pages/Restock'));
const OrderDetail = lazyWithRetry(() => import('./pages/OrderDetail'));
const TrackOrder = lazyWithRetry(() => import('./pages/TrackOrder'));
const Donate = lazyWithRetry(() => import('./pages/Donate'));
const Favorites = lazyWithRetry(() => import('./pages/Favorites'));
const Learning = lazyWithRetry(() => import('./pages/Learning'));
const BlogDetail = lazyWithRetry(() => import('./pages/BlogDetail'));
const CareGuides = lazyWithRetry(() => import('./pages/CareGuides'));
const CareGuideDetail = lazyWithRetry(() => import('./pages/CareGuideDetail'));
const FAQ = lazyWithRetry(() => import('./pages/FAQ'));
const SymptomChecker = lazyWithRetry(() => import('./pages/SymptomChecker'));
const About = lazyWithRetry(() => import('./pages/About'));
const BrandStory = lazyWithRetry(() => import('./pages/BrandStory'));
const Press = lazyWithRetry(() => import('./pages/Press'));
const Contact = lazyWithRetry(() => import('./pages/Contact'));
const NotFound = lazyWithRetry(() => import('./pages/NotFound'));
const Forbidden = lazyWithRetry(() => import('./pages/Forbidden'));
const SensitiveStomachDogs = lazyWithRetry(() => import('./pages/seo/SensitiveStomachDogs'));
const PickyEaters = lazyWithRetry(() => import('./pages/seo/PickyEaters'));
const AggressiveChewers = lazyWithRetry(() => import('./pages/seo/AggressiveChewers'));
const PetSuppliesDeliveryNYC = lazyWithRetry(() => import('./pages/seo/PetSuppliesDeliveryNYC'));
const DogFoodDeliveryNYC = lazyWithRetry(() => import('./pages/seo/DogFoodDeliveryNYC'));
const CatFoodDeliveryNYC = lazyWithRetry(() => import('./pages/seo/CatFoodDeliveryNYC'));
const PetStoreQueensNY = lazyWithRetry(() => import('./pages/seo/PetStoreQueensNY'));
const OnlinePetStoreNYC = lazyWithRetry(() => import('./pages/seo/OnlinePetStoreNYC'));
const PetSuppliesNearMeNYC = lazyWithRetry(() => import('./pages/seo/PetSuppliesNearMeNYC'));
const AffordablePetFoodNYC = lazyWithRetry(() => import('./pages/seo/AffordablePetFoodNYC'));
const PetFoodSubscriptionNYC = lazyWithRetry(() => import('./pages/seo/PetFoodSubscriptionNYC'));
const RawDogFoodNYC = lazyWithRetry(() => import('./pages/seo/RawDogFoodNYC'));
const OrganicCatFoodNYC = lazyWithRetry(() => import('./pages/seo/OrganicCatFoodNYC'));
const LuxuryPetAccessoriesNYC = lazyWithRetry(() => import('./pages/seo/LuxuryPetAccessoriesNYC'));
const PetSuppliesQueensNY = lazyWithRetry(() => import('./pages/seo/PetSuppliesQueensNY'));
const PetSuppliesBrooklynNY = lazyWithRetry(() => import('./pages/seo/PetSuppliesBrooklynNY'));
const PetSuppliesManhattanNY = lazyWithRetry(() => import('./pages/seo/PetSuppliesManhattanNY'));
const PetSuppliesBronxNY = lazyWithRetry(() => import('./pages/seo/PetSuppliesBronxNY'));
const PetSuppliesStatenIslandNY = lazyWithRetry(() => import('./pages/seo/PetSuppliesStatenIslandNY'));
const PetSuppliesJacksonHeightsNY = lazyWithRetry(() => import('./pages/seo/PetSuppliesJacksonHeightsNY'));
const PetSuppliesWilliamsburgNY = lazyWithRetry(() => import('./pages/seo/PetSuppliesWilliamsburgNY'));
const PetSuppliesParkSlopeNY = lazyWithRetry(() => import('./pages/seo/PetSuppliesParkSlopeNY'));
const PetSuppliesUpperWestSideNYC = lazyWithRetry(() => import('./pages/seo/PetSuppliesUpperWestSideNYC'));
const PetSuppliesDUMBONY = lazyWithRetry(() => import('./pages/seo/PetSuppliesDUMBONY'));
const PetSuppliesLongIslandCityNY = lazyWithRetry(() => import('./pages/seo/PetSuppliesLongIslandCityNY'));
const PetSuppliesSoHoNYC = lazyWithRetry(() => import('./pages/seo/PetSuppliesSoHoNYC'));
const PetSuppliesAstoriaNY = lazyWithRetry(() => import('./pages/seo/PetSuppliesAstoriaNY'));
const Investors = lazyWithRetry(() => import('./pages/Investors'));
const Innovation = lazyWithRetry(() => import('./pages/Innovation'));
const SellWithUs = lazyWithRetry(() => import('./pages/SellWithUs'));
const BestFoodSensitiveStomach = lazyWithRetry(() => import('./pages/blog/BestFoodSensitiveStomach'));
const PrivacyPolicy = lazyWithRetry(() => import('./pages/PrivacyPolicy'));
const CookiePolicy = lazyWithRetry(() => import('./pages/CookiePolicy'));

// Neighborhood × Category programmatic pages (200 pages) — see top of file for imports
const Terms = lazyWithRetry(() => import('./pages/Terms'));
const ShippingPolicy = lazyWithRetry(() => import('./pages/ShippingPolicy'));
const NextDayDeliveryZips = lazyWithRetry(() => import('./pages/NextDayDeliveryZips'));
const Brand = lazyWithRetry(() => import('./pages/Brand'));
const Accessibility = lazyWithRetry(() => import('./pages/Accessibility'));
const Unsubscribe = lazyWithRetry(() => import('./pages/Unsubscribe'));

/**
 * FIXED SEO ROUTE
 * Matches your file at: frontend/src/pages/SensitiveStomachGuide.tsx
 */
const SensitiveStomachGuide = lazyWithRetry(() => import('./pages/SensitiveStomachGuide'));
const EditorialStandards = lazyWithRetry(() => import('./pages/EditorialStandards'));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 5 * 60 * 1000,
      gcTime: 10 * 60 * 1000,
    },
    mutations: {
      retry: 1,
    }
  }
});

const warmCache = async () => {
  try {
    const { default: api } = await import('./services/api');
    await queryClient.prefetchQuery({
      queryKey: ['pet-types'],
      queryFn: async () => {
        const response = await api.get('/pet-types');
        return response.data;
      },
      staleTime: 30 * 60 * 1000,
      gcTime: 60 * 60 * 1000,
    });
    await queryClient.prefetchQuery({
      queryKey: ['categories'],
      queryFn: async () => {
        const response = await api.get('/categories');
        return response.data;
      },
      staleTime: 10 * 60 * 1000,
      gcTime: 30 * 60 * 1000,
    });
  } catch (error) {
    console.debug('Cache warming failed:', error);
  }
};

if (typeof window !== 'undefined') {
  warmCache();
}

const PageViewTracker = () => {
  const location = useLocation();
  useEffect(() => {
    const path = location.pathname + location.search;
    trackPageView(path, document.title);
  }, [location]);
  return null;
};

const CouponFromUrl = () => {
  const location = useLocation();
  useEffect(() => {
    const coupon = (new URLSearchParams(location.search).get('coupon') || '').trim().toUpperCase();
    if (isRestockCoupon(coupon)) rememberRestockCoupon(coupon);
  }, [location.search]);
  return null;
};

// Scroll to top on every page navigation — fixes SPA behaviour where
// clicking a link keeps the previous page's scroll position
const ScrollToTop = () => {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }, [pathname]);
  return null;
};

function LegacyHashAuthRedirect() {
  const navigate = useNavigate();
  useEffect(() => {
    const next = hashAuthRedirect(window.location.hash);
    if (next) navigate(next, { replace: true });
  }, [navigate]);
  return null;
};

function StoreFrame({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const isCheckout = location.pathname === '/checkout';
  return (
    <div className="flex flex-col min-h-screen">
      <ErrorBoundaryWithReporting>
        {!isCheckout && <Header />}
        <main className={isCheckout ? 'flex-1' : 'flex-1 pb-16 lg:pb-0'}>
          {children}
        </main>
        {!isCheckout && <Footer />}
        {!isCheckout && <BottomNav />}
      </ErrorBoundaryWithReporting>
    </div>
  );
}

function LegacyBlogRedirect() {
  const { slug } = useParams();
  return <Navigate to={slug ? `/learning/${slug}` : '/learning'} replace />;
}

function App() {
  const { setUser, setLoading } = useAuthStore();
  const { syncWithBackend } = useWishlistStore();
  useCustomerSessionTimeout();

  useEffect(() => {
    initAnalytics();
    import('./utils/suppressNetworkErrors').then(({ suppressNetworkErrors }) => {
      suppressNetworkErrors();
    });
    const prefetchLearning = window.setTimeout(() => {
      void import('./pages/Learning');
      void import('./pages/BlogDetail');
    }, 1200);
    const handleGlobalError = (event: ErrorEvent) => {
      const target = event.target as HTMLElement;
      if (target && target.tagName === 'IMG') {
        const errorMessage = event.message || '';
        const errorSource = (event.filename || '').toLowerCase();
        if (
          errorMessage.includes('403') ||
          errorMessage.includes('404') ||
          errorMessage.includes('Failed to load') ||
          errorSource.includes('scene7') ||
          errorSource.includes('petsmart') ||
          (target as HTMLImageElement).src?.includes('scene7') ||
          (target as HTMLImageElement).src?.includes('petsmart')
        ) {
          event.preventDefault();
          event.stopPropagation();
          return false;
        }
      }
      return true;
    };
    window.addEventListener('error', handleGlobalError, true);

    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistrations().then((registrations) => {
        for (const registration of registrations) {
          if (!registration.scope.includes('/driver/')) {
            registration.unregister();
          }
        }
      });
      caches.keys().then((cacheNames) => {
        cacheNames.forEach((cacheName) => {
          if (!cacheName.startsWith('petshiwu-driver-')) {
            caches.delete(cacheName);
          }
        });
      });
    }

    return () => {
      window.clearTimeout(prefetchLearning);
      window.removeEventListener('error', handleGlobalError, true);
    };
  }, []);

  useEffect(() => {
    const loadUser = async () => {
      try {
        const user = await authService.getMe(true);
        if (user) {
          if (shouldExpireCustomerSession(readLastActiveAt(), Date.now())) {
            useAuthStore.getState().logout({ redirect: false });
          } else {
            setUser(user);
            await syncWithBackend();
            const { persistLocalCartAfterLogin } = await import('./utils/persistLocalCartAfterLogin');
            await persistLocalCartAfterLogin();
          }
        } else {
          setUser(null);
        }
      } catch (error) {
        setUser(null);
      } finally {
        setLoading(false);
      }
    };
    loadUser();
  }, [setUser, setLoading, syncWithBackend]);

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter
        future={{
          v7_startTransition: true,
          v7_relativeSplatPath: true,
        }}
      >
        <PageViewTracker />
        <CouponFromUrl />
        <ScrollToTop />
        <LegacyHashAuthRedirect />
        {/* Delivery business schema — OnlineStore, not a walk-in PetStore */}
        <StructuredData
          type="localBusiness"
          data={{
            businessType: ['OnlineStore', 'LocalBusiness'],
            name: 'Petshiwu',
            url: 'https://www.petshiwu.com',
            logo: 'https://www.petshiwu.com/logo-square-512.png',
            image: 'https://www.petshiwu.com/logo-square-512.png',
            description: ORGANIZATION_DESCRIPTION,
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
            areaServed: [...AREA_SERVED_NOW],
            paymentAccepted: PAYMENT_ACCEPTED,
            currenciesAccepted: 'USD',
            sameAs: [...SOCIAL_PROFILES],
          }}
        />
        <StoreFrame>
              <Suspense fallback={
                <div className="container mx-auto px-4 py-12">
                  <LoadingSpinner size="lg" />
                </div>
              }>
                <Routes>
                  <Route path="/" element={<Home />} />
                  <Route path="/products" element={<Products />} />
                  <Route path="/products/:slug" element={<ProductDetail />} />
                  <Route path="/brand" element={<Brand />} />
                  <Route path="/brand/:slug" element={<Brand />} />
                  <Route path="/:petType/:categorySlug" element={<Category />} />
                  <Route path="/category/:slug" element={<Category />} />
                  <Route path="/blog" element={<Navigate to="/learning" replace />} />
                  <Route path="/blog/:slug" element={<LegacyBlogRedirect />} />
                  <Route path="/learning" element={<Learning />} />
                  <Route path="/editorial-standards" element={<EditorialStandards />} />
                  <Route path="/learning/best-dog-food-sensitive-stomach" element={<SensitiveStomachGuide />} />
                  <Route path="/learning/best-dog-foods-sensitive-stomachs" element={<BestFoodSensitiveStomach />} />
                  <Route path="/learning/:slug" element={<BlogDetail />} />
                  <Route path="/care-guides" element={<CareGuides />} />
                  <Route path="/care-guides/:slug" element={<CareGuideDetail />} />
                  <Route path="/faq" element={<FAQ />} />
                  <Route path="/symptom-checker" element={<SymptomChecker />} />
                  <Route path="/about" element={<About />} />
                  <Route path="/our-promise" element={<BrandStory slug="our-promise" />} />
                  <Route path="/for-pet-parents" element={<BrandStory slug="for-pet-parents" />} />
                  <Route path="/from-queens" element={<BrandStory slug="from-queens" />} />
                  <Route path="/press" element={<Press />} />
                  <Route path="/contact" element={<Contact />} />
                  <Route path="/cart" element={<Cart />} />
                  <Route path="/checkout" element={<Checkout />} />
                  <Route path="/pay" element={<Navigate to="/checkout" replace />} />
                  <Route path="/login" element={<Login />} />
                  <Route path="/register" element={<Register />} />
                  <Route path="/verify-email" element={<VerifyEmail />} />
                  <Route path="/resend-verification" element={<ResendVerification />} />
                  <Route path="/forgot-password" element={<ForgotPassword />} />
                  <Route path="/reset-password" element={<ResetPassword />} />
                  <Route path="/profile" element={<RequireAuth><Profile /></RequireAuth>} />
                  <Route path="/orders/:id" element={<RequireAuth><OrderDetail /></RequireAuth>} />
                  <Route path="/orders" element={<RequireAuth><MyOrders /></RequireAuth>} />
                  <Route path="/restock" element={<RequireAuth><Restock /></RequireAuth>} />
                  <Route path="/track-order" element={<TrackOrder />} />
                  <Route path="/donate" element={<Donate />} />
                  <Route path="/favorites" element={<RequireAuth><Favorites /></RequireAuth>} />
                  <Route path="/compare" element={<ProductComparison />} />
                  <Route path="/returns" element={<Returns />} />
                  <Route path="/return-policy" element={<ReturnPolicy />} />
                  <Route path="/addresses" element={<RequireAuth><AddressManagement /></RequireAuth>} />
                  <Route path="/stock-alerts" element={<RequireAuth><StockAlerts /></RequireAuth>} />
                  <Route path="/search" element={<AdvancedSearch />} />
                  
                  {/* SEO LANDING PAGES */}
                  <Route path="/best-dog-food-sensitive-stomach-diarrhea" element={<SensitiveStomachDogs />} />
                  <Route path="/high-protein-dog-food-picky-eaters" element={<PickyEaters />} />
                  <Route path="/durable-dog-toys-aggressive-chewers" element={<AggressiveChewers />} />
                  {/* NYC local SEO pages — targets delivery + near me + competitor intent searches */}
                  <Route path="/pet-supplies-delivery-nyc" element={<PetSuppliesDeliveryNYC />} />
                  <Route path="/dog-food-delivery-nyc" element={<DogFoodDeliveryNYC />} />
                  <Route path="/cat-food-delivery-nyc" element={<CatFoodDeliveryNYC />} />
                  <Route path="/pet-store-queens-ny" element={<PetStoreQueensNY />} />
                  <Route path="/online-pet-store-nyc" element={<OnlinePetStoreNYC />} />
                  <Route path="/pet-supplies-near-me-nyc" element={<PetSuppliesNearMeNYC />} />
                  <Route path="/affordable-pet-food-nyc" element={<AffordablePetFoodNYC />} />
                  <Route path="/pet-food-delivery-nyc" element={<PetFoodSubscriptionNYC />} />
                  <Route path="/raw-dog-food-nyc" element={<RawDogFoodNYC />} />
                  <Route path="/organic-cat-food-nyc" element={<OrganicCatFoodNYC />} />
                  <Route path="/luxury-pet-accessories-nyc" element={<LuxuryPetAccessoriesNYC />} />
                  <Route path="/pet-supplies-queens-ny" element={<PetSuppliesQueensNY />} />
                  <Route path="/pet-supplies-brooklyn-ny" element={<PetSuppliesBrooklynNY />} />
                  <Route path="/pet-supplies-manhattan-ny" element={<PetSuppliesManhattanNY />} />
                  <Route path="/pet-supplies-bronx-ny" element={<PetSuppliesBronxNY />} />
                  <Route path="/pet-supplies-staten-island-ny" element={<PetSuppliesStatenIslandNY />} />
                  <Route path="/pet-supplies-jackson-heights-ny" element={<PetSuppliesJacksonHeightsNY />} />
                  <Route path="/pet-supplies-williamsburg-brooklyn-ny" element={<PetSuppliesWilliamsburgNY />} />
                  <Route path="/pet-supplies-park-slope-brooklyn-ny" element={<PetSuppliesParkSlopeNY />} />
                  <Route path="/pet-supplies-upper-west-side-nyc" element={<PetSuppliesUpperWestSideNYC />} />
                  <Route path="/pet-supplies-dumbo-brooklyn-ny" element={<PetSuppliesDUMBONY />} />
                  <Route path="/pet-supplies-long-island-city-queens-ny" element={<PetSuppliesLongIslandCityNY />} />
                  <Route path="/pet-supplies-soho-nyc" element={<PetSuppliesSoHoNYC />} />
                  <Route path="/pet-supplies-astoria-queens-ny" element={<PetSuppliesAstoriaNY />} />
                  {/* Business pages */}
                  <Route path="/investors" element={<Investors />} />
                  <Route path="/innovation" element={<Innovation />} />
                  <Route path="/neural" element={<Navigate to="/search" replace />} />
                  <Route path="/scan" element={<Navigate to="/search" replace />} />
                  <Route path="/tech" element={<Navigate to="/innovation" replace />} />
                  <Route path="/sell-with-us" element={<SellWithUs />} />
                  <Route path="/vendors" element={<SellWithUs />} />
                  <Route path="/partners" element={<SellWithUs />} />
                  
                  {/* Legal & Policy pages */}
                  <Route path="/privacy" element={<PrivacyPolicy />} />
                  <Route path="/privacy-policy" element={<PrivacyPolicy />} />
                  <Route path="/terms" element={<Terms />} />
                  <Route path="/terms-of-service" element={<Terms />} />
                  <Route path="/shipping" element={<ShippingPolicy />} />
                  <Route path="/shipping-policy" element={<ShippingPolicy />} />
                  <Route path="/delivery-zips" element={<NextDayDeliveryZips />} />
                  <Route path="/accessibility" element={<Accessibility />} />
                  <Route path="/unsubscribe" element={<Unsubscribe />} />
                  <Route path="/cookie-policy" element={<CookiePolicy />} />

                  {/* Explicit routes that must NOT be caught by /:petType */}
                  <Route path="/shop" element={<Products />} />
                  <Route path="/deals" element={<Navigate to="/products?featured=true" replace />} />

                  <Route path="/403" element={<Forbidden />} />
                  <Route path="/404" element={<NotFound />} />

                  {/* Neighborhood × Category programmatic pages — 200 routes
                      Must be before /:petType to prevent slug collision
                      e.g. /dog-food-delivery-flushing-queens, /cat-food-delivery-williamsburg-brooklyn */}
                  {ALL_NEIGHBORHOOD_PAGES.map((config) => (
                    <Route
                      key={config.slug}
                      path={`/${config.slug}`}
                      element={<NeighborhoodCategoryPage config={config} />}
                    />
                  ))}

                  <Route path="/:petType" element={<PetType />} />
                  <Route path="/:petType/*" element={<ProductDetail />} />
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </Suspense>
        </StoreFrame>
        <CookieConsent />
        <EmailPopup />
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
