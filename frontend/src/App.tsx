import { useEffect, lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAuthStore } from './stores/authStore';
import { useWishlistStore } from './stores/wishlistStore';
import { authService } from './services/auth';
import Header from './components/Header';
import Footer from './components/Footer';
import LoadingSpinner from './components/LoadingSpinner';
import ErrorBoundaryWithReporting from './components/ErrorBoundaryWithReporting';
import { initAnalytics, trackPageView } from './utils/analytics';
import AnnouncementBar from './components/AnnouncementBar';
import BottomNav from './components/BottomNav';
import AIPetAdvisor from './components/AIPetAdvisor'; // Gemini AI powered — v2
import CookieConsent from './components/CookieConsent';
import StructuredData from './components/StructuredData';
import './index.css';

const Home = lazy(() => import('./pages/Home'));
const Products = lazy(() => import('./pages/Products'));
const ProductDetail = lazy(() => import('./pages/ProductDetail'));
const Category = lazy(() => import('./pages/Category'));
const PetType = lazy(() => import('./pages/PetType'));
const Cart = lazy(() => import('./pages/Cart'));
const Checkout = lazy(() => import('./pages/Checkout'));
const Login = lazy(() => import('./pages/Login'));
const Register = lazy(() => import('./pages/Register'));
const VerifyEmail = lazy(() => import('./pages/VerifyEmail'));
const ResendVerification = lazy(() => import('./pages/ResendVerification'));
const ForgotPassword = lazy(() => import('./pages/ForgotPassword'));
const ResetPassword = lazy(() => import('./pages/ResetPassword'));
const Profile = lazy(() => import('./pages/Profile'));
const ProductComparison = lazy(() => import('./pages/ProductComparison'));
const Returns = lazy(() => import('./pages/Returns'));
const ReturnPolicy = lazy(() => import('./pages/ReturnPolicy'));
const AddressManagement = lazy(() => import('./pages/AddressManagement'));
const StockAlerts = lazy(() => import('./pages/StockAlerts'));
const AdvancedSearch = lazy(() => import('./pages/AdvancedSearch'));
const MyOrders = lazy(() => import('./pages/MyOrders'));
const OrderDetail = lazy(() => import('./pages/OrderDetail'));
const TrackOrder = lazy(() => import('./pages/TrackOrder'));
const Donate = lazy(() => import('./pages/Donate'));
const Favorites = lazy(() => import('./pages/Favorites'));
const Learning = lazy(() => import('./pages/Learning'));
const BlogDetail = lazy(() => import('./pages/BlogDetail'));
const CareGuides = lazy(() => import('./pages/CareGuides'));
const CareGuideDetail = lazy(() => import('./pages/CareGuideDetail'));
const FAQ = lazy(() => import('./pages/FAQ'));
const About = lazy(() => import('./pages/About'));
const Contact = lazy(() => import('./pages/Contact'));
const NotFound = lazy(() => import('./pages/NotFound'));
const Forbidden = lazy(() => import('./pages/Forbidden'));
const SensitiveStomachDogs = lazy(() => import('./pages/seo/SensitiveStomachDogs'));
const PickyEaters = lazy(() => import('./pages/seo/PickyEaters'));
const AggressiveChewers = lazy(() => import('./pages/seo/AggressiveChewers'));
const PetSuppliesDeliveryNYC = lazy(() => import('./pages/seo/PetSuppliesDeliveryNYC'));
const DogFoodDeliveryNYC = lazy(() => import('./pages/seo/DogFoodDeliveryNYC'));
const CatFoodDeliveryNYC = lazy(() => import('./pages/seo/CatFoodDeliveryNYC'));
const PetStoreQueensNY = lazy(() => import('./pages/seo/PetStoreQueensNY'));
const OnlinePetStoreNYC = lazy(() => import('./pages/seo/OnlinePetStoreNYC'));
const PetSuppliesNearMeNYC = lazy(() => import('./pages/seo/PetSuppliesNearMeNYC'));
const AffordablePetFoodNYC = lazy(() => import('./pages/seo/AffordablePetFoodNYC'));
const PetFoodSubscriptionNYC = lazy(() => import('./pages/seo/PetFoodSubscriptionNYC'));
const PetSuppliesQueensNY = lazy(() => import('./pages/seo/PetSuppliesQueensNY'));
const PetSuppliesBrooklynNY = lazy(() => import('./pages/seo/PetSuppliesBrooklynNY'));
const PetSuppliesManhattanNY = lazy(() => import('./pages/seo/PetSuppliesManhattanNY'));
const PetSuppliesBronxNY = lazy(() => import('./pages/seo/PetSuppliesBronxNY'));
const PetSuppliesStatenIslandNY = lazy(() => import('./pages/seo/PetSuppliesStatenIslandNY'));
const PetSuppliesJacksonHeightsNY = lazy(() => import('./pages/seo/PetSuppliesJacksonHeightsNY'));
const Investors = lazy(() => import('./pages/Investors'));
const SellWithUs = lazy(() => import('./pages/SellWithUs'));
const BestFoodSensitiveStomach = lazy(() => import('./pages/blog/BestFoodSensitiveStomach'));
const PrivacyPolicy = lazy(() => import('./pages/PrivacyPolicy'));
const Terms = lazy(() => import('./pages/Terms'));
const ShippingPolicy = lazy(() => import('./pages/ShippingPolicy'));
const Accessibility = lazy(() => import('./pages/Accessibility'));

/**
 * FIXED SEO ROUTE
 * Matches your file at: frontend/src/pages/SensitiveStomachGuide.tsx
 */
const SensitiveStomachGuide = lazy(() => import('./pages/SensitiveStomachGuide'));

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

// Scroll to top on every page navigation — fixes SPA behaviour where
// clicking a link keeps the previous page's scroll position
const ScrollToTop = () => {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }, [pathname]);
  return null;
};

function App() {
  const { setUser, setLoading } = useAuthStore();
  const { syncWithBackend } = useWishlistStore();

  useEffect(() => {
    initAnalytics();
    import('./utils/suppressNetworkErrors').then(({ suppressNetworkErrors }) => {
      suppressNetworkErrors();
    });
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
          registration.unregister();
        }
      });
      caches.keys().then((cacheNames) => {
        cacheNames.forEach((cacheName) => {
          caches.delete(cacheName);
        });
      });
    }

    return () => {
      window.removeEventListener('error', handleGlobalError, true);
    };
  }, []);

  useEffect(() => {
    const loadUser = async () => {
      try {
        const user = await authService.getMe(true);
        if (user) {
          setUser(user);
          await syncWithBackend();
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
        <ScrollToTop />
        {/* Global PetStore schema — appears on every page for maximum local SEO signal */}
        <StructuredData
          type="localBusiness"
          data={{
            businessType: ['PetStore', 'LocalBusiness'],
            name: 'PetShiwu',
            url: 'https://www.petshiwu.com',
            logo: 'https://www.petshiwu.com/logo-square-512.png',
            image: 'https://www.petshiwu.com/logo-square-512.png',
            description:
              'Premium pet food, toys and supplies delivered to Queens, Brooklyn, Manhattan, Bronx and all of New York City. 10,000+ products from top brands. Free delivery on orders over $49.',
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
        <div className="flex flex-col min-h-screen">
          <AnnouncementBar />
          <Header />
          <main className="flex-1 pb-16 lg:pb-0">
            <ErrorBoundaryWithReporting>
              <Suspense fallback={
                <div className="container mx-auto px-4 py-12">
                  <LoadingSpinner size="lg" />
                </div>
              }>
                <Routes>
                  <Route path="/" element={<Home />} />
                  <Route path="/products" element={<Products />} />
                  <Route path="/products/:slug" element={<ProductDetail />} />
                  <Route path="/:petType/:categorySlug" element={<Category />} />
                  <Route path="/category/:slug" element={<Category />} />
                  <Route path="/blog" element={<Navigate to="/learning" replace />} />
                  <Route path="/blog/:slug" element={<Navigate to="/learning" replace />} />
                  <Route path="/learning" element={<Learning />} />
                  <Route path="/learning/:slug" element={<BlogDetail />} />
                  <Route path="/care-guides" element={<CareGuides />} />
                  <Route path="/care-guides/:slug" element={<CareGuideDetail />} />
                  <Route path="/faq" element={<FAQ />} />
                  <Route path="/about" element={<About />} />
                  <Route path="/contact" element={<Contact />} />
                  <Route path="/cart" element={<Cart />} />
                  <Route path="/checkout" element={<Checkout />} />
                  <Route path="/login" element={<Login />} />
                  <Route path="/register" element={<Register />} />
                  <Route path="/verify-email" element={<VerifyEmail />} />
                  <Route path="/resend-verification" element={<ResendVerification />} />
                  <Route path="/forgot-password" element={<ForgotPassword />} />
                  <Route path="/reset-password" element={<ResetPassword />} />
                  <Route path="/profile" element={<Profile />} />
                  <Route path="/orders/:id" element={<OrderDetail />} />
                  <Route path="/orders" element={<MyOrders />} />
                  <Route path="/track-order" element={<TrackOrder />} />
                  <Route path="/donate" element={<Donate />} />
                  <Route path="/favorites" element={<Favorites />} />
                  <Route path="/compare" element={<ProductComparison />} />
                  <Route path="/returns" element={<Returns />} />
                  <Route path="/return-policy" element={<ReturnPolicy />} />
                  <Route path="/addresses" element={<AddressManagement />} />
                  <Route path="/stock-alerts" element={<StockAlerts />} />
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
                  <Route path="/pet-supplies-queens-ny" element={<PetSuppliesQueensNY />} />
                  <Route path="/pet-supplies-brooklyn-ny" element={<PetSuppliesBrooklynNY />} />
                  <Route path="/pet-supplies-manhattan-ny" element={<PetSuppliesManhattanNY />} />
                  <Route path="/pet-supplies-bronx-ny" element={<PetSuppliesBronxNY />} />
                  <Route path="/pet-supplies-staten-island-ny" element={<PetSuppliesStatenIslandNY />} />
                  <Route path="/pet-supplies-jackson-heights-ny" element={<PetSuppliesJacksonHeightsNY />} />
                  {/* Business pages */}
                  <Route path="/investors" element={<Investors />} />
                  <Route path="/sell-with-us" element={<SellWithUs />} />
                  <Route path="/vendors" element={<SellWithUs />} />
                  <Route path="/partners" element={<SellWithUs />} />
                  
                  {/* NEW LEARNING CENTER GUIDES */}
                  <Route path="/learning/best-dog-food-sensitive-stomach" element={<SensitiveStomachGuide />} />
                  <Route path="/learning/best-dog-foods-sensitive-stomachs" element={<BestFoodSensitiveStomach />} />
                  
                  {/* Legal & Policy pages */}
                  <Route path="/privacy" element={<PrivacyPolicy />} />
                  <Route path="/privacy-policy" element={<PrivacyPolicy />} />
                  <Route path="/terms" element={<Terms />} />
                  <Route path="/terms-of-service" element={<Terms />} />
                  <Route path="/shipping" element={<ShippingPolicy />} />
                  <Route path="/shipping-policy" element={<ShippingPolicy />} />
                  <Route path="/accessibility" element={<Accessibility />} />
                  <Route path="/cookie-policy" element={<Navigate to="/privacy#cookies" replace />} />

                  {/* Explicit routes that must NOT be caught by /:petType */}
                  <Route path="/shop" element={<Products />} />
                  <Route path="/deals" element={<Navigate to="/products?featured=true" replace />} />

                  <Route path="/403" element={<Forbidden />} />
                  <Route path="/404" element={<NotFound />} />
                  <Route path="/:petType" element={<PetType />} />
                  <Route path="/:petType/*" element={<ProductDetail />} />
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </Suspense>
            </ErrorBoundaryWithReporting>
          </main>
          <Footer />
          <BottomNav />
        </div>
        <AIPetAdvisor />
        <CookieConsent />
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
